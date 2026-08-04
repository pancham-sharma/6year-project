import { fetchAPI } from '../utils/api';

export const getVolunteersData = async () => {
  const [appsRes, activeRes] = await Promise.all([
    fetchAPI('/api/users/volunteer/admin/list/'),
    fetchAPI('/api/users/volunteer/admin/active/')
  ]);
  return {
    // Handle CustomPagination {data, meta}, DRF default {results}, or plain array
    applications: Array.isArray(appsRes)
      ? appsRes
      : (appsRes?.data ?? appsRes?.results ?? []),
    active: Array.isArray(activeRes)
      ? activeRes
      : (activeRes?.data ?? activeRes?.results ?? [])
  };
};

export const updateVolunteerStatus = async (id: number, status: string) => {
  return await fetchAPI(`/api/users/volunteer/admin/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};
