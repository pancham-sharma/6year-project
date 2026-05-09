import { fetchAPI } from '../utils/api';

export interface Donation {
  id: string;
  donorName: string;
  contact: string;
  address: string;
  city: string;
  category: string;
  quantity: string;
  date: string;
  status: string;
  scheduled_time: string;
  scheduled_date: string;
  assigned_team: string;
  notes: string;
}

export interface PaginatedDonations {
  data: Donation[];
  total: number;
  page: number;
  totalPages: number;
}

export const getDonations = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
  category: string = ''
): Promise<PaginatedDonations> => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (search) queryParams.append('search', search);
  if (category && category !== 'All') queryParams.append('category', category);

  const response = await fetchAPI(`/api/donations/?${queryParams.toString()}`);
  
  // Map backend fields to frontend structure
  const formattedData = response.data.map((d: any) => ({
    id: d.id.toString(),
    donorName: d.donor,
    contact: d.donor_phone || 'N/A',
    address: d.pickup_details ? d.pickup_details.full_address : 'N/A',
    city: d.pickup_details ? d.pickup_details.city : 'N/A',
    category: d.category,
    quantity: d.quantity_description,
    date: new Date(d.timestamp).toLocaleDateString(),
    status: d.status,
    scheduled_time: d.pickup_details ? d.pickup_details.scheduled_time : '',
    scheduled_date: d.pickup_details ? d.pickup_details.scheduled_date : '',
    assigned_team: d.pickup_details ? d.pickup_details.assigned_team : '',
    notes: ''
  }));

  return {
    ...response,
    data: formattedData
  };
};
