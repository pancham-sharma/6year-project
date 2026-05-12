import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Send, Paperclip, Search, Info, Heart, X, Loader, Check, CheckCheck, Trash2, Edit2 } from 'lucide-react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getConversations, getMessages, markChatAsRead } from '../api/chat';

import { fetchAPI, getWSUrl } from '../utils/api';
import { useSearch } from '../context/SearchContext';


interface Props { darkMode: boolean; }

const quickActions = [
  { label: 'Confirm Pickup', text: '✅ Your pickup has been confirmed! Our team will be there at the scheduled time.' },
  { label: 'Request Details', text: '📋 Could you please provide more details about your donation? (type, quantity, condition)' },
  { label: 'Thank You', text: '💚 Thank you so much for your generous donation! It will make a real difference.' },
  { label: 'Reschedule', text: '📅 We need to reschedule your pickup. What dates and times work best for you?' },
];

export default function Messages({ darkMode }: Props) {
  const queryClient = useQueryClient();
  const { searchQuery } = useSearch();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [isRemoteTyping, setIsRemoteTyping] = useState(false);
  const [isRemoteOnline, setIsRemoteOnline] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 1. Fetch Conversations (Left Sidebar)
  const { data: rawConversations, isLoading: loadingConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    refetchInterval: 5000, // Background sync
  });

  // 2. Fetch Messages (Chat Area) - Infinite scroll
  const { 
    data: messagesPages, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading: loadingMsgs 
  } = useInfiniteQuery({
    queryKey: ['messages', activeId],
    queryFn: ({ pageParam }) => getMessages({ pageParam, otherUserId: activeId! }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.meta?.nextPage || undefined,
    enabled: !!activeId,
    refetchInterval: 8000, // Poll every 8s as WebSocket fallback
  });

  // Flatten messages from pages
  const allMessages = useMemo(() => {
    if (!messagesPages) return [];
    return messagesPages.pages.flatMap(page => page.data || page.results || []).reverse();
  }, [messagesPages]);

  // Fetch my profile once
  useEffect(() => {
    fetchAPI('/api/users/profile/').then(me => setMyId(me?.id ? String(me.id) : null));
  }, []);

  // WebSocket Connection
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token || !myId) return;

    const wsUrl = getWSUrl('/ws/chat/');

    
    if (import.meta.env.DEV) console.log("Connecting to WebSocket...");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (import.meta.env.DEV) console.log("WebSocket Connected");
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
      if (data.type === 'new_message') {
        const msg = data.message;
        // Update messages query
        queryClient.setQueryData(['messages', activeId], (old: any) => {
          if (!old) return old;
          const newPages = [...old.pages];
          if (newPages.length > 0) {
            // page.data holds the messages array (from CustomPagination)
            const existingData = newPages[0].data || [];
            // Remove temp message if it exists, then add real one at front
            const filtered = existingData.filter((m: any) => !m.temp || m.message !== msg.message);
            // Only add if not already present (dedup by id)
            const alreadyExists = filtered.some((m: any) => m.id === msg.id);
            newPages[0] = { ...newPages[0], data: alreadyExists ? filtered : [msg, ...filtered] };
          }
          return { ...old, pages: newPages };
        });
        
        // Update sidebar
        queryClient.setQueryData(['conversations'], (old: any) => {
          if (!old) return old;
          const convs = [...old];
          const isFromMe = String(msg.sender) === String(myId);
          const otherId = isFromMe ? String(msg.receiver) : String(msg.sender);
          
          const idx = convs.findIndex((c: any) => String(c.id) === otherId);
          
          if (idx !== -1) {
            const [target] = convs.splice(idx, 1);
            target.last_message = msg.message;
            target.last_message_time = msg.timestamp;
            // If message is from user and not current active chat, increase unread
            if (!isFromMe && String(activeId) !== otherId) {
              target.unread_count = (target.unread_count || 0) + 1;
            }
            convs.unshift(target);
          } else {
            // New conversation! (Need to fetch user info or use what we have)
            // For now, let's just invalidate to be safe, or add a placeholder
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          }
          return convs;
        });

        window.dispatchEvent(new Event('chatMessagesUpdated'));
      } else if (data.type === 'edit_message' || data.type === 'delete_message') {
        queryClient.invalidateQueries({ queryKey: ['messages', activeId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        window.dispatchEvent(new Event('chatMessagesUpdated'));
      } else if (data.type === 'typing') {
        if (String(data.user_id) === String(activeId)) {
          setIsRemoteTyping(data.is_typing);
        }
      } else if (data.type === 'user_status') {
        if (String(data.user_id) === String(activeId)) {
          setIsRemoteOnline(data.is_online);
        }
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

  const convList = useMemo(() => {
    if (!rawConversations) return [];
    return rawConversations.map((u: any) => ({
      id: String(u.id),
      userName: u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username,
      userEmail: u.email,
      avatar: (u.first_name || u.username || 'U').charAt(0).toUpperCase(),
      unread: u.unread_count || 0,
      lastMessage: u.last_message || 'No messages yet',
      lastTime: u.last_message_time ? new Date(u.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    }));
  }, [rawConversations]);

  const activeConv = useMemo(() => {
    const base = convList.find((c: any) => String(c.id) === String(activeId));
    if (!base) return null;
    return {
      ...base,
      messages: allMessages.map(m => ({
        id: m.id,
        text: m.message,
        // Determine direction: if the sender is me (the admin), it's 'sent'
        type: (String(m.sender) === String(myId) || m.sender_is_staff) ? 'sent' : 'received',
        is_read: m.is_read,
        is_edited: m.is_edited,
        isDeleted: m.is_deleted,
        timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }))
    };
  }, [convList, activeId, allMessages, myId]);

  // Auto-mark as read when new messages arrive in active chat
  useEffect(() => {
    if (activeId && allMessages.length > 0) {
      const hasUnread = allMessages.some(m => !m.is_read && String(m.sender) === activeId);
      if (hasUnread) {
        markChatAsRead(activeId).then(() => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        });
      }
    }
  }, [allMessages, activeId, queryClient]);

  // Load more trigger
  const observer = useRef<IntersectionObserver | null>(null);
  const topRef = useCallback((node: HTMLDivElement) => {
    if (loadingMsgs) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMsgs, hasNextPage, fetchNextPage]);

  const filtered = convList.filter((c: any) => !searchQuery || c.userName.toLowerCase().includes(searchQuery.toLowerCase()));


  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400';
  const chatBg = darkMode ? 'bg-gray-900' : 'bg-slate-50';
  const userItemActive = darkMode ? 'bg-green-900/30 border-green-700/50' : 'bg-emerald-50 border-emerald-200 shadow-sm z-10';
  const userItemInactive = darkMode ? 'hover:bg-gray-700/50 border-transparent' : 'hover:bg-gray-50 border-transparent';
  const sentBubble = 'bg-gradient-to-br from-green-400 to-emerald-500 text-white';
  const recvBubble = darkMode ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-800 shadow-sm';
  const divider = darkMode ? 'border-gray-700' : 'border-gray-200';

  // Scroll to bottom effect
  useEffect(() => {
    if (activeId && chatContainerRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeId, allMessages.length]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !activeId) return;
    const trimmedText = text.trim();
    
    // Optimistic Update: Create a temporary message to show immediately
    const tempMsg = {
      id: Date.now(),
      message: trimmedText,
      sender: myId,
      sender_is_staff: true,
      timestamp: new Date().toISOString(),
      is_read: false,
      temp: true
    };
    
    // Manually update the query cache to show the message instantly
    queryClient.setQueryData(['messages', activeId], (old: any) => {
      if (!old) return { pages: [{ data: [tempMsg] }], pageParams: [1] };
      const newPages = [...old.pages];
      if (newPages.length > 0) {
        newPages[0] = { ...newPages[0], data: [tempMsg, ...(newPages[0].data || [])] };
      }
      return { ...old, pages: newPages };
    });

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'send_message',
        receiver_id: activeId,
        message: trimmedText
      }));
      setInput('');
    } else {
      try {
        await fetchAPI('/api/chat/messages/', {
          method: 'POST',
          body: JSON.stringify({ receiver: activeId, message: trimmedText })
        });
        queryClient.invalidateQueries({ queryKey: ['messages', activeId] });
        setInput('');
      } catch (err) {
        console.error("Failed to send", err);
      }
    }
    // Also move this conversation to top in sidebar
    queryClient.setQueryData(['conversations'], (old: any) => {
      if (!old) return old;
      const convs = [...old];
      const idx = convs.findIndex((c: any) => String(c.id) === String(activeId));
      if (idx !== -1) {
        const [target] = convs.splice(idx, 1);
        target.last_message = trimmedText;
        target.last_message_time = new Date().toISOString();
        convs.unshift(target);
      }
      return convs;
    });
  };

  const selectConv = async (id: string) => {
    const stringId = String(id);
    setActiveId(stringId);
    setMobileShowChat(true);
    
    // Optimistically clear unread count in sidebar
    queryClient.setQueryData(['conversations'], (old: any) => {
      if (!old) return old;
      return old.map((c: any) => String(c.id) === stringId ? { ...c, unread_count: 0 } : c);
    });

    markChatAsRead(stringId).catch(err => {
      console.error("Failed to mark as read", err);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });
  };

  const editMessage = async (msgId: any, newText: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'edit_message', message_id: msgId, message: newText.trim() }));
    } else {
      await fetchAPI(`/api/chat/messages/${msgId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ message: newText.trim(), is_edited: true })
      });
      queryClient.invalidateQueries({ queryKey: ['messages', activeId] });
    }
  };

  const deleteMessage = async (msgId: any) => {
    const type = confirm("Delete for everyone? (Cancel for just me)") ? 'everyone' : 'me';
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'delete_message', message_id: msgId, delete_type: type }));
    } else {
      await fetchAPI(`/api/chat/messages/${msgId}/`, { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: ['messages', activeId] });
    }
  };

  const avatarColors = [
    'from-green-400 to-emerald-500',
    'from-blue-400 to-indigo-500',
    'from-purple-400 to-violet-500',
    'from-amber-400 to-orange-500',
    'from-pink-400 to-rose-500',
  ];

  if (loadingConvs) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader className="animate-spin text-green-500 w-8 h-8" /></div>;
  }

  return (
    <div className={`border shadow-2xl overflow-hidden flex h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] ${card} rounded-3xl transition-all duration-500`}>
      {/* Sidebar */}
      <div className={`${mobileShowChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r ${divider} flex-shrink-0 relative overflow-hidden`}>
        {/* Glassmorphism Background Overlay */}
        <div className={`absolute inset-0 z-0 ${darkMode ? 'bg-gray-800/70' : 'bg-white/70'} backdrop-blur-xl`} />
        
        {/* Sidebar Content (needs relative z-10) */}
        <div className="relative z-10 flex flex-col h-full">
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
          {loadingConvs ? (
             Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="px-4 py-3 space-y-2 animate-pulse">
                   <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="flex-1 space-y-2">
                         <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                         <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      </div>
                   </div>
                </div>
             ))
          ) : filtered.length === 0 ? (
             <div className={`text-center py-10 px-4 text-sm ${textSub}`}>
               No conversations found. Users must be registered first.
             </div>
          ) : filtered.map((conv: any, i: number) => {
            const isSelected = String(activeId) === String(conv.id);
            
            return (
              <button key={conv.id} onClick={() => selectConv(conv.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 border-b transition-all text-left ${isSelected ? userItemActive : userItemInactive} ${isSelected ? 'relative z-20' : ''}`}>
                <div className="relative flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center shadow-md ring-2 ring-white/50 transform transition-transform group-hover:scale-105`}>
                    <span className="text-white text-sm font-black">{conv.avatar}</span>
                  </div>
                  {conv.unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce-short">
                      {conv.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm font-bold truncate ${textMain}`}>{conv.userName}</p>
                    <span className={`text-[10px] font-medium flex-shrink-0 ml-2 ${textSub} opacity-70`}>{conv.lastTime}</span>
                  </div>
                  {conv.userEmail && <p className={`text-[11px] truncate ${textSub} mb-1 opacity-60`}>{conv.userEmail}</p>}
                  <p className={`text-xs truncate ${isSelected ? 'text-green-600 dark:text-green-400 font-medium' : textSub} opacity-80`}>{conv.lastMessage}</p>
                </div>
              </button>
            );
          })}
        </div>
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
                {isRemoteTyping ? (
                  <p className="text-[10px] text-green-500 font-bold animate-pulse">Typing...</p>
                ) : (
                  <p className={`text-xs ${textSub} truncate`}>{isRemoteOnline ? 'Online' : (activeConv?.userEmail || 'Offline')}</p>
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
              {/* Infinite Scroll Trigger (Top) */}
              <div ref={topRef} className="h-4 flex justify-center">
                {isFetchingNextPage && <Loader className="animate-spin text-green-500 w-4 h-4" />}
                {!hasNextPage && allMessages.length > 0 && <p className="text-[10px] text-gray-400">Beginning of conversation</p>}
              </div>

              {activeConv?.messages.length === 0 && !loadingMsgs ? (
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
                          <p className={msg.isDeleted ? 'italic opacity-50' : ''}>
                            {msg.isDeleted ? '🚫 This message was deleted' : msg.text}
                          </p>
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
                          msg.is_read ? <CheckCheck size={12} className="text-blue-400" /> : <Check size={12} className={textSub} />
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
                    onChange={e => {
                      setInput(e.target.value);
                      if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({ action: 'typing' }));
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                        typingTimeoutRef.current = setTimeout(() => {
                          wsRef.current?.send(JSON.stringify({ action: 'stop_typing' }));
                        }, 3000);
                      }
                    }}
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
