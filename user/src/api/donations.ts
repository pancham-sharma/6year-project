import { fetchAPI } from '../utils/api';

export const getUserDonations = async (page: number = 1, limit: number = 5) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  return await fetchAPI(`/api/donations/?${queryParams.toString()}`);
};

export const getCategories = async () => {
  return await fetchAPI('/api/donations/categories/');
};
