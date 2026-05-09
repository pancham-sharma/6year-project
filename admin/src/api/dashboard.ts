import { fetchAPI } from '../utils/api';

export const getDashboardData = async () => {
  const [donsRes, invRes, notifsRes] = await Promise.all([
    fetchAPI('/api/donations/').catch(() => []),
    fetchAPI('/api/inventory/items/').catch(() => []),
    fetchAPI('/api/chat/notifications/').catch(() => [])
  ]);
  return {
    donations: donsRes.results || donsRes || [],
    inventory: invRes.results || invRes || [],
    notifications: notifsRes.results || notifsRes || []
  };
};
