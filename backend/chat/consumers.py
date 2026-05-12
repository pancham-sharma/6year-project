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
            # Personal group for general updates
            self.group_name = f"user_{self.user_id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            
            # Update online status
            await self.update_user_online_status(True)
            
            # If admin, join the shared admin group to see all incoming messages
            if self.user.is_staff or getattr(self.user, 'role', '') == 'ADMIN':
                await self.channel_layer.group_add("admins", self.channel_name)
                
            await self.accept()

    async def disconnect(self, close_code):
        # Update online status
        if self.user.is_authenticated:
            await self.update_user_online_status(False)
            
            # Broadcast offline status if in a room
            if hasattr(self, 'active_room'):
                await self.channel_layer.group_send(
                    self.active_room,
                    {
                        "type": "chat_user_status",
                        "user_id": str(self.user.id),
                        "is_online": False
                    }
                )
            
        # Discard from all joined rooms
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            
        if self.user.is_authenticated and (self.user.is_staff or getattr(self.user, 'role', '') == 'ADMIN'):
            try:
                await self.channel_layer.group_discard("admins", self.channel_name)
            except:
                pass
        
        # Also discard from any active room the user joined
        if hasattr(self, 'active_room'):
            await self.channel_layer.group_discard(self.active_room, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        
        if action == 'join_room':
            room_id = data.get('room_id')
            if room_id:
                try:
                    # Normalize: sort the IDs so "1_5" and "5_1" both become "chat_1_5"
                    uids = sorted([int(i) for i in str(room_id).split('_')])
                    self.active_room = f"chat_{uids[0]}_{uids[1]}"
                except:
                    self.active_room = f"chat_{room_id}"
                
                # Leave old room if any
                if hasattr(self, 'old_room') and self.old_room != self.active_room:
                    await self.channel_layer.group_discard(self.old_room, self.channel_name)
                
                await self.channel_layer.group_add(self.active_room, self.channel_name)
                self.old_room = self.active_room
                print(f"User {self.user.username} joined room {self.active_room}")
                
                # Broadcast that I'm online to this room
                await self.channel_layer.group_send(
                    self.active_room,
                    {
                        "type": "chat_user_status",
                        "user_id": str(self.user.id),
                        "is_online": True
                    }
                )
                
                # Also send the status of the other user in the room to the joining user
                try:
                    other_uid = str(room_id).replace(str(self.user.id), '').replace('_', '')
                    if other_uid:
                        other_user_status = await self.get_user_status(other_uid)
                        await self.send(text_data=json.dumps({
                            "type": "user_status",
                            "user_id": str(other_uid),
                            "is_online": other_user_status
                        }))
                except:
                    pass

        elif action == 'typing':
            if hasattr(self, 'active_room'):
                await self.channel_layer.group_send(
                    self.active_room,
                    {
                        "type": "chat_typing",
                        "user_id": str(self.user.id),
                        "username": self.user.username,
                        "is_typing": True
                    }
                )

        elif action == 'stop_typing':
            if hasattr(self, 'active_room'):
                await self.channel_layer.group_send(
                    self.active_room,
                    {
                        "type": "chat_typing",
                        "user_id": str(self.user.id),
                        "username": self.user.username,
                        "is_typing": False
                    }
                )

        elif action == 'edit_message':
            msg_id = data.get('message_id')
            new_body = data.get('message')
            await self.update_message(msg_id, new_body)

        elif action == 'delete_message':
            msg_id = data.get('message_id')
            # Handle "Delete for everyone" vs "Delete for me"
            delete_type = data.get('delete_type', 'everyone') 
            if delete_type == 'everyone':
                await self.soft_delete_message(msg_id)
            else:
                await self.delete_message_db(msg_id) # Hard delete for me (simulated)

        elif action == 'send_message':
            receiver_id = data.get('receiver_id')
            message_body = data.get('message')
            
            # Save message to database (this triggers post_save signal which handles all broadcasts)
            await self.save_message(self.user, receiver_id, message_body)

    async def chat_typing(self, event):
        await self.send(text_data=json.dumps({
            "type": "typing",
            "user_id": event["user_id"],
            "username": event["username"],
            "is_typing": event["is_typing"]
        }))

    async def chat_update(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "type": "new_message",
            "message": event["message"]
        }))

    async def chat_edit(self, event):
        await self.send(text_data=json.dumps({
            "type": "edit_message",
            "message": event["message"]
        }))

    async def chat_delete(self, event):
        await self.send(text_data=json.dumps({
            "type": "delete_message",
            "message_id": event["message_id"]
        }))

    @database_sync_to_async
    def save_message(self, sender, receiver_id, body):
        receiver = User.objects.get(id=receiver_id)
        msg = Message.objects.create(sender=sender, receiver=receiver, message=body)
        return MessageSerializer(msg).data

    @database_sync_to_async
    def update_message(self, msg_id, body):
        try:
            msg = Message.objects.get(id=msg_id)
            # Only sender can edit
            if msg.sender == self.user:
                msg.message = body
                msg.is_edited = True
                msg.save()
                return MessageSerializer(msg).data
        except:
            pass
        return None

    @database_sync_to_async
    def delete_message_db(self, msg_id):
        try:
            msg = Message.objects.get(id=msg_id)
            # Sender can delete their own message, or Admin can delete any message
            is_admin = self.user.is_staff or getattr(self.user, 'role', '') == 'ADMIN'
            if msg.sender == self.user or is_admin:
                sender_id = msg.sender.id
                receiver_id = msg.receiver.id
                msg.delete()
                return {'sender': sender_id, 'receiver': receiver_id}
        except:
            pass
        return None

    @database_sync_to_async
    def update_user_online_status(self, is_online):
        try:
            # We use a filter update to avoid signal loops if any
            User.objects.filter(id=self.user.id).update(is_online=is_online)
        except:
            pass

    async def chat_user_status(self, event):
        await self.send(text_data=json.dumps({
            "type": "user_status",
            "user_id": event["user_id"],
            "is_online": event["is_online"]
        }))

    @database_sync_to_async
    def soft_delete_message(self, msg_id):
        try:
            msg = Message.objects.get(id=msg_id)
            is_admin = self.user.is_staff or getattr(self.user, 'role', '') == 'ADMIN'
            if msg.sender == self.user or is_admin:
                msg.is_deleted = True
                msg.save()
                return MessageSerializer(msg).data
        except:
            pass
        return None

    @database_sync_to_async
    def check_is_admin(self, user_id):
        try:
            u = User.objects.get(id=user_id)
            return u.is_staff or getattr(u, 'role', '') == 'ADMIN'
        except User.DoesNotExist:
            return False

    @database_sync_to_async
    def get_user_status(self, user_id):
        try:
            u = User.objects.get(id=user_id)
            return u.is_online
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
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        
        if self.user.is_authenticated and (self.user.is_staff or getattr(self.user, 'role', '') == 'ADMIN'):
            try:
                await self.channel_layer.group_discard("admin_notifications", self.channel_name)
            except:
                pass

    async def notify_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "notification",
            "data": event["data"]
        }))
