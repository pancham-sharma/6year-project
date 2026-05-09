import { fetchAPI } from '../utils/api';

export const getVolunteersData = async () => {
  const [appsRes, usersRes] = await Promise.all([
    fetchAPI('/api/users/volunteer/admin/list/'),
    fetchAPI('/api/users/list/')
  ]);
  return {
    applications: appsRes.results || appsRes || [],
    users: usersRes.results || usersRes || []
  };
};

export const updateVolunteerStatus = async (id: number, status: string) => {
  return await fetchAPI(`/api/users/volunteer/admin/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};
