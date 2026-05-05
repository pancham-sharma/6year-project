from rest_framework import serializers
from .models import Message, Notification

class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.ReadOnlyField(source='sender.username')
    sender_email = serializers.ReadOnlyField(source='sender.email')
    sender_full_name = serializers.SerializerMethodField()
    receiver_username = serializers.ReadOnlyField(source='receiver.username')
    receiver_email = serializers.ReadOnlyField(source='receiver.email')
    receiver_full_name = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_username', 'sender_full_name', 'sender_email', 'receiver', 'receiver_username', 'receiver_full_name', 'receiver_email', 'message_body', 'attachment_url', 'timestamp', 'read', 'status']
        read_only_fields = ['sender', 'timestamp', 'read']

    def get_sender_full_name(self, obj):
        name = obj.sender.get_full_name()
        return name if name else obj.sender.username

    def get_receiver_full_name(self, obj):
        name = obj.receiver.get_full_name()
        return name if name else obj.receiver.username

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['user', 'timestamp']
