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
            queryset = Message.objects.select_related('sender', 'receiver').order_by('-timestamp')
            
            other_user_id = self.request.query_params.get('other_user_id')
            if other_user_id:
                if user.is_staff or getattr(user, 'role', '') == 'ADMIN':
                    queryset = queryset.filter(
                        (Q(sender__is_staff=True, receiver_id=other_user_id)) |
                        (Q(sender_id=other_user_id, receiver__is_staff=True)) |
                        (Q(sender__role='ADMIN', receiver_id=other_user_id)) |
                        (Q(sender_id=other_user_id, receiver__role='ADMIN'))
                    ).distinct()
                else:
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
    def total_unread(self, request):
        count = Message.objects.filter(receiver=request.user, is_read=False).count()
        return Response({"count": count})

    @action(detail=False, methods=['get'])
    def unread_counts(self, request):
        from django.db.models import Count
        counts = Message.objects.filter(receiver=request.user, is_read=False)\
            .values('sender')\
            .annotate(unread_count=Count('id'))
        return Response([{"user_id": c['sender'], "unread_count": c['unread_count']} for c in counts])

    @action(detail=False, methods=['get'])
    def conversations(self, request):
        from django.db.models import Q
        from users.models import User
        from users.serializers import UserSerializer

        user = request.user
        is_admin = user.is_staff or getattr(user, 'role', '') == 'ADMIN'
        
        # 1. Find all users who have exchanged messages
        if is_admin:
            # Admins see conversations between ANY staff/admin and users
            messages = Message.objects.filter(
                Q(sender__is_staff=True) | Q(receiver__is_staff=True) |
                Q(sender__role='ADMIN') | Q(receiver__role='ADMIN')
            ).order_by('-timestamp')
        else:
            messages = Message.objects.filter(Q(sender=user) | Q(receiver=user)).order_by('-timestamp')

        # Get unique participant IDs (excluding admins if current user is admin, or excluding self if regular user)
        participant_ids = set()
        for m in messages.values('sender_id', 'receiver_id', 'sender__is_staff', 'sender__role', 'receiver__is_staff', 'receiver__role'):
            # If current user is admin, we want the OTHER side of the conversation (the regular user)
            # A conversation is between (Staff/Admin) and (Non-Staff/Non-Admin)
            s_is_staff = m['sender__is_staff'] or m['sender__role'] == 'ADMIN'
            r_is_staff = m['receiver__is_staff'] or m['receiver__role'] == 'ADMIN'
            
            if s_is_staff and not r_is_staff:
                participant_ids.add(m['receiver_id'])
            elif r_is_staff and not s_is_staff:
                participant_ids.add(m['sender_id'])
            elif not s_is_staff and not r_is_staff:
                # User to User (shouldn't happen in this system but handle it)
                if m['sender_id'] != user.id: participant_ids.add(m['sender_id'])
                if m['receiver_id'] != user.id: participant_ids.add(m['receiver_id'])

        results = []
        already_added = set()
        
        # Process users with messages
        for p_id in participant_ids:
            try:
                p_user = User.objects.get(id=p_id)
                if is_admin:
                    last_msg = Message.objects.filter(
                        (Q(sender__is_staff=True) | Q(sender__role='ADMIN')) & Q(receiver=p_user) |
                        (Q(receiver__is_staff=True) | Q(receiver__role='ADMIN')) & Q(sender=p_user)
                    ).order_by('-timestamp').first()
                else:
                    last_msg = Message.objects.filter(
                        (Q(sender=user) & Q(receiver=p_user)) | 
                        (Q(sender=p_user) & Q(receiver=user))
                    ).order_by('-timestamp').first()
                
                if is_admin:
                    # For admins, count unread messages from this user sent to ANY admin/staff
                    unread_count = Message.objects.filter(
                        sender=p_user, 
                        is_read=False
                    ).filter(Q(receiver__is_staff=True) | Q(receiver__role='ADMIN')).count()
                else:
                    unread_count = Message.objects.filter(
                        sender=p_user, receiver=user, is_read=False
                    ).count()
                
                user_data = UserSerializer(p_user, context={'request': request}).data
                results.append({
                    **user_data,
                    'last_message': last_msg.message if last_msg else None,
                    'last_message_time': last_msg.timestamp.isoformat() if last_msg else None,
                    'unread_count': unread_count
                })
                already_added.add(p_id)
            except User.DoesNotExist:
                continue
                
        # 2. If admin, add users who have NO messages yet
        if is_admin:
            other_users = User.objects.exclude(id__in=already_added).exclude(is_staff=True).exclude(role='ADMIN')
            for o_user in other_users:
                user_data = UserSerializer(o_user, context={'request': request}).data
                results.append({
                    **user_data,
                    'last_message': None,
                    'last_message_time': None,
                    'unread_count': 0
                })
        
        # Sort by last message time (latest first)
        results.sort(key=lambda x: (x['last_message_time'] is not None, x['last_message_time'] or '', x['username']), reverse=True)
        
        return Response(results)

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
