import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Search, Info, Heart, X, Loader, Check, CheckCheck } from 'lucide-react';

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
  
  const [input, setInput] = useState('');
  const [localSearch, setLocalSearch] = useState('');

  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Group messages into conversations
  useEffect(() => {
    const fetchChat = async () => {
      try {
        const [msgsRes, usersRes] = await Promise.all([
          fetchAPI('/api/chat/messages/').catch(() => []),
          fetchAPI('/api/users/list/').catch(() => [])
        ]);
        
        const rawMessages = msgsRes.results || msgsRes || [];
        const allUsers = usersRes.results || usersRes || [];
        
        // Find my ID assuming I am the logged in admin
        // Since we don't have a direct /me/ endpoint right now, we infer based on sender/receiver patterns
        // We'll group conversations by the "other" user
        const adminName = 'admin'; // Fallback
        
        const conversationsMap: any = {};
        
        rawMessages.forEach((m: any) => {
          // If I am sender, other is receiver. If I am receiver, other is sender.
          // Since we don't strictly know our own ID, we'll assume the admin is receiving or sending
          const isSentByMe = m.sender === adminName || m.sender_username === adminName; // Adjust based on serializer
          const otherUser = isSentByMe ? m.receiver : m.sender;
          const otherUserName = m.receiver_username || m.sender_username || `User ${otherUser}`;

          if (!conversationsMap[otherUser]) {
            conversationsMap[otherUser] = {
              id: otherUser.toString(),
              userName: otherUserName,
              avatar: otherUserName.charAt(0).toUpperCase(),
              messages: [],
              unread: 0,
              lastMessage: '',
              lastTime: '',
            };
          }
          
          conversationsMap[otherUser].messages.push({
            id: m.id,
            text: m.message_body,
            type: isSentByMe ? 'sent' : 'received',
            read: m.read ?? false,
            timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          
          conversationsMap[otherUser].lastMessage = m.message_body;
          conversationsMap[otherUser].lastTime = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          if (!m.read && !isSentByMe) conversationsMap[otherUser].unread += 1;
        });

        // Add empty states for all registered users so admin can initiate chats
        allUsers.forEach((u: any) => {
           if (!conversationsMap[u.id] && u.username !== adminName) {
             conversationsMap[u.id] = {
               id: u.id.toString(),
               userName: u.username,
               avatar: u.username.charAt(0).toUpperCase(),
               messages: [],
               unread: 0,
               lastMessage: 'Start a conversation...',
               lastTime: '',
             };
           }
        });

        const formattedConvs = Object.values(conversationsMap);
        setConvList(formattedConvs);
        
        if (formattedConvs.length > 0 && !activeId) {
          setActiveId(formattedConvs[0].id);
        }
      } catch (err) {
        console.error("Failed to load messages", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChat();
  }, []);

  const activeConv = convList.find(c => c.id === activeId);

  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400';
  const sidebarBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const chatBg = darkMode ? 'bg-gray-900' : 'bg-slate-50';
  const userItemActive = darkMode ? 'bg-green-900/30 border-green-700/50' : 'bg-green-50 border-green-100';
  const userItemInactive = darkMode ? 'hover:bg-gray-700/50 border-transparent' : 'hover:bg-gray-50 border-transparent';
  const sentBubble = 'bg-gradient-to-br from-green-400 to-emerald-500 text-white';
  const recvBubble = darkMode ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-800 shadow-sm';
  const divider = darkMode ? 'border-gray-700' : 'border-gray-200';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !activeId) return;
    try {
      const res = await fetchAPI('/api/chat/messages/', {
        method: 'POST',
        body: JSON.stringify({
          receiver: activeId,
          message_body: text.trim()
        })
      });
      
      const newMsg = {
        id: res.id || `m${Date.now()}`,
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        type: 'sent',
      };
      
      setConvList(prev => prev.map(c =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: text.trim(), lastTime: 'Just now', unread: 0 }
          : c
      ));
      setInput('');
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const selectConv = async (id: string) => {
    setActiveId(id);
    setMobileShowChat(true);

    // Find all unread received messages for this conversation
    const conv = convList.find(c => c.id === id);
    if (!conv) return;

    const unreadMsgs = conv.messages.filter((m: any) => m.type === 'received' && !m.read);
    
    // Optimistically update local state immediately
    setConvList(prev => prev.map(c =>
      c.id === id
        ? { ...c, unread: 0, messages: c.messages.map((m: any) => ({ ...m, read: true })) }
        : c
    ));

    // Persist the read status to the backend for each unread message
    if (unreadMsgs.length > 0) {
      await Promise.all(
        unreadMsgs.map((m: any) =>
          fetchAPI(`/api/chat/messages/${m.id}/`, {
            method: 'PATCH',
            body: JSON.stringify({ read: true })
          }).catch(() => {}) // Silently ignore individual failures
        )
      );
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
          ) : filtered.map((conv, i) => (
            <button key={conv.id} onClick={() => selectConv(conv.id)}
              className={`w-full flex items-start gap-3 px-4 py-3.5 border transition-all text-left ${activeId === conv.id ? userItemActive : userItemInactive}`}>
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <span className="text-white text-xs font-bold">{conv.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={`text-sm font-semibold truncate ${textMain}`}>{conv.userName}</p>
                  <span className={`text-xs flex-shrink-0 ml-2 ${textSub}`}>{conv.lastTime}</span>
                </div>
                <p className={`text-xs truncate ${textSub}`}>{conv.lastMessage}</p>
                {conv.donationRef && (
                  <span className="text-xs text-green-500 font-mono">{conv.donationRef}</span>
                )}
              </div>
              {conv.unread > 0 && (
                <span className="w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  {conv.unread}
                </span>
              )}
            </button>
          ))}
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

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto p-5 space-y-4 ${chatBg}`}>
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
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.type === 'sent' ? `${sentBubble} rounded-br-md` : `${recvBubble} rounded-bl-md`}`}>
                      {msg.text}
                    </div>
                    <div className={`flex items-center gap-1 mt-1 ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                      <p className={`text-[10px] ${textSub}`}>{msg.timestamp}</p>
                      {msg.type === 'sent' && (
                        msg.read ? <CheckCheck size={12} className="text-blue-400" /> : <Check size={12} className={textSub} />
                      )}
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
                  className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
