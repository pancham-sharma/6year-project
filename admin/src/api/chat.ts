import { fetchAPI } from '../utils/api';

export const getConversations = async () => {
  const res = await fetchAPI('/api/chat/messages/conversations/');
  // Conversations endpoint returns a plain array — normalize just in case
  return Array.isArray(res) ? res : (res?.data ?? res?.results ?? []);
};

export const getMessages = async ({ pageParam = 1, otherUserId }: { pageParam?: number, otherUserId: string }) => {
  if (!otherUserId) return { data: [], meta: { totalPages: 1, nextPage: undefined } };
  const res = await fetchAPI(`/api/chat/messages/?other_user_id=${otherUserId}&page=${pageParam}`);

  // Handle CustomPagination {data, meta} or plain array
  const messages: any[] = Array.isArray(res)
    ? res
    : (res?.data ?? res?.results ?? []);

  const meta = res?.meta ?? {};
  const currentPage: number = meta?.page ?? pageParam;
  const totalPages: number = meta?.totalPages ?? 1;
  const nextPage = meta?.hasNext || currentPage < totalPages ? currentPage + 1 : undefined;

  return {
    data: messages,
    meta: { ...meta, nextPage }
  };
};

export const markChatAsRead = async (otherUserId: string) => {
  return fetchAPI('/api/chat/messages/mark_read/', {
    method: 'POST',
    body: JSON.stringify({ other_user_id: otherUserId })
  });
};
