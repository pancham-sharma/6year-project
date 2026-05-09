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
        
        # If user is admin, mark all unread messages from other_user as read
        if request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN':
            Message.objects.filter(sender_id=other_user_id, read=False).update(read=True)
        else:
            # Regular user marks messages sent specifically to them
            Message.objects.filter(sender_id=other_user_id, receiver=request.user, read=False).update(read=True)
        return Response({"status": "success"})

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
