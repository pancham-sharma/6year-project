import { fetchAPI } from '../utils/api';

export const getInventoryItems = async () => {
  return await fetchAPI('/api/inventory/items/');
};

export const getImpactMetrics = async () => {
  return await fetchAPI('/api/inventory/impact-metrics/');
};

export const updateInventoryItem = async (id: number, data: any) => {
  return await fetchAPI(`/api/inventory/items/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
};
