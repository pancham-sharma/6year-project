import { fetchAPI } from '../utils/api';

export const getRecycledItems = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
  type: 'donation' | 'application' | 'notification' | 'message' = 'donation'
) => {
  let endpoint = '';
  if (type === 'donation')      endpoint = '/api/donations/';
  else if (type === 'application') endpoint = '/api/users/volunteer/admin/list/';
  else if (type === 'notification') endpoint = '/api/chat/notifications/';
  else if (type === 'message')  endpoint = '/api/chat/messages/';

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    status: 'Recycled'
  });
  
  if (search) queryParams.append('search', search);

  const response = await fetchAPI(`${endpoint}?${queryParams.toString()}`);
  
  // All these viewsets use CustomPagination now
  return {
    data: response.data || [],
    meta: {
      total: response.meta?.total || 0,
      page: response.meta?.page || 1,
      totalPages: response.meta?.totalPages || 1
    }
  };
};

export const restoreItemAPI = async (id: any, type: string) => {
  let endpoint = '';
  let restoreStatus = 'Pending';
  if (type === 'donation')     { endpoint = `/api/donations/${id}/`; restoreStatus = 'Pending'; }
  else if (type === 'application') { endpoint = `/api/users/volunteer/admin/${id}/`; restoreStatus = 'Pending'; }
  else if (type === 'notification') { endpoint = `/api/chat/notifications/${id}/`; restoreStatus = 'Active'; }
  else if (type === 'message')  { endpoint = `/api/chat/messages/${id}/`; restoreStatus = 'Active'; }
    
  return await fetchAPI(endpoint, {
    method: 'PATCH',
    body: JSON.stringify({ status: restoreStatus })
  });
};

export const deleteItemAPI = async (id: any, type: string) => {
  let endpoint = '';
  if (type === 'donation')      endpoint = `/api/donations/${id}/`;
  else if (type === 'application') endpoint = `/api/users/volunteer/admin/${id}/`;
  else if (type === 'notification') endpoint = `/api/chat/notifications/${id}/`;
  else if (type === 'message')  endpoint = `/api/chat/messages/${id}/`;
    
  return await fetchAPI(endpoint, { method: 'DELETE' });
};
