from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db.models import Q
from .models import Message, Notification
from .serializers import MessageSerializer, NotificationSerializer

from utils.pagination import CustomPagination

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = CustomPagination

    def get_queryset(self):
        try:
            user = self.request.user
            queryset = Message.objects.select_related('sender', 'receiver')
            
            other_user_id = self.request.query_params.get('other_user_id')
            if other_user_id:
                queryset = queryset.filter(
                    (Q(sender=user) & Q(receiver_id=other_user_id)) |
                    (Q(sender_id=other_user_id) & Q(receiver=user))
                )
            elif user.is_staff or getattr(user, 'role', None) == 'ADMIN':
                # Admins can see all messages involving any admin or staff member
                queryset = queryset.filter(
                    Q(sender__is_staff=True) | Q(receiver__is_staff=True) |
                    Q(sender__role='ADMIN') | Q(receiver__role='ADMIN')
                ).distinct()
            else:
                queryset = queryset.filter(Q(sender=user) | Q(receiver=user))
                
            return queryset
        except Exception as e:
            print(f"Chat Query Error: {e}")
            return Message.objects.none()

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    from rest_framework.decorators import action
    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        other_user_id = request.data.get('other_user_id')
        if not other_user_id:
            return Response({"error": "other_user_id is required"}, status=400)
        
        # If user is admin, mark all unread messages from other_user as read
        if request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN':
            Message.objects.filter(sender_id=other_user_id, is_read=False).update(is_read=True)
        else:
            # Regular user marks messages sent specifically to them
            Message.objects.filter(sender_id=other_user_id, receiver=request.user, is_read=False).update(is_read=True)
        return Response({"status": "success"})

    @action(detail=False, methods=['get'])
    def unread_counts(self, request):
        from django.db.models import Count
        counts = Message.objects.filter(receiver=request.user, is_read=False)\
            .values('sender')\
            .annotate(unread_count=Count('id'))
        return Response([{"user_id": c['sender'], "unread_count": c['unread_count']} for c in counts])

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            return Notification.objects.filter(user=self.request.user)
        except Exception as e:
            print(f"Notification Query Error: {e}")
            return Notification.objects.none()

    def perform_create(self, serializer):
        # Allow specifying a target user (e.g. by Admin), otherwise default to current user
        user_id = self.request.data.get('user')
        if user_id and (self.request.user.is_staff or getattr(self.request.user, 'role', None) == 'ADMIN'):
            serializer.save(user_id=user_id)
        else:
            serializer.save(user=self.request.user)
