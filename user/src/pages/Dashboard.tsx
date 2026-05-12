import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useLocation } from 'react-router-dom';
import { 
  User, MapPin, Clock, HandHeart, TreePine, Utensils,
  CheckCircle, Check, CheckCheck, Package, Loader, Mail, Send, Truck, Calendar, LogOut, 
  Users, GraduationCap, Megaphone, HeartPulse, Shirt, Apple, 
  MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight, Sprout, Heart
} from 'lucide-react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAPI, getWSUrl } from '../utils/api';
import { getUserDonations, getUserStats } from '../api/donations';
import { DonationItem } from '../components/dashboard/DonationItem';



const SkeletonItem = ({ dark }: { dark: boolean }) => (
  <div className={`h-24 w-full rounded-2xl skeleton-shimmer ${dark ? 'bg-white/5' : 'bg-gray-100'}`} />
);

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { dark, t, user: appUser, setUser: setAppUser, setNotifications, logout } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'history' | 'profile' | 'addresses' | 'messages' | 'pickups' | 'volunteer'>(() => {
    return (localStorage.getItem('dashboard_tab') as any) || 'history';
  });

  // Persist tab change
  useEffect(() => {
    localStorage.setItem('dashboard_tab', activeTab);
  }, [activeTab]);
  const [showDonationToast, setShowDonationToast] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const limit = 5;

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', email: '', phone_number: '', city: '', address: '' });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [adminId, setAdminId] = useState<number | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [menuMsgId, setMenuMsgId] = useState<number | null>(null);

  // Queries
  const { data: donationData, isLoading: loadingDonations } = useQuery({
    queryKey: ['user-donations', page],
    queryFn: () => getUserDonations(page, limit),
    enabled: !!appUser.id,
  });

  const { data: userStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => getUserStats(),
    enabled: !!appUser.id,
  });

  const { 
    data: chatHistory, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading: loadingChat
  } = useInfiniteQuery({
    queryKey: ['chat-messages', adminId],
    queryFn: ({ pageParam = 1 }) => fetchAPI(`/api/chat/messages/?other_user_id=${adminId}&page=${pageParam}&limit=20`),
    enabled: !!appUser.id && !!adminId,
    getNextPageParam: (lastPage: any) => {
      const meta = lastPage.meta;
      if (meta && meta.hasNext) return meta.page + 1;
      return undefined;
    },
    initialPageParam: 1,
    refetchInterval: activeTab === 'messages' ? 10000 : false,
  });

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => fetchAPI('/api/users/profile/'),
    enabled: !!appUser.id,
  });

  const { data: volunteerData } = useQuery({
    queryKey: ['my-volunteer-apps'],
    queryFn: () => fetchAPI('/api/users/volunteer/'),
    enabled: !!appUser.id,
  });
  
  const { data: notificationData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchAPI('/api/chat/notifications/'),
    enabled: !!appUser.id,
    refetchInterval: 30000,
  });
  
  const { data: unreadChatCount, refetch: refetchUnreadChat } = useQuery({
    queryKey: ['unread-chat-count'],
    queryFn: () => fetchAPI('/api/chat/messages/total_unread/'),
    refetchInterval: 30000,
  });

  useEffect(() => {
    const handleUpdate = () => refetchUnreadChat();
    window.addEventListener('chatMessagesUpdated', handleUpdate);
    return () => window.removeEventListener('chatMessagesUpdated', handleUpdate);
  }, [refetchUnreadChat]);

  // Sync notifications to context
  useEffect(() => {
    if (notificationData) {
      // Handle CustomPagination {data, meta}, DRF default {results}, or plain array
      const list = Array.isArray(notificationData)
        ? notificationData
        : (notificationData?.data ?? notificationData?.results ?? []);
      setNotifications(Array.isArray(list) ? list : []);
    }
  }, [notificationData, setNotifications]);

  // Sync profile form when data loads

  // Sync profile form when data loads
  useEffect(() => {
    if (profileData) {
      setProfileForm({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email || '',
        phone_number: profileData.phone_number || '',
        city: profileData.city || '',
        address: profileData.address || ''
      });
      setAppUser({
        id: profileData.id,
        name: profileData.first_name
          ? `${profileData.first_name} ${profileData.last_name || ''}`.trim()
          : profileData.username || '',
        email: profileData.email || '',
        phone: profileData.phone_number || '',
        city: profileData.city || '',
        address: profileData.address || '',
        role: profileData.role || '',
        image: profileData.profile_picture || profileData.image || '',
      });
    }
  }, [profileData, setAppUser]);

  useEffect(() => {
    if (location.state?.donated) {
      setShowDonationToast(true);
      const timer = setTimeout(() => setShowDonationToast(false), 4000);
      // Clear navigation state so it doesn't show again on refresh
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);



  useEffect(() => {
    // Attempt to fetch dedicated admin ID once on mount
    fetchAPI('/api/users/admin-id/').then(res => {
      if (res.id) setAdminId(res.id);
    }).catch(err => {
      if (import.meta.env.DEV) console.warn("Dedicated Admin ID fetch failed", err);
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'messages' && adminId) {
      fetchAPI('/api/chat/messages/mark_read/', {
        method: 'POST',
        body: JSON.stringify({ other_user_id: adminId })
      }).then(() => {
        // Refetch unread counts immediately to clear badge
        refetchUnreadChat();
        queryClient.invalidateQueries({ queryKey: ['unread-chat-count'] });
      }).catch(e => console.error("Mark read error:", e));
    }
  }, [activeTab, adminId, refetchUnreadChat]);

  // Sync chatMessages from chatHistory query
  useEffect(() => {
    if (chatHistory) {
      const allPages = chatHistory.pages || [];
      const rawMsgs = allPages.flatMap((page: any) => {
        const msgData = page.results || page.data || page || [];
        return Array.isArray(msgData) ? msgData.filter((m: any) => m.status !== 'Recycled') : [];
      });
      
      // Sort chronologically (oldest first for chat display)
      const sorted = [...rawMsgs].sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setMessages(sorted);
    }
  }, [chatHistory]);

  const topRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!topRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isRemoteTyping, setIsRemoteTyping] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const typingTimeoutRef = useRef<any>(null);

  // WebSocket Connection
  useEffect(() => {
    if (activeTab !== 'messages' || !appUser.id || !adminId) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsUrl = getWSUrl('/ws/chat/');
    
    if (import.meta.env.DEV) console.log("User connecting to WebSocket...");
    const newWs = new WebSocket(wsUrl);
    
    newWs.onopen = () => {
      if (import.meta.env.DEV) console.log("User WebSocket Connected");
      // Join specific room
      const ids = [parseInt(String(appUser.id)), parseInt(String(adminId))].sort((a, b) => a - b);
      newWs.send(JSON.stringify({
        action: 'join_room',
        room_id: `${ids[0]}_${ids[1]}`
      }));
    };

    newWs.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'new_message') {
        const m = data.message;
        setMessages((prev: any[]) => {
          // Robust duplicate check
          const existingIdx = prev.findIndex((msg: any) => 
            String(msg.id) === String(m.id) || 
            (msg.temp && msg.message === m.message && String(msg.sender) === String(m.sender))
          );

          if (existingIdx !== -1) {
            // Replace the optimistic message with the server message
            const next = [...prev];
            next[existingIdx] = m;
            return next;
          }
          const updatedMessages = [...prev, m];
          
          // If we are currently looking at the messages tab, mark this new message as read locally
          if (activeTab === 'messages') {
             fetchAPI('/api/chat/messages/mark_read/', {
                method: 'POST',
                body: JSON.stringify({ other_user_id: adminId })
             }).then(() => refetchUnreadChat());
          }
          
          return updatedMessages;
        });
        window.dispatchEvent(new Event('chatMessagesUpdated'));
        refetchUnreadChat();
      } else if (data.type === 'edit_message') {
        const m = data.message;
        setMessages((prev: any[]) => prev.map((msg: any) => String(msg.id) === String(m.id) ? m : msg));
      } else if (data.type === 'delete_message') {
        const mid = data.message_id;
        setMessages((prev: any[]) => prev.map((msg: any) => String(msg.id) === String(mid) ? { ...msg, message: '[Message Deleted]', isDeleted: true } : msg));
      } else if (data.type === 'typing') {
        if (String(data.user_id) === String(adminId)) {
          setIsRemoteTyping(data.is_typing);
        }
      } else if (data.type === 'user_status') {
        if (String(data.user_id) === String(adminId)) {
          setAdminOnline(data.is_online);
        }
      }
    };

    setWs(newWs);
    return () => newWs.close();
  }, [activeTab, appUser.id, adminId]);

  // Notification WebSocket for real-time synchronization
  useEffect(() => {
    if (!appUser.id) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsUrl = getWSUrl('/ws/notifications/');
    const notifyWs = new WebSocket(wsUrl);

    notifyWs.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'data_sync') {
        const { model } = data.data;
        if (model === 'donations') {
          queryClient.invalidateQueries({ queryKey: ['user-donations'] });
          queryClient.invalidateQueries({ queryKey: ['user-stats'] });
        }
      } else if (data.type === 'notification') {
        // Handle incoming real-time notifications if needed
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    };

    return () => notifyWs.close();
  }, [appUser.id, queryClient]);

  const handleEditMessage = async (msgId: number, text: string) => {
    if (!text.trim() || !ws) return;
    
    const newText = text.trim();
    // Optimistic local update
    setMessages((prev: any[]) => prev.map((msg: any) => 
      String(msg.id) === String(msgId) ? { ...msg, message: newText, is_edited: true } : msg
    ));

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        action: 'edit_message',
        message_id: msgId,
        message: newText
      }));
    } else {
      try {
      await fetchAPI(`/api/chat/messages/${msgId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ message: text.trim(), is_edited: true })
      });
    } catch (err: any) {
      console.error("Failed to edit message", err);
    }
  }
    setEditingMsgId(null);
    setEditingText('');
  };

  const handleDeleteMessage = async (msgId: number) => {
    if (!ws) return;
    if (window.confirm('Delete this message?')) {
      ws.send(JSON.stringify({
        action: 'delete_message',
        message_id: msgId
      }));
      setMenuMsgId(null);
    }
  };

  const handleProfileSave = async () => {
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const res = await fetchAPI('/api/users/profile/', {
        method: 'PATCH',
        body: JSON.stringify(profileForm)
      });
      setProfileSuccess('Profile updated successfully!');
      setAppUser({
        id: res.id,
        name: res.first_name
          ? `${res.first_name} ${res.last_name || ''}`.trim()
          : res.username || '',
        email: res.email || '',
        phone: res.phone_number || '',
        city: res.city || '',
        address: res.address || '',
        role: res.role || '',
        image: res.profile_picture || res.image || '',
      });
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendMessage = async () => {
    if (!replyText.trim() || sendingMsg) return;
    const effectiveAdminId = adminId || 1;
    console.log("Sending message to admin ID:", effectiveAdminId);
    
    const textToSend = replyText.trim();
    setReplyText(''); // Clear early for better UX

    // Add optimistically to UI
    const tempId = Date.now();
    const optimisticMsg = {
      id: tempId,
      temp: true,
      sender: appUser.id,
      receiver: effectiveAdminId,
      message: textToSend,
      timestamp: new Date().toISOString(),
      sender_username: appUser.name,
      read: false
    };
    setMessages((prev: any[]) => [...prev, optimisticMsg]);

    // Try WebSocket first
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        action: 'send_message',
        receiver_id: effectiveAdminId,
        message: textToSend
      }));
      return;
    }

    // Fallback to REST API
    setSendingMsg(true);
    try {
      const newMsg = await fetchAPI('/api/chat/messages/', {
        method: 'POST',
        body: JSON.stringify({
          receiver: effectiveAdminId,
          message: textToSend
        })
      });
      // The WebSocket will broadcast this back to us if connected, 
      // but adding/replacing optimistically for non-WS users
      setMessages((prev: any[]) => {
        const isDuplicate = prev.some((m: any) => 
          String(m.id) === String(newMsg.id) || 
          (m.temp && m.message === newMsg.message)
        );
        if (isDuplicate) {
          return prev.map((m: any) => (m.temp && m.message === newMsg.message) ? newMsg : m);
        }
        return [...prev, newMsg];
      });
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSendingMsg(false);
    }
  };

  // Auto-scroll to bottom on new messages (smart scroll)
  useEffect(() => {
    if (activeTab === 'messages' && chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;
      
      const lastMsg = messages[messages.length - 1];
      const isMe = lastMsg && (String(lastMsg.sender) === String(appUser.id) || String(lastMsg.sender_email) === String(appUser.email));

      if (isAtBottom || isMe) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages.length, activeTab]);

  const getRoleIcon = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('teach')) return GraduationCap;
    if (r.includes('food') || r.includes('distrib')) return Apple;
    if (r.includes('tree') || r.includes('plant')) return TreePine;
    if (r.includes('aware')) return Megaphone;
    if (r.includes('med')) return HeartPulse;
    if (r.includes('cloth')) return Shirt;
    return HandHeart;
  };

  const handleDownloadReceipt = async (donationId: number) => {
    try {
      const blob = await fetchAPI(`/api/donations/${donationId}/receipt/`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `donation_receipt_${donationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download error:', err);
      alert('Failed to download receipt: ' + err.message);
    }
  };

  // Notifications logic removed as it is handled globally or unused here

  const tabs = [
    { key: 'history' as const, label: t.dashboard.history, icon: Clock },
    { key: 'pickups' as const, label: 'Pickup Status', icon: Truck },
    { key: 'volunteer' as const, label: 'Volunteer Status', icon: Users },
    { key: 'profile' as const, label: t.dashboard.profile, icon: User },
    { key: 'addresses' as const, label: t.dashboard.addresses, icon: MapPin },
    { key: 'messages' as const, label: 'Messages', icon: Mail },
  ];

  // Derived Stats
  const safeDonations = useMemo(() => {
    // Backend with CustomPagination returns { data: [...] }
    // Legacy or unpaginated backend might return [...] directly
    const data = donationData?.data || (Array.isArray(donationData) ? donationData : []);
    return Array.isArray(data) ? data : [];
  }, [donationData]);

  const volunteerApps = useMemo(() => {
    const apps = volunteerData?.results || volunteerData || [];
    return Array.isArray(apps) ? apps.filter((a: any) => a.status && a.status.toLowerCase() !== 'recycled') : [];
  }, [volunteerData]);
  
  const totalPages = donationData?.meta?.totalPages || 1;
  const totalCount = donationData?.meta?.total || (Array.isArray(safeDonations) ? safeDonations.length : 0);

  const totalDonations = userStats?.total_donations || 0;
  const impactMetrics = Array.isArray(userStats?.impact_metrics) ? userStats.impact_metrics : [];

  // Extract unique addresses for display
  const uniqueAddresses = useMemo(() => {
    const seen = new Set();
    const result: any[] = [];
    
    // Add addresses from stats (all-time history)
    const statsAddresses = userStats?.saved_addresses || [];
    statsAddresses.forEach((p: any) => {
      if (!p || !p.full_address) return;
      const key = `${p.full_address}-${p.city}-${p.state}-${p.pincode}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ ...p, isProfile: false });
      }
    });

    // Add profile address if it exists and isn't already included
    if (appUser.address) {
      const key = `${appUser.address}-${appUser.city}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.unshift({
          full_address: appUser.address,
          city: appUser.city || '',
          state: '',
          pincode: '',
          isProfile: true
        });
      }
    }

    return result;
  }, [userStats, appUser.address, appUser.city]);

  const loading = loadingDonations;

  return (
    <div className={`min-h-screen pt-24 pb-16 transition-colors duration-500 ${dark ? 'bg-[#0f172b]' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Donation Success Toast */}
        {showDonationToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
            <div className={`flex items-center gap-3 px-5 py-3.5 ${dark ? 'bg-white text-slate-900' : 'bg-[#0f172b] text-white'} rounded-2xl shadow-2xl shadow-slate-900/20 animate-fade-in border ${dark ? 'border-gray-200' : 'border-slate-800'}`}>
              <CheckCircle className={`w-5 h-5 flex-shrink-0 ${dark ? 'text-green-600' : 'text-brand'}`} />
              <span className="text-sm font-bold">🎉 Donation saved successfully! Thank you for your generosity.</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold font-serif ${dark ? 'text-white' : 'text-gray-900'}`}>{t.dashboard.title}</h1>
          <p className={`mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{t.dashboard.welcome}, {appUser.name}! 👋</p>
        </div>

        {/* Impact Summary */}
        <div className={`rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden text-white transition-all duration-500 ${dark ? 'bg-white/5 border border-white/10' : 'bg-[#0f172b] shadow-2xl shadow-slate-900/20'}`}>
          <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-brand to-transparent" />
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-1">{t.dashboard.impact}</h2>
            <p className="text-white/80 text-sm mb-6">You've helped approximately <span className="text-2xl font-bold">{impactMetrics.reduce((acc: number, m: any) => acc + (m.value || 0), 0) || totalDonations}</span> people through your kindness.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className={`rounded-2xl p-4 text-center backdrop-blur-sm transition-colors ${dark ? 'bg-white/10 hover:bg-white/20' : 'bg-white/10 hover:bg-white/20'}`}>
                <Package className={`w-6 h-6 mx-auto mb-2 text-brand`} />
                <div className="text-2xl font-bold">{totalDonations}</div>
                <div className="text-xs text-white/70">Total Donations</div>
              </div>
              
              {impactMetrics.slice(0, 3).map((metric: any, idx: number) => (
                <div key={idx} className={`rounded-2xl p-4 text-center backdrop-blur-sm transition-colors ${dark ? 'bg-white/10 hover:bg-white/20' : 'bg-white/10 hover:bg-white/20'}`}>
                  <Heart className={`w-6 h-6 mx-auto mb-2 text-brand`} />
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="text-xs text-white/70">{metric.label}</div>
                </div>
              ))}

              {/* Fallback if less than 3 impact metrics */}
              {impactMetrics.length < 1 && (
                <>
                  <div className={`rounded-2xl p-4 text-center backdrop-blur-sm transition-colors ${dark ? 'bg-white/10 hover:bg-white/20' : 'bg-white/10 hover:bg-white/20'}`}>
                    <Utensils className={`w-6 h-6 mx-auto mb-2 text-brand`} />
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-xs text-white/70">Meals Provided</div>
                  </div>
                  <div className={`rounded-2xl p-4 text-center backdrop-blur-sm transition-colors ${dark ? 'bg-white/10 hover:bg-white/20' : 'bg-white/10 hover:bg-white/20'}`}>
                    <Sprout className={`w-6 h-6 mx-auto mb-2 text-brand`} />
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-xs text-white/70">Trees Planted</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm active:scale-95 ${
                activeTab === tab.key
                  ? dark ? 'bg-white text-[#0f172b] shadow-lg shadow-white/10' : 'bg-[#0f172b] text-white shadow-xl shadow-slate-900/30'
                  : dark ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-white text-slate-500 hover:bg-gray-100 hover:text-slate-900'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.key === 'messages' && unreadChatCount?.count > 0 && activeTab !== 'messages' && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadChatCount.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className={`rounded-3xl p-6 sm:p-8 ${dark ? 'bg-white/5 border border-white/10' : 'bg-white shadow-xl shadow-gray-200/20 border-gray-100 min-h-[400px]'}`}>
          {loading ? (
             <div className="flex justify-center items-center h-48"><Loader className="w-8 h-8 animate-spin text-primary-500" /></div>
          ) : (
            <>
              {/* Donation History */}
              {activeTab === 'history' && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{t.dashboard.history}</h3>
                  </div>
                  <div className="space-y-4">
                    {loadingDonations ? (
                      Array.from({ length: 3 }).map((_, i) => <SkeletonItem key={i} dark={dark} />)
                    ) : safeDonations.length === 0 ? (
                      <div className="text-center py-12">
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl ${dark ? 'bg-white/5' : 'bg-gray-50'}`}>📦</div>
                        <p className={`text-lg font-bold mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>No donations yet</p>
                        <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Start your journey of giving today.</p>
                      </div>
                    ) : safeDonations.map((d: any) => (
                      <DonationItem key={d.id} donation={d} dark={dark} onDownload={handleDownloadReceipt} />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
                      <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Showing <span className="font-bold">{safeDonations.length}</span> of <span className="font-bold">{totalCount}</span> donations
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className={`p-2 rounded-xl transition-all ${
                            page === 1 
                              ? 'opacity-30 cursor-not-allowed' 
                              : dark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {[...Array(totalPages)].map((_, i) => {
                            const p = i + 1;
                            if (totalPages > 5 && p !== 1 && p !== totalPages && Math.abs(p - page) > 1) {
                              if (Math.abs(p - page) === 2) return <span key={p} className="px-1 text-gray-400">...</span>;
                              return null;
                            }
                            return (
                              <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                                  page === p
                                    ? 'bg-[#0f172b] text-white shadow-lg'
                                    : dark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                                }`}
                              >
                                {p}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className={`p-2 rounded-xl transition-all ${
                            page === totalPages 
                              ? 'opacity-30 cursor-not-allowed' 
                              : dark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pickup Status */}
              {activeTab === 'pickups' && (
                <div className="animate-fade-in">
                  <h3 className={`text-lg font-bold mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>Track Your Pickups</h3>
                  <div className="space-y-4">
                    {(!Array.isArray(safeDonations) || safeDonations.filter((d: any) => ['Pending', 'Scheduled', 'Completed'].includes(d.status)).length === 0) ? (
                      <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>No active pickups at the moment.</p>
                    ) : safeDonations.filter((d: any) => ['Pending', 'Scheduled', 'Completed'].includes(d.status)).map((d: any) => (
                      <div key={d.id} className={`p-6 rounded-3xl border-2 transition-all ${d.status === 'Scheduled' ? 'border-blue-500 bg-blue-50/10' : dark ? 'border-slate-700 bg-slate-800/40' : 'border-gray-100 bg-gray-50/50'}`}>
                         <div className="flex justify-between items-start mb-4">
                           <div>
                             <p className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{d.category} Donation</p>
                             <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>#{d.id} · {d.quantity_description}</p>
                           </div>
                           <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                             d.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' : 
                             d.status === 'Completed' ? 'bg-green-100 text-green-700' :
                             'bg-amber-100 text-amber-700'
                           }`}>
                             {d.status === 'Scheduled' ? 'Approved' : d.status}
                           </span>
                         </div>
                         
                         <div className="space-y-3">
                           <div className="flex items-center gap-3 text-sm">
                             <MapPin className="w-4 h-4 text-green-500" />
                             <span className={dark ? 'text-gray-300' : 'text-gray-600'}>{d.pickup_details?.full_address}, {d.pickup_details?.city}</span>
                           </div>
                           {d.pickup_details?.scheduled_date && (
                             <div className="flex items-center gap-3 text-sm">
                               <Calendar className="w-4 h-4 text-blue-500" />
                               <span className={dark ? 'text-gray-300' : 'text-gray-600'}>{d.pickup_details.scheduled_date} at {d.pickup_details.scheduled_time || 'TBD'}</span>
                             </div>
                           )}
                           {d.pickup_details?.assigned_team && (
                             <div className={`mt-4 p-4 rounded-2xl flex items-center gap-4 ${dark ? 'bg-white/5' : 'bg-white border border-gray-100 shadow-sm'}`}>
                               <div className="relative">
                                 <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-xl">🚚</div>
                                 <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                               </div>
                               <div className="flex-1">
                                 <p className="text-[10px] font-bold uppercase tracking-wider text-primary-600">Assigned Team</p>
                                 <p className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{d.pickup_details.assigned_team}</p>
                                 <p className={`text-[11px] ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Our team will arrive as per the scheduled slot.</p>
                               </div>
                             </div>
                           )}
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Profile */}
              {activeTab === 'profile' && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{t.dashboard.profile}</h3>
                    <button 
                      onClick={logout}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        dark 
                          ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' 
                          : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white shadow-sm'
                      }`}
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="relative">
                      <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-4xl font-black text-white shadow-[0_20px_50px_-12px_rgba(24,226,153,0.5)] transform transition-all duration-500 hover:scale-105 hover:rotate-2 overflow-hidden ${!appUser.image ? 'bg-gradient-to-br from-[#18E299] to-[#0fa76e]' : ''}`}>
                        {appUser.image ? (
                          <img src={appUser.image} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          appUser.name ? appUser.name.charAt(0).toUpperCase() : <User className="w-10 h-10" />
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{appUser.name}</h4>
                      <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{appUser.email}</p>
                      <p className={`text-[10px] mt-1 uppercase tracking-wider font-bold ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {appUser.role === 'ADMIN' ? 'Administrator' : appUser.role === 'VOLUNTEER' ? 'Seva Marg Volunteer' : 'Seva Marg Donor'}
                      </p>
                    </div>
                  </div>

                  {profileSuccess && <div className="mb-4 p-3 bg-green-100 text-green-700 text-sm font-medium rounded-xl">{profileSuccess}</div>}
                  {profileError && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm font-medium rounded-xl">{profileError}</div>}

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-semibold mb-1 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>First Name</label>
                        <input type="text" value={profileForm.first_name} onChange={e => setProfileForm(p => ({ ...p, first_name: e.target.value }))}
                          className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-200 focus:border-primary-500 focus:bg-white'} outline-none transition-colors`} />
                      </div>
                      <div>
                        <label className={`block text-sm font-semibold mb-1 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Last Name</label>
                        <input type="text" value={profileForm.last_name} onChange={e => setProfileForm(p => ({ ...p, last_name: e.target.value }))}
                          className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-200 focus:border-primary-500 focus:bg-white'} outline-none transition-colors`} />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold mb-1 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Email</label>
                      <input type="email" value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                        className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-200 focus:border-primary-500 focus:bg-white'} outline-none transition-colors`} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-semibold mb-1 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Phone</label>
                        <input type="text" value={profileForm.phone_number} onChange={e => setProfileForm(p => ({ ...p, phone_number: e.target.value }))}
                          className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-200 focus:border-primary-500 focus:bg-white'} outline-none transition-colors`} />
                      </div>
                      <div>
                        <label className={`block text-sm font-semibold mb-1 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>City</label>
                        <input type="text" value={profileForm.city} onChange={e => setProfileForm(p => ({ ...p, city: e.target.value }))}
                          className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-200 focus:border-primary-500 focus:bg-white'} outline-none transition-colors`} />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold mb-1 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Full Address</label>
                      <textarea value={profileForm.address} onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))} rows={2}
                        className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-200 focus:border-primary-500 focus:bg-white'} outline-none transition-colors resize-none`} />
                    </div>
                    <button 
                      onClick={handleProfileSave} 
                      disabled={savingProfile} 
                      className={`px-8 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 border-2 ${
                        dark 
                          ? 'bg-primary-500 text-white border-primary-400 shadow-lg shadow-primary-500/20 hover:scale-105' 
                          : 'bg-[#0f172b] text-white border-white/10 shadow-xl shadow-slate-900/20 hover:scale-105'
                      }`}
                    >
                      {savingProfile ? <Loader className="w-4 h-4 animate-spin" /> : null} Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Volunteer Status */}
              {activeTab === 'volunteer' && (
                <div className="animate-fade-in">
                  
                  <h3 className={`text-lg font-bold mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>Volunteer Applications</h3>
                  <div className="space-y-4">
                    {volunteerApps.length === 0 ? (
                      <div className="text-center py-10">
                        <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>No volunteer applications found. Join us today!</p>
                      </div>
                    ) : volunteerApps.map((app: any) => {
                      const Icon = getRoleIcon(app.volunteering_role);
                      const isApproved = app.status === 'Approved';
                      const isRejected = app.status === 'Rejected';
                      
                      return (
                        <div key={app.id} className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all border-2 shadow-sm ${
                          isApproved ? (dark ? 'bg-green-500/5 border-green-500/10' : 'bg-green-50/50 border-green-100/50') :
                          isRejected ? (dark ? 'bg-red-500/5 border-red-500/10' : 'bg-red-50/50 border-red-100/50') :
                          (dark ? 'bg-slate-700/20 border-slate-700/50' : 'bg-gray-50 border-gray-100')
                        }`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                            isApproved ? 'bg-green-100' : isRejected ? 'bg-red-100' : 'bg-amber-100'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              isApproved ? 'text-green-600' : isRejected ? 'text-red-600' : 'text-amber-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                               <p className={`font-bold text-sm capitalize leading-tight ${dark ? 'text-white' : 'text-gray-900'}`}>{app.volunteering_role}</p>
                               <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                 isApproved ? 'bg-green-500 text-white' :
                                 isRejected ? 'bg-red-500 text-white' :
                                 'bg-amber-500 text-white'
                               }`}>
                                 {app.status}
                               </span>
                            </div>
                            <p className={`text-[11px] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                              📍 {app.city} • {new Date(app.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="hidden sm:block text-right">
                            <p className={`text-[9px] font-bold uppercase tracking-tighter opacity-50 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>REF CODE</p>
                            <p className={`text-[11px] font-mono font-bold ${dark ? 'text-slate-400' : 'text-slate-600'}`}>#VOL-{app.id}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Saved Addresses */}
              {activeTab === 'addresses' && (
                <div className="animate-fade-in">
                  <h3 className={`text-lg font-bold mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>{t.dashboard.addresses}</h3>
                  <div className="space-y-4">
                    {uniqueAddresses.length === 0 ? (
                      <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>No addresses found. Complete a donation to save your pickup address.</p>
                    ) : uniqueAddresses.map((addr, i) => (
                      <div key={i} className={`p-4 rounded-2xl border-2 ${i === 0 ? 'border-primary-500' : dark ? 'border-slate-600' : 'border-gray-200'} ${dark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className={`w-4 h-4 ${addr.isProfile || i === 0 ? 'text-primary-500' : dark ? 'text-gray-500' : 'text-gray-400'}`} />
                          <span className={`font-semibold text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>{addr.isProfile ? 'Profile Address' : i === 0 ? 'Primary Address' : 'Past Address'}</span>
                          {(addr.isProfile || i === 0) && <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">Default</span>}
                        </div>
                        <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {addr.full_address}{addr.city ? `, ${addr.city}` : ''}{addr.state ? `, ${addr.state}` : ''} {addr.pincode}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages from Admin (Chat Inbox) */}
              {activeTab === 'messages' && (
                <div className={`animate-fade-in flex flex-col h-[calc(100vh-16rem)] min-h-[600px] border shadow-2xl rounded-[2rem] overflow-hidden relative ${dark ? 'border-white/10' : 'border-gray-100'}`}>
                  {/* Glassmorphism Background Overlay */}
                  <div className={`absolute inset-0 z-0 ${dark ? 'bg-[#0f172b]/60' : 'bg-white/70'} backdrop-blur-3xl`} />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <div className={`px-8 py-6 border-b flex items-center justify-between ${dark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50/50'}`}>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white shadow-lg">
                            <Users className="w-6 h-6" />
                          </div>
                          {messages.filter((m: any) => !m.is_read && m.sender_is_staff).length > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce-short">
                              {messages.filter((m: any) => !m.is_read && m.sender_is_staff).length}
                            </div>
                          )}
                          {messages.filter((m: any) => !m.is_read && m.sender_is_staff).length === 0 && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm animate-pulse" />
                          )}
                        </div>
                        <div>
                          <h3 className={`text-xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>Support Center</h3>
                          {isRemoteTyping ? (
                            <p className="text-[10px] font-bold text-teal-500 animate-pulse">Administrator is typing...</p>
                          ) : (
                            <p className={`text-xs font-bold ${dark ? 'text-teal-400/80' : 'text-teal-600'}`}>Chatting with Administrator</p>
                          )}
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${dark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${adminOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-gray-400'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${dark ? 'text-gray-400' : 'text-slate-500'}`}>
                          {adminOnline ? 'Agent Online' : 'Agent Offline'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Message List */}
                    <div 
                      ref={chatContainerRef}
                      className={`flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar`}
                    >
                      <div ref={topRef} className="h-1" />
                      {isFetchingNextPage && (
                        <div className="flex justify-center py-2">
                          <Loader className="w-5 h-5 animate-spin text-[#0d9488]" />
                        </div>
                      )}
                      
                      {messages.length === 0 && !loadingChat ? (
                      <div className="h-full flex items-center justify-center">
                        <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>No messages yet. Send a message to start the conversation.</p>
                      </div>
                    ) : messages.map((m: any) => {
                      const isMe = String(m.sender) === String(appUser.id) || 
                                   String(m.sender_email) === String(appUser.email);
                      const isEditing = editingMsgId === m.id;
                      const isMenuOpen = menuMsgId === m.id;

                      return (
                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}>
                          <div className={`max-w-[80%] p-4 rounded-2xl relative ${
                            isMe 
                              ? `bg-[#0d9488] text-white rounded-tr-none shadow-md shadow-teal-500/20` 
                              : dark ? 'bg-slate-700 text-gray-200 rounded-tl-none border border-slate-600' : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
                          }`}>
                            {!isMe && (
                              <div className="mb-1">
                                <p className={`text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-white/60' : 'text-slate-500'}`}>Administrator</p>
                                <p className={`text-[9px] opacity-60`}>{m.sender_email}</p>
                              </div>
                            )}

                            {isEditing ? (
                              <div className="flex flex-col gap-2">
                                <textarea
                                  value={editingText}
                                  onChange={e => setEditingText(e.target.value)}
                                  className="bg-white/10 border border-white/20 rounded-lg p-2 text-sm outline-none text-white w-full min-h-[60px]"
                                  autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => setEditingMsgId(null)} className="text-[10px] hover:underline">Cancel</button>
                                  <button onClick={() => handleEditMessage(m.id, editingText)} className="text-[10px] font-bold bg-white text-[#0d9488] px-2 py-1 rounded">Save</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${m.isDeleted ? 'italic opacity-50 text-[11px]' : ''}`}>
                                  {m.isDeleted ? '🚫 This message was deleted' : m.message}
                                </p>
                                <div className="flex items-center justify-between mt-1 gap-4">
                                  <span className="text-[8px] opacity-40 uppercase tracking-tighter">
                                    {m.is_edited ? 'edited' : ''}
                                  </span>
                                    <div className="flex items-center gap-1.5">
                                      <p className={`text-[9px] text-right opacity-60`}>
                                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                      {isMe && (
                                        <div className="flex items-center">
                                          {m.is_read ? (
                                            <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
                                          ) : (
                                            <Check className="w-3.5 h-3.5 text-white/50" />
                                          )}
                                        </div>
                                      )}
                                    </div>
                                </div>
                              </>
                            )}

                            {/* Options Menu for My Messages */}
                            {isMe && !isEditing && !m.isDeleted && (
                              <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => setMenuMsgId(isMenuOpen ? null : m.id)}
                                  className={`p-1.5 rounded-full hover:bg-slate-100 ${dark ? 'hover:bg-slate-700 text-slate-400' : 'text-slate-500'}`}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>

                                {isMenuOpen && (
                                  <div className={`absolute bottom-full left-0 mb-1 z-20 rounded-xl border shadow-xl overflow-hidden min-w-[100px] ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                                    <button 
                                      onClick={() => {
                                        setEditingMsgId(m.id);
                                        setEditingText(m.message);
                                        setMenuMsgId(null);
                                      }}
                                      className="w-full px-3 py-2 flex items-center gap-2 text-[11px] hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                                    >
                                      <Pencil className="w-3 h-3" /> Edit
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteMessage(m.id)}
                                      className="w-full px-3 py-2 flex items-center gap-2 text-[11px] hover:bg-red-50 text-red-500"
                                    >
                                      <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Send Input */}
                  <div className="relative mt-auto">
                    <input 
                      type="text" 
                      value={replyText} 
                      onChange={e => {
                        setReplyText(e.target.value);
                        if (ws?.readyState === WebSocket.OPEN) {
                          ws.send(JSON.stringify({ action: 'typing' }));
                          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                          typingTimeoutRef.current = setTimeout(() => {
                            ws.send(JSON.stringify({ action: 'stop_typing' }));
                          }, 3000);
                        }
                      }}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message to admin..." 
                      className={`w-full pl-5 pr-14 py-4 rounded-2xl border-2 transition-all ${
                        dark 
                          ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500 placeholder:text-gray-500' 
                          : 'bg-white border-gray-200 focus:border-emerald-500 shadow-sm placeholder:text-gray-400 font-medium text-slate-800'
                      } outline-none text-sm`}
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={sendingMsg || !replyText.trim()}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all active:scale-95 ${
                        replyText.trim() 
                          ? 'bg-[#0d9488] text-white shadow-lg shadow-teal-500/30 hover:bg-[#0f766e]' 
                          : dark 
                            ? 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {sendingMsg ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
