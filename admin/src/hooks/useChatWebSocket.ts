import { useEffect, useRef, useState } from 'react';
import { getWSUrl } from '../utils/api';

export const useChatWebSocket = (roomId: string | null, onMessage: (msg: any) => void) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const url = getWSUrl('/ws/chat/');
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ action: 'join_room', room_id: roomId }));
    };

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'typing') {
        if (data.user_id !== localStorage.getItem('user_id')) {
          setTypingUser(data.is_typing ? data.username : null);
          setIsTyping(data.is_typing);
        }
      } else {
        onMessage(data);
      }
    };

    return () => {
      socket.close();
    };
  }, [roomId, onMessage]);

  const sendTyping = (typing: boolean) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ 
        action: typing ? 'typing' : 'stop_typing' 
      }));
    }
  };

  const sendMessage = (text: string, receiverId: string) => {
     if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          action: 'send_message',
          message: text,
          receiver_id: receiverId
        }));
     }
  };

  return { isTyping, typingUser, sendTyping, sendMessage };
};
