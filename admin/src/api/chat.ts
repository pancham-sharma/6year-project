import { fetchAPI } from '../utils/api';

export const getConversations = async () => {
  const [users, unread] = await Promise.all([
    fetchAPI('/api/users/list/'),
    fetchAPI('/api/chat/messages/unread_counts/')
  ]);
  
  const usersList = users.results || users || [];
  const unreadCounts = unread || [];
  
  return usersList.map((u: any) => ({
    ...u,
    unread_count: unreadCounts.find((c: any) => String(c.user_id) === String(u.id))?.unread_count || 0
  }));
};

export const getMessages = async ({ pageParam = 1, otherUserId }: { pageParam?: number, otherUserId: string }) => {
  if (!otherUserId) return { data: [], meta: { totalPages: 1 } };
  const res = await fetchAPI(`/api/chat/messages/?other_user_id=${otherUserId}&page=${pageParam}`);
  return res;
};

export const markChatAsRead = async (otherUserId: string) => {
  return fetchAPI('/api/chat/messages/mark_read/', {
    method: 'POST',
    body: JSON.stringify({ other_user_id: otherUserId })
  });
};
