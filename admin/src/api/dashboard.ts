import { fetchAPI } from '../utils/api';

export const getDashboardData = async () => {
  const data = await fetchAPI('/api/donations/dashboard-summary/');
  return {
    donations: data.recent_donations || [],
    inventory: data.inventory || [],
    stats: data.stats || {},
    categories: data.categories || [],
    impact_stats: data.impact_stats || []
  };
};
