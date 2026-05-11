import { fetchAPI } from '../utils/api';

export const getConversations = async () => {
  return fetchAPI('/api/chat/messages/conversations/');
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
