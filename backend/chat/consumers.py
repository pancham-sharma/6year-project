import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Message, Notification
from .serializers import MessageSerializer

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
        else:
            self.user_id = str(self.user.id)
            self.group_name = f"user_{self.user_id}"
            
            # Join personal group
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            
            # If admin, also join the shared admin group
            if self.user.is_staff or getattr(self.user, 'role', '') == 'ADMIN':
                await self.channel_layer.group_add("admins", self.channel_name)
                
            await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        if self.user.is_staff or getattr(self.user, 'role', '') == 'ADMIN':
            await self.channel_layer.group_discard("admins", self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        
        if action == 'send_message':
            receiver_id = data.get('receiver_id')
            message_body = data.get('message')
            
            # Save message to database
            msg_data = await self.save_message(self.user, receiver_id, message_body)
            
            # Broadcast to sender's own group (to sync multiple tabs)
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "chat_update", "message": msg_data}
            )
            
            # Broadcast to receiver
            receiver_is_admin = await self.check_is_admin(receiver_id)
            if receiver_is_admin:
                # If target is an admin, send to the shared "admins" group
                await self.channel_layer.group_send(
                    "admins",
                    {"type": "chat_update", "message": msg_data}
                )
            else:
                # Target is a regular user, send to their private group
                await self.channel_layer.group_send(
                    f"user_{receiver_id}",
                    {"type": "chat_update", "message": msg_data}
                )

    async def chat_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "new_message",
            "message": event["message"]
        }))

    @database_sync_to_async
    def save_message(self, sender, receiver_id, body):
        receiver = User.objects.get(id=receiver_id)
        msg = Message.objects.create(sender=sender, receiver=receiver, message_body=body)
        return MessageSerializer(msg).data

    @database_sync_to_async
    def check_is_admin(self, user_id):
        try:
            u = User.objects.get(id=user_id)
            return u.is_staff or u.role == 'ADMIN'
        except User.DoesNotExist:
            return False

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
        else:
            self.group_name = f"notify_{self.user.id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            
            if self.user.is_staff or getattr(self.user, 'role', '') == 'ADMIN':
                await self.channel_layer.group_add("admin_notifications", self.channel_name)
                
            await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def notify_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "notification",
            "data": event["data"]
        }))
