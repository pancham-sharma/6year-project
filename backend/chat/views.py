from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db.models import Q
from .models import Message, Notification
from .serializers import MessageSerializer, NotificationSerializer

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None # Disable pagination to show all chat history

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'role', None) == 'ADMIN':
            # Admins can see all messages involving any admin or staff member
            return Message.objects.filter(
                Q(sender__is_staff=True) | Q(receiver__is_staff=True) |
                Q(sender__role='ADMIN') | Q(receiver__role='ADMIN')
            ).distinct()
        return Message.objects.filter(Q(sender=user) | Q(receiver=user))

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    from rest_framework.decorators import action
    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        other_user_id = request.data.get('other_user_id')
        if not other_user_id:
            return Response({"error": "other_user_id is required"}, status=400)
        
        # Mark all messages from other_user to me as read
        Message.objects.filter(sender_id=other_user_id, receiver=request.user, read=False).update(read=True)
        return Response({"status": "success"})

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
