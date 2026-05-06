import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Search, Info, Heart, X, Loader, Check, CheckCheck, Trash2, Edit2 } from 'lucide-react';

import { fetchAPI } from '../utils/api';
import { useSearch } from '../context/SearchContext';


interface Props { darkMode: boolean; }

const quickActions = [
  { label: 'Confirm Pickup', text: '✅ Your pickup has been confirmed! Our team will be there at the scheduled time.' },
  { label: 'Request Details', text: '📋 Could you please provide more details about your donation? (type, quantity, condition)' },
  { label: 'Thank You', text: '💚 Thank you so much for your generous donation! It will make a real difference.' },
  { label: 'Reschedule', text: '📅 We need to reschedule your pickup. What dates and times work best for you?' },
];

export default function Messages({ darkMode }: Props) {
  const { searchQuery } = useSearch();
  const [convList, setConvList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  
  const [input, setInput] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [convList, activeId]);

  // Group messages into conversations
  useEffect(() => {
    const fetchChat = async () => {
      try {
        const [msgsRes, usersRes, meRes] = await Promise.all([
          fetchAPI('/api/chat/messages/').catch(() => []),
          fetchAPI('/api/users/list/').catch(() => []),
          fetchAPI('/api/users/profile/').catch(() => null)
        ]);
        
        const rawMessages = (msgsRes.results || msgsRes || []).filter((m: any) => m.status !== 'Recycled');
        const allUsers = usersRes.results || usersRes || [];
        
        const myIdVal = meRes?.id ? String(meRes.id) : null;
        setMyId(myIdVal);
        const myName = meRes?.username || 'admin';
        
        if (myName) { /* used in the loop below */ }
        
        const adminIds = new Set(allUsers.filter((u: any) => u.role === 'ADMIN' || u.is_staff || u.is_superuser).map((u: any) => String(u.id)));
        if (myIdVal) adminIds.add(String(myIdVal));

        const conversationsMap: any = {};
        rawMessages.forEach((m: any) => {
          const senderIsAdmin = adminIds.has(String(m.sender));
          const receiverIsAdmin = adminIds.has(String(m.receiver));
          
          let otherUser, otherUserName, otherUserEmail, isSentByMe;

          if (senderIsAdmin && !receiverIsAdmin) {
            // Admin sending to user
            otherUser = m.receiver;
            otherUserName = m.receiver_full_name || m.receiver_username;
            otherUserEmail = m.receiver_email;
            isSentByMe = String(m.sender) === myIdVal || m.sender_username === myName || m.sender_username?.toLowerCase().includes('admin');
          } else if (!senderIsAdmin && receiverIsAdmin) {
            // User sending to admin
            otherUser = m.sender;
            otherUserName = m.sender_full_name || m.sender_username;
            otherUserEmail = m.sender_email;
            isSentByMe = false;
          } else {
            // Both admins or both users
            isSentByMe = String(m.sender) === String(myIdVal) || m.sender_username === myName;
            otherUser = isSentByMe ? m.receiver : m.sender;
            otherUserName = isSentByMe ? (m.receiver_full_name || m.receiver_username) : (m.sender_full_name || m.sender_username);
            otherUserEmail = isSentByMe ? m.receiver_email : m.sender_email;
          }

          otherUserName = otherUserName || otherUserEmail || `User ${otherUser}`;

          if (!conversationsMap[otherUser]) {
            conversationsMap[otherUser] = {
              id: otherUser.toString(),
              userName: otherUserName,
              userEmail: otherUserEmail,
              avatar: otherUserName.charAt(0).toUpperCase(),
              messages: [],
              unread: 0,
              lastMessage: '',
              lastTime: '',
              lastTimestamp: 0
            };
          }
          
          conversationsMap[otherUser].messages.push({
            id: m.id,
            text: m.message_body,
            type: isSentByMe ? 'sent' : 'received',
            read: m.read ?? false,
            is_edited: m.is_edited,
            status: m.status || 'Active',
            timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          
          conversationsMap[otherUser].lastMessage = m.message_body;
          conversationsMap[otherUser].lastTime = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          const msgTimestamp = new Date(m.timestamp).getTime();
          if (msgTimestamp > conversationsMap[otherUser].lastTimestamp) {
            conversationsMap[otherUser].lastTimestamp = msgTimestamp;
          }
          
          // Only count unread if NOT sent by me AND NOT from the currently active chat
          if (!m.read && !isSentByMe && String(activeId) !== String(otherUser)) {
            conversationsMap[otherUser].unread += 1;
          }
        });

        // Add empty states for all registered users so admin can initiate chats
        allUsers.forEach((u: any) => {
           if (!conversationsMap[u.id] && String(u.id) !== String(myId)) {
             conversationsMap[u.id] = {
               id: u.id.toString(),
               userName: u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username,
               userEmail: u.email,
               avatar: (u.first_name || u.username).charAt(0).toUpperCase(),
               messages: [],
               unread: 0,
               lastMessage: 'Start a conversation...',
               lastTime: '',
               lastTimestamp: 0,
             };
           }
        });

        // Sort formattedConvs by lastTimestamp (newest first)
        const formattedConvs: any[] = Object.values(conversationsMap);
        
        setConvList(prev => {
           const updated = formattedConvs.map(newC => {
              const oldC = prev.find(oc => String(oc.id) === String(newC.id));
              if (!oldC) return newC;
              
              // Keep temp messages that aren't yet confirmed by the server
              const tempMsgs = oldC.messages.filter((om: any) => 
                String(om.id).startsWith('temp-') && 
                !newC.messages.some((nm: any) => nm.text === om.text && nm.type === om.type)
              );

              return {
                ...newC,
                messages: [...newC.messages, ...tempMsgs]
              };
           });
           return [...updated].sort((a: any, b: any) => b.lastTimestamp - a.lastTimestamp);
        });
        
        // Handle selection from notification state
        const navState = (window as any)._navState;
        const selectUser = navState?.selectUser;
        if (selectUser) {
          const target = formattedConvs.find(c => c.userName === selectUser || c.userEmail === selectUser || c.id === String(selectUser));
          if (target) {
            setActiveId(target.id);
            setMobileShowChat(true);
          }
          // Clear state after use
          (window as any)._navState = null;
        } else if (formattedConvs.length > 0 && !activeId) {
          const firstId = formattedConvs[0].id;
          setActiveId(firstId);
        }
      } catch (err) {
        console.error("Failed to load messages", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChat();
    const interval = setInterval(fetchChat, 2000);
    return () => clearInterval(interval);
  }, [activeId]);

  // WebSocket Connection
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token || !myId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `${window.location.hostname}:8000` 
      : 'donation-admin-panel.onrender.com';
    const wsUrl = `${protocol}://${host}/ws/chat/?token=${token}`;

    
    console.log("Connecting to WebSocket:", wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket Connected");
      // If we already have an activeId, join its room immediately
      if (activeId) {
        const ids = [parseInt(myId), parseInt(activeId)].sort((a, b) => a - b);
        ws.send(JSON.stringify({
          action: 'join_room',
          room_id: `${ids[0]}_${ids[1]}`
        }));
      }
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log("WebSocket Message Received:", data);

      if (data.type === 'new_message') {
        const m = data.message;
        setConvList(prev => {
          const senderId = String(m.sender);
          const receiverId = String(m.receiver);
          const otherId = senderId === myId ? receiverId : senderId;
          
          const exists = prev.some(c => String(c.id) === String(otherId));
          
          if (!exists) {
            return prev; 
          }

          return prev.map(c => {
             if (String(c.id) !== String(otherId)) return c;
             
             const isSentByMe = String(m.sender) === myId;
             
             // Check if this message (by ID or exact content) is already there
             const isDuplicate = c.messages.some((existing: any) => 
               String(existing.id) === String(m.id) || 
               (String(existing.id).startsWith('temp-') && existing.text === m.message_body && existing.type === (isSentByMe ? 'sent' : 'received'))
             );

             const newMsg = {
               id: m.id,
               text: m.message_body,
               type: isSentByMe ? 'sent' : 'received',
               read: m.read ?? false,
               is_edited: m.is_edited,
               status: m.status || 'Active',
               timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
             };

             if (isDuplicate) {
               // Replace the optimistic temp message with the real server message
               return {
                 ...c,
                 messages: c.messages.map((msg: any) => 
                   (String(msg.id).startsWith('temp-') && msg.text === m.message_body && msg.type === (isSentByMe ? 'sent' : 'received'))
                   ? newMsg : msg
                 ),
                 lastMessage: m.message_body,
                 lastTime: newMsg.timestamp,
                 lastTimestamp: new Date(m.timestamp).getTime()
               };
             }

             return {
               ...c,
               messages: [...c.messages, newMsg],
               lastMessage: m.message_body,
               lastTime: newMsg.timestamp,
               lastTimestamp: new Date(m.timestamp).getTime(),
               unread: (!m.read && !isSentByMe && String(activeId) !== String(otherId)) ? c.unread + 1 : c.unread
             };
          }).sort((a: any, b: any) => b.lastTimestamp - a.lastTimestamp);
        });
      } else if (data.type === 'edit_message') {
        const m = data.message;
        setConvList(prev => prev.map(c => ({
          ...c,
          messages: c.messages.map((msg: any) => String(msg.id) === String(m.id) ? { ...msg, text: m.message_body, is_edited: true } : msg),
          lastMessage: String(c.messages[c.messages.length - 1]?.id) === String(m.id) ? m.message_body : c.lastMessage
        })));
      } else if (data.type === 'delete_message') {
        const mid = data.message_id;
        setConvList(prev => prev.map(c => ({
          ...c,
          messages: c.messages.map((msg: any) => String(msg.id) === String(mid) ? { ...msg, text: '[Message Deleted]', isDeleted: true } : msg),
          lastMessage: String(c.messages[c.messages.length - 1]?.id) === String(mid) ? '[Message Deleted]' : c.lastMessage
        })));
      }
    };

    ws.onerror = (err) => console.error("WebSocket Error:", err);
    ws.onclose = () => console.log("WebSocket Disconnected");

    return () => ws.close();
  }, [myId]); // Only reconnect if myId changes (unlikely)

  // Join room when activeId changes
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && activeId && myId) {
      const ids = [parseInt(myId), parseInt(activeId)].sort((a, b) => a - b);
      wsRef.current.send(JSON.stringify({
        action: 'join_room',
        room_id: `${ids[0]}_${ids[1]}`
      }));
      console.log(`Joining room: ${ids[0]}_${ids[1]}`);
    }
  }, [activeId, myId]);

  const activeConv = convList.find(c => c.id === activeId);

  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400';
  const sidebarBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const chatBg = darkMode ? 'bg-gray-900' : 'bg-slate-50';
  const userItemActive = darkMode ? 'bg-green-900/30 border-green-700/50' : 'bg-emerald-50 border-emerald-200 shadow-sm z-10';
  const userItemInactive = darkMode ? 'hover:bg-gray-700/50 border-transparent' : 'hover:bg-gray-50 border-transparent';
  const sentBubble = 'bg-gradient-to-br from-green-400 to-emerald-500 text-white';
  const recvBubble = darkMode ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-800 shadow-sm';
  const divider = darkMode ? 'border-gray-700' : 'border-gray-200';

  useEffect(() => {
    if (activeId && chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;
      
      const lastMsg = activeConv?.messages[activeConv.messages.length - 1];
      const isMe = lastMsg && lastMsg.type === 'sent';

      if (isAtBottom || isMe) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [activeId, activeConv?.messages.length]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !activeId) return;
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'send_message',
        receiver_id: activeId,
        message: text.trim()
      }));
      setInput('');
    } else {
      // Optimistic Update
      const tempId = `temp-${Date.now()}`;
      const newMsg = {
        id: tempId,
        text: text.trim(),
        type: 'sent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false
      };
      setConvList(prev => prev.map((c: any) => 
        String(c.id) === String(activeId) ? { ...c, messages: [...c.messages, newMsg], lastMessage: text.trim(), lastTime: 'Just now' } : c
      ));
      setInput('');

      try {
        await fetchAPI('/api/chat/messages/', {
          method: 'POST',
          body: JSON.stringify({
            receiver: activeId,
            message_body: text.trim()
          })
        });
      } catch (err) {
        setConvList(prev => prev.map((c: any) => 
          String(c.id) === String(activeId) ? { ...c, messages: c.messages.filter((m: any) => m.id !== tempId) } : c
        ));
        console.error("Failed to send message", err);
      }
    }
  };

  const editMessage = async (msgId: any, newText: string) => {
    if (!newText.trim()) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'edit_message',
        message_id: msgId,
        message: newText.trim()
      }));
    } else {
      try {
        await fetchAPI(`/api/chat/messages/${msgId}/`, {
          method: 'PATCH',
          body: JSON.stringify({ message_body: newText.trim(), is_edited: true })
        });
        setConvList((prev: any[]) => prev.map((c: any) => ({
          ...c,
          messages: c.messages.map((m: any) => m.id === msgId ? { ...m, text: newText.trim(), is_edited: true } : m)
        })));
      } catch (err) {
        console.error("Failed to edit message", err);
      }
    }
  };

  const selectConv = async (id: string) => {
    const stringId = String(id);
    setActiveId(stringId);
    setMobileShowChat(true);

    // Find the conversation
    const conv = convList.find(c => String(c.id) === stringId);
    if (!conv) return;
    
    // Clear unread count IMMEDIATELY in state
    setConvList((prev: any[]) => prev.map((c: any) =>
      String(c.id) === stringId
        ? { ...c, unread: 0, messages: c.messages.map((m: any) => ({ ...m, read: true })) }
        : c
    ));

    // Persist the read status to the backend using the bulk mark_read action
    try {
      await fetchAPI('/api/chat/messages/mark_read/', {
        method: 'POST',
        body: JSON.stringify({ other_user_id: stringId })
      });
    } catch (err) {
      console.warn("Failed to persist read status:", err);
    }
  };

  const deleteMessage = async (msgId: any) => {
    if (!confirm("Permanently delete this message?")) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'delete_message',
        message_id: msgId
      }));
    } else {
      try {
        await fetchAPI(`/api/chat/messages/${msgId}/`, {
          method: 'DELETE'
        });
        setConvList(prev => prev.map(c => ({
          ...c,
          messages: c.messages.filter((m: any) => m.id !== msgId)
        })));
      } catch (err) {
        console.error("Failed to delete message", err);
      }
    }
  };

  const combinedSearch = (searchQuery + ' ' + localSearch).trim().toLowerCase();
  const filtered = convList.filter(c => !combinedSearch || c.userName.toLowerCase().includes(combinedSearch));


  const avatarColors = [
    'from-green-400 to-emerald-500',
    'from-blue-400 to-indigo-500',
    'from-purple-400 to-violet-500',
    'from-amber-400 to-orange-500',
    'from-pink-400 to-rose-500',
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader className="animate-spin text-green-500 w-8 h-8" /></div>;
  }

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden flex h-[calc(100vh-10rem)] min-h-[500px] ${card}`}>
      {/* Sidebar */}
      <div className={`${mobileShowChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 lg:w-80 border-r ${divider} flex-shrink-0 ${sidebarBg}`}>
        {/* Header */}
        <div className={`px-4 py-4 border-b ${divider}`}>
          <h2 className={`font-bold text-base mb-3 ${textMain}`}>Messages</h2>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${inputBg}`}>
            <Search size={13} className={textSub} />
            <input className="bg-transparent outline-none flex-1 text-sm" placeholder="Filter chats on this page..." value={localSearch} onChange={e => setLocalSearch(e.target.value)} />
            {localSearch && <button onClick={() => setLocalSearch('')}><X size={12} className={textSub} /></button>}
          </div>

        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto py-2">
          {filtered.length === 0 ? (
             <div className={`text-center py-10 px-4 text-sm ${textSub}`}>
               No conversations found. Users must be registered first.
             </div>
          ) : filtered.map((conv, i) => {
            const isSelected = String(activeId) === String(conv.id);
            
            return (
              <button key={conv.id} onClick={() => selectConv(conv.id)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 border transition-all text-left ${isSelected ? userItemActive : userItemInactive}`}>
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <span className="text-white text-xs font-bold">{conv.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm font-semibold truncate ${textMain}`}>{conv.userName}</p>
                    <span className={`text-xs flex-shrink-0 ml-2 ${textSub}`}>{conv.lastTime}</span>
                  </div>
                  {conv.userEmail && <p className={`text-[10px] truncate ${textSub} mb-1 opacity-80`}>{conv.userEmail}</p>}
                  <p className={`text-xs truncate ${textSub}`}>{conv.lastMessage}</p>
                  {conv.donationRef && (
                    <span className="text-xs text-green-500 font-mono">{conv.donationRef}</span>
                  )}
                </div>
                {conv.unread > 0 && (
                  <div className="flex flex-col items-end gap-1">
                    <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                      {conv.unread}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${!mobileShowChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0`}>
        {activeId && activeConv ? (
          <>
            {/* Chat Header */}
            <div className={`px-5 py-3.5 border-b ${divider} flex items-center gap-3 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <button onClick={() => setMobileShowChat(false)} className={`md:hidden p-1.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                <X size={16} />
              </button>
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm`}>
                <span className="text-white text-xs font-bold">{activeConv?.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${textMain}`}>{activeConv?.userName}</p>
                <p className={`text-xs ${textSub} truncate`}>{activeConv?.userEmail}</p>
                {activeConv?.donationRef && (
                  <p className="text-xs text-green-500 font-mono">Ref: {activeConv.donationRef}</p>
                )}
              </div>
              <div className="flex gap-1">
                <button className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><Info size={15} /></button>
              </div>
            </div>

            {/* Donation Ref Card */}
            {activeConv?.donationRef && (
              <div className={`px-5 py-2.5 border-b ${divider} ${darkMode ? 'bg-green-900/10' : 'bg-green-50/60'}`}>
                <div className="flex items-center gap-2">
                  <Heart size={12} className="text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Donation Context: </span>
                  <span className="text-xs text-green-500 font-mono font-semibold">{activeConv.donationRef}</span>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              className={`flex-1 overflow-y-auto p-4 space-y-4 ${chatBg} custom-scrollbar`}
            >
              {activeConv?.messages.length === 0 ? (
                 <div className={`text-center py-10 text-sm ${textSub}`}>No messages yet. Send a message to start the conversation!</div>
              ) : activeConv?.messages.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                  {msg.type === 'received' && (
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 mr-2 mt-auto shadow-sm`}>
                      <span className="text-white text-xs font-bold">{activeConv.avatar}</span>
                    </div>
                  )}
                  <div className={`max-w-[70%] group`}>
                    {msg.type === 'received' && (
                      <p className={`text-[10px] mb-1 ml-1 font-medium ${textSub}`}>{activeConv.userEmail}</p>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.type === 'sent' ? `${sentBubble} rounded-br-md` : `${recvBubble} rounded-bl-md`}`}>
                      {editingId === msg.id ? (
                        <div className="flex flex-col gap-2 min-w-[150px]">
                          <textarea 
                            className="bg-transparent border-b border-white/30 outline-none w-full resize-none text-white placeholder-white/50" 
                            autoFocus
                            value={editText} 
                            onChange={e => setEditText(e.target.value)} 
                          />
                          <div className="flex justify-end gap-3 mt-1">
                            <button onClick={() => setEditingId(null)} className="text-[10px] text-white/70 hover:text-white">Cancel</button>
                            <button onClick={() => { editMessage(msg.id, editText); setEditingId(null); }} className="text-[10px] font-bold text-white bg-white/20 px-2 py-0.5 rounded">Save</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <p className={msg.isDeleted ? 'italic opacity-50' : ''}>{msg.text}</p>
                          {msg.is_edited && !msg.isDeleted && (
                            <span className={`text-[8px] mt-1 opacity-50 uppercase tracking-tighter ${msg.type === 'sent' ? 'text-white' : textSub}`}>
                              Edited
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className={`flex items-center gap-1 ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                        <p className={`text-[10px] ${textSub}`}>{msg.timestamp}</p>
                        {msg.type === 'sent' && (
                          msg.read ? <CheckCheck size={12} className="text-blue-400" /> : <Check size={12} className={textSub} />
                        )}
                      </div>
                      
                      <div className={`flex gap-1 ${msg.type === 'sent' ? 'order-first' : 'order-last'}`}>
                        {msg.type === 'sent' && (
                          <button 
                            onClick={() => { setEditingId(msg.id); setEditText(msg.text); }}
                            className={`p-1 rounded-md hover:bg-emerald-50 text-emerald-400 hover:text-emerald-500 transition-colors`}
                          >
                            <Edit2 size={10} />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteMessage(msg.id)}
                          className={`p-1 rounded-md hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors`}
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className={`px-4 py-2 border-t ${divider} ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {quickActions.map(a => (
                  <button key={a.label} onClick={() => sendMessage(a.text)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                      ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-green-600 hover:text-green-400' : 'border-gray-200 text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700'}`}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className={`px-4 py-3.5 border-t ${divider} ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center gap-3">
                <button className={`p-2 rounded-xl transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}>
                  <Paperclip size={16} />
                </button>
                <div className={`flex-1 flex items-center px-4 py-2.5 rounded-2xl border transition-all ${darkMode ? 'bg-gray-700 border-gray-600 focus-within:border-green-500' : 'bg-gray-50 border-gray-200 focus-within:border-green-400'}`}>
                  <input
                    className="bg-transparent outline-none text-sm flex-1"
                    placeholder="Type a message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
                  />
                </div>
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${darkMode ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200'}`}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-10 text-center">
            <div className={`text-sm ${textSub}`}>Select a conversation to start messaging.</div>
          </div>
        )}
      </div>
    </div>
  );
}
