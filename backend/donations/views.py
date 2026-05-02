import io
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from django.http import FileResponse
from .models import Donation, PickupDetails, Category
from .serializers import DonationSerializer, PickupDetailsSerializer, CategorySerializer
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.units import inch

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and request.user.is_admin()

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]

class DonationViewSet(viewsets.ModelViewSet):
    serializer_class = DonationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'category', 'timestamp']
    search_fields = ['quantity_description']
    ordering_fields = ['timestamp', 'status']

    def get_permissions(self):
        """public_stats is open to everyone; all other actions require a valid JWT."""
        if self.action == 'public_stats':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Donation.objects.none()
        if user.is_staff or user.is_admin():
            return Donation.objects.all()
        return Donation.objects.filter(donor=user)

    @action(detail=False, methods=['get'])
    def public_stats(self, request):
        User = get_user_model()
        from inventory.models import InventoryItem
        
        return Response({
            'total_donations': Donation.objects.count(),
            'total_donors': User.objects.count(),
            'food_meals': Donation.objects.filter(category='Food').count() * 10, # Mock 10 meals per donation
            'trees_planted': Donation.objects.filter(category='Environment').count() * 5,
            
            # Where it goes percentages (dynamic based on DB inventory distribution)
            'distribution': {
                'food': InventoryItem.objects.filter(category='Food').count() * 20,
                'education': InventoryItem.objects.filter(category='Books').count() * 20,
                'green': InventoryItem.objects.filter(category='Environment').count() * 20,
            }
        })

    def perform_create(self, serializer):
        serializer.save(donor=self.request.user)

    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        donation = self.get_object()
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
        styles = getSampleStyleSheet()
        
        # Define Styles
        brand_color = colors.HexColor("#22c55e")
        accent_color = colors.HexColor("#f59e0b")
        text_color = colors.HexColor("#1e293b")
        subtext_color = colors.HexColor("#64748b")
        
        title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], alignment=TA_CENTER, textColor=brand_color, fontSize=22, spaceAfter=12)
        subtext_style = ParagraphStyle('SubtextStyle', parent=styles['Normal'], alignment=TA_CENTER, textColor=subtext_color, fontSize=11, spaceAfter=24)
        label_style = ParagraphStyle('LabelStyle', parent=styles['Normal'], textColor=colors.HexColor("#94a3b8"), fontSize=9, fontName='Helvetica-Bold')
        value_style = ParagraphStyle('ValueStyle', parent=styles['Normal'], textColor=text_color, fontSize=11, spaceAfter=8)
        
        impact_bg = colors.HexColor("#f0fdf4")
        impact_text_color = colors.HexColor("#166534")
        impact_style = ParagraphStyle('ImpactStyle', parent=styles['Normal'], textColor=impact_text_color, fontSize=13, fontName='Helvetica-Bold', alignment=TA_CENTER, backColor=impact_bg, borderPadding=12, leading=18)
        
        emotional_style = ParagraphStyle('EmotionalStyle', parent=styles['Normal'], textColor=accent_color, fontSize=11, fontName='Helvetica-Oblique', alignment=TA_CENTER, spaceBefore=20)

        elements = []

        # Logo / Platform
        elements.append(Paragraph("Seva Marg", ParagraphStyle('Logo', parent=styles['Normal'], textColor=brand_color, fontSize=16, fontName='Helvetica-Bold', alignment=TA_CENTER)))
        elements.append(Spacer(1, 15))
        
        # Header
        elements.append(Paragraph("❤️ Thank You for Your Kindness", title_style))
        elements.append(Paragraph("Your support is making a real difference", subtext_style))
        elements.append(Spacer(1, 10))

        # Donor Info Section (Side by Side)
        status_color = brand_color if donation.status == 'Completed' else accent_color
        status_style = ParagraphStyle('StatusStyle', parent=value_style, textColor=status_color, fontName='Helvetica-Bold')

        info_data = [
            [Paragraph("👤 DONOR NAME", label_style), Paragraph("📅 DATE", label_style)],
            [Paragraph(f"{donation.donor.first_name or donation.donor.username}", value_style), Paragraph(f"{donation.timestamp.strftime('%B %d, %Y')}", value_style)],
            [Paragraph("🧾 RECEIPT ID", label_style), Paragraph("🟢 STATUS", label_style)],
            [Paragraph(f"#{donation.id:04d}", value_style), Paragraph(f"{donation.status}", status_style)]
        ]
        
        info_table = Table(info_data, colWidths=[2.2*inch, 2.2*inch])
        info_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 20))

        # Details
        elements.append(Paragraph(f"<b>Category:</b> {donation.category}", value_style))
        elements.append(Paragraph(f"<b>Description:</b> {donation.quantity_description}", value_style))
        elements.append(Spacer(1, 15))

        # Footer
        elements.append(Spacer(1, 40))
        elements.append(Paragraph("© 2025 Seva Marg • Digital Donation Receipt", ParagraphStyle('Footer', parent=styles['Normal'], textColor=colors.HexColor("#94a3b8"), fontSize=8, alignment=TA_CENTER)))

        # Build directly to the buffer
        doc.build(elements)
        buffer.seek(0)
        
        return FileResponse(buffer, as_attachment=True, filename=f'donation_receipt_{donation.id:04d}.pdf')

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def assign_volunteer(self, request, pk=None):
        donation = self.get_object()
        volunteer_id = request.data.get('volunteer_id')
        try:
            pickup = donation.pickup_details
            pickup.volunteer_id = volunteer_id
            pickup.save()
            
            # Change status to scheduled if it was pending
            if donation.status == 'Pending':
                donation.status = 'Scheduled'
                donation.save()
                
            return Response({'status': 'Volunteer assigned'})
        except PickupDetails.DoesNotExist:
            return Response({'error': 'No pickup details found for this donation'}, status=status.HTTP_400_BAD_REQUEST)
