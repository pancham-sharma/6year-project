import { fetchAPI } from '../utils/api';

export const getVolunteersData = async () => {
  const [appsRes, activeRes] = await Promise.all([
    fetchAPI('/api/users/volunteer/admin/list/'),
    fetchAPI('/api/users/volunteer/admin/active/')
  ]);
  return {
    applications: appsRes.results || appsRes || [],
    active: activeRes.results || activeRes || []
  };
};

export const updateVolunteerStatus = async (id: number, status: string) => {
  return await fetchAPI(`/api/users/volunteer/admin/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};
