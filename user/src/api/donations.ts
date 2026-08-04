import { fetchAPI } from '../utils/api';

export const getUserDonations = async (page: number = 1, limit: number = 5) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  return await fetchAPI(`/api/donations/?${queryParams.toString()}`);
};

export const getCategories = async () => {
  const res = await fetchAPI('/api/donations/categories/?limit=100');
  return Array.isArray(res) ? res : (res?.data ?? res?.results ?? []);
};

export const getUserStats = async () => {
  return await fetchAPI('/api/donations/user_stats/');
};
