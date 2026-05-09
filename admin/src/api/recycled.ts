import { fetchAPI } from '../utils/api';

export const getRecycledItems = async () => {
  const [donRes, appRes, notifRes, msgRes] = await Promise.all([
    fetchAPI('/api/donations/'),
    fetchAPI('/api/users/volunteer/admin/list/'),
    fetchAPI('/api/chat/notifications/'),
    fetchAPI('/api/chat/messages/')
  ]);
  
  const allDons = donRes.results || donRes || [];
  const allApps = appRes.results || appRes || [];
  const allNotifs = notifRes.results || notifRes || [];
  const allMsgs = msgRes.results || msgRes || [];
  
  return {
    donations: allDons.filter((d: any) => d.status === 'Recycled'),
    applications: allApps.filter((a: any) => a.status === 'Recycled'),
    notifications: allNotifs.filter((n: any) => n.status === 'Recycled'),
    messages: allMsgs.filter((m: any) => m.status === 'Recycled')
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
