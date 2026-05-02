export type DonationStatus = 'Pending' | 'Scheduled' | 'Completed' | 'Cancelled';
export type DonationCategory = 'Food' | 'Clothes' | 'Books' | 'Monetary' | 'Environment';

export interface Donation {
  id: string;
  donorName: string;
  contact: string;
  address: string;
  city: string;
  category: DonationCategory;
  quantity: string;
  amount?: number;
  date: string;
  status: DonationStatus;
  notes?: string;
  pickupTime?: string;
  assignedTo?: string;
}

export interface InventoryItem {
  category: DonationCategory;
  icon: string;
  color: string;
  totalReceived: number;
  distributed: number;
  unit: string;
  lastUpdated: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  totalDonations: number;
  lastDonation: string;
  status: 'Active' | 'Inactive';
  avatar: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  type: 'sent' | 'received';
}

export interface Conversation {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: Message[];
  donationRef?: string;
}

export interface Notification {
  id: string;
  type: 'donation' | 'message' | 'pickup' | 'alert';
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export const donations: Donation[] = [
  { id: 'DON-001', donorName: 'Sarah Mitchell', contact: '+1 (555) 234-5678', address: '142 Maple Avenue', city: 'Brooklyn', category: 'Food', quantity: '25 kg', date: '2025-06-18', status: 'Completed', pickupTime: '10:00 AM', assignedTo: 'Team Alpha' },
  { id: 'DON-002', donorName: 'James Harrington', contact: '+1 (555) 876-5432', address: '78 Sunset Blvd', city: 'Queens', category: 'Clothes', quantity: '40 items', date: '2025-06-19', status: 'Scheduled', pickupTime: '2:00 PM', assignedTo: 'Team Beta' },
  { id: 'DON-003', donorName: 'Priya Nair', contact: '+1 (555) 345-6789', address: '22 Oak Street', city: 'Manhattan', category: 'Books', quantity: '60 books', date: '2025-06-20', status: 'Pending', notes: 'Children\'s books mostly' },
  { id: 'DON-004', donorName: 'Carlos Rivera', contact: '+1 (555) 654-3210', address: '55 Park Lane', city: 'Bronx', category: 'Monetary', quantity: '$500', amount: 500, date: '2025-06-17', status: 'Completed', notes: 'Online transfer' },
  { id: 'DON-005', donorName: 'Emily Chen', contact: '+1 (555) 111-2233', address: '301 Birch Road', city: 'Staten Island', category: 'Environment', quantity: '5 saplings', date: '2025-06-21', status: 'Pending', notes: 'Fruit-bearing trees' },
  { id: 'DON-006', donorName: 'Mohammed Al-Rashid', contact: '+1 (555) 444-7788', address: '18 Riverside Dr', city: 'Brooklyn', category: 'Food', quantity: '15 kg', date: '2025-06-22', status: 'Scheduled', pickupTime: '11:30 AM', assignedTo: 'Team Alpha' },
  { id: 'DON-007', donorName: 'Aisha Thompson', contact: '+1 (555) 998-8776', address: '90 Garden Ave', city: 'Queens', category: 'Clothes', quantity: '25 items', date: '2025-06-22', status: 'Pending' },
  { id: 'DON-008', donorName: 'David Park', contact: '+1 (555) 567-8900', address: '14 Cherry Lane', city: 'Manhattan', category: 'Books', quantity: '30 books', date: '2025-06-16', status: 'Completed', pickupTime: '9:00 AM', assignedTo: 'Team Gamma' },
  { id: 'DON-009', donorName: 'Laura Simmons', contact: '+1 (555) 333-4455', address: '67 Willow Way', city: 'Bronx', category: 'Monetary', quantity: '$250', amount: 250, date: '2025-06-23', status: 'Completed', notes: 'Card payment' },
  { id: 'DON-010', donorName: 'Raj Patel', contact: '+1 (555) 222-3344', address: '5 Green Valley Rd', city: 'Staten Island', category: 'Environment', quantity: '10 saplings', date: '2025-06-24', status: 'Scheduled', pickupTime: '3:00 PM', assignedTo: 'Team Beta' },
  { id: 'DON-011', donorName: 'Sophie Laurent', contact: '+1 (555) 777-8899', address: '33 Elm Street', city: 'Brooklyn', category: 'Food', quantity: '40 kg', date: '2025-06-15', status: 'Completed', pickupTime: '10:00 AM', assignedTo: 'Team Gamma' },
  { id: 'DON-012', donorName: 'Kevin O\'Brien', contact: '+1 (555) 100-2000', address: '88 Harbor View', city: 'Queens', category: 'Clothes', quantity: '55 items', date: '2025-06-23', status: 'Pending', notes: 'Winter wear' },
  { id: 'DON-013', donorName: 'Fatima Malik', contact: '+1 (555) 500-6000', address: '27 Crescent Ave', city: 'Manhattan', category: 'Monetary', quantity: '$1,000', amount: 1000, date: '2025-06-14', status: 'Completed' },
  { id: 'DON-014', donorName: 'Tom Bradley', contact: '+1 (555) 900-1234', address: '61 Pine Circle', city: 'Bronx', category: 'Books', quantity: '45 books', date: '2025-06-24', status: 'Scheduled', pickupTime: '1:00 PM', assignedTo: 'Team Alpha' },
  { id: 'DON-015', donorName: 'Nina Rossi', contact: '+1 (555) 600-7890', address: '12 Lavender Court', city: 'Brooklyn', category: 'Environment', quantity: '3 saplings', date: '2025-06-25', status: 'Pending' },
];

export const inventoryData: InventoryItem[] = [
  { category: 'Food', icon: '🍱', color: '#f59e0b', totalReceived: 580, distributed: 420, unit: 'kg', lastUpdated: '2025-06-24' },
  { category: 'Clothes', icon: '👗', color: '#8b5cf6', totalReceived: 1240, distributed: 890, unit: 'items', lastUpdated: '2025-06-23' },
  { category: 'Books', icon: '📚', color: '#3b82f6', totalReceived: 950, distributed: 670, unit: 'books', lastUpdated: '2025-06-22' },
  { category: 'Monetary', icon: '💰', color: '#10b981', totalReceived: 18750, distributed: 14200, unit: 'USD', lastUpdated: '2025-06-24' },
  { category: 'Environment', icon: '🌱', color: '#22c55e', totalReceived: 145, distributed: 98, unit: 'saplings', lastUpdated: '2025-06-21' },
];

export const users: User[] = [
  { id: 'USR-001', name: 'Sarah Mitchell', email: 'sarah.m@email.com', phone: '+1 (555) 234-5678', joinDate: '2024-11-10', totalDonations: 8, lastDonation: '2025-06-18', status: 'Active', avatar: 'SM' },
  { id: 'USR-002', name: 'James Harrington', email: 'james.h@email.com', phone: '+1 (555) 876-5432', joinDate: '2024-09-05', totalDonations: 5, lastDonation: '2025-06-19', status: 'Active', avatar: 'JH' },
  { id: 'USR-003', name: 'Priya Nair', email: 'priya.n@email.com', phone: '+1 (555) 345-6789', joinDate: '2025-01-22', totalDonations: 3, lastDonation: '2025-06-20', status: 'Active', avatar: 'PN' },
  { id: 'USR-004', name: 'Carlos Rivera', email: 'carlos.r@email.com', phone: '+1 (555) 654-3210', joinDate: '2024-07-14', totalDonations: 12, lastDonation: '2025-06-17', status: 'Active', avatar: 'CR' },
  { id: 'USR-005', name: 'Emily Chen', email: 'emily.c@email.com', phone: '+1 (555) 111-2233', joinDate: '2025-03-08', totalDonations: 2, lastDonation: '2025-06-21', status: 'Active', avatar: 'EC' },
  { id: 'USR-006', name: 'Mohammed Al-Rashid', email: 'mo.rashid@email.com', phone: '+1 (555) 444-7788', joinDate: '2024-12-01', totalDonations: 6, lastDonation: '2025-06-22', status: 'Active', avatar: 'MR' },
  { id: 'USR-007', name: 'Aisha Thompson', email: 'aisha.t@email.com', phone: '+1 (555) 998-8776', joinDate: '2025-02-14', totalDonations: 4, lastDonation: '2025-06-22', status: 'Inactive', avatar: 'AT' },
  { id: 'USR-008', name: 'David Park', email: 'david.p@email.com', phone: '+1 (555) 567-8900', joinDate: '2024-08-30', totalDonations: 9, lastDonation: '2025-06-16', status: 'Active', avatar: 'DP' },
  { id: 'USR-009', name: 'Laura Simmons', email: 'laura.s@email.com', phone: '+1 (555) 333-4455', joinDate: '2024-10-15', totalDonations: 7, lastDonation: '2025-06-23', status: 'Active', avatar: 'LS' },
  { id: 'USR-010', name: 'Raj Patel', email: 'raj.p@email.com', phone: '+1 (555) 222-3344', joinDate: '2025-04-20', totalDonations: 2, lastDonation: '2025-06-24', status: 'Active', avatar: 'RP' },
];

export const conversations: Conversation[] = [
  {
    id: 'CONV-001', userId: 'USR-001', userName: 'Sarah Mitchell', avatar: 'SM',
    lastMessage: 'Thank you for the confirmation!', lastTime: '10:32 AM', unread: 0,
    donationRef: 'DON-001',
    messages: [
      { id: 'm1', senderId: 'USR-001', text: 'Hi, I have some food items ready for pickup. About 25 kg of rice and lentils.', timestamp: '10:00 AM', type: 'received' },
      { id: 'm2', senderId: 'admin', text: 'Hello Sarah! That\'s wonderful. We\'ll arrange a pickup for you. Could you confirm your address?', timestamp: '10:05 AM', type: 'sent' },
      { id: 'm3', senderId: 'USR-001', text: '142 Maple Avenue, Brooklyn. I\'m available tomorrow morning.', timestamp: '10:08 AM', type: 'received' },
      { id: 'm4', senderId: 'admin', text: 'Perfect! We\'ve scheduled your pickup for tomorrow at 10:00 AM. Our Team Alpha will be there.', timestamp: '10:20 AM', type: 'sent' },
      { id: 'm5', senderId: 'USR-001', text: 'Thank you for the confirmation!', timestamp: '10:32 AM', type: 'received' },
    ]
  },
  {
    id: 'CONV-002', userId: 'USR-002', userName: 'James Harrington', avatar: 'JH',
    lastMessage: 'Can you pick up tomorrow at 2 PM?', lastTime: '9:15 AM', unread: 2,
    donationRef: 'DON-002',
    messages: [
      { id: 'm1', senderId: 'USR-002', text: 'Hello, I want to donate some clothes. Around 40 items for adults and children.', timestamp: '9:00 AM', type: 'received' },
      { id: 'm2', senderId: 'admin', text: 'Hi James! Great initiative. We\'d love to collect them. What\'s your preferred date?', timestamp: '9:05 AM', type: 'sent' },
      { id: 'm3', senderId: 'USR-002', text: 'Can you pick up tomorrow at 2 PM?', timestamp: '9:15 AM', type: 'received' },
    ]
  },
  {
    id: 'CONV-003', userId: 'USR-003', userName: 'Priya Nair', avatar: 'PN',
    lastMessage: 'Mostly children\'s books, ages 5-10', lastTime: 'Yesterday', unread: 1,
    donationRef: 'DON-003',
    messages: [
      { id: 'm1', senderId: 'USR-003', text: 'I have about 60 books to donate. Mostly children\'s books, ages 5-10', timestamp: 'Yesterday 3:00 PM', type: 'received' },
      { id: 'm2', senderId: 'admin', text: 'That\'s amazing Priya! Those will be very valuable. We\'ll contact you shortly to schedule a pickup.', timestamp: 'Yesterday 3:30 PM', type: 'sent' },
    ]
  },
  {
    id: 'CONV-004', userId: 'USR-004', userName: 'Carlos Rivera', avatar: 'CR',
    lastMessage: 'Transfer has been completed', lastTime: 'Jun 17', unread: 0,
    donationRef: 'DON-004',
    messages: [
      { id: 'm1', senderId: 'USR-004', text: 'I\'ve made a $500 monetary donation via bank transfer.', timestamp: 'Jun 17 11:00 AM', type: 'received' },
      { id: 'm2', senderId: 'admin', text: 'Thank you so much Carlos! We\'ve received the transfer confirmation. Your generosity means a lot.', timestamp: 'Jun 17 11:30 AM', type: 'sent' },
      { id: 'm3', senderId: 'USR-004', text: 'Transfer has been completed', timestamp: 'Jun 17 12:00 PM', type: 'received' },
    ]
  },
  {
    id: 'CONV-005', userId: 'USR-006', userName: 'Mohammed Al-Rashid', avatar: 'MR',
    lastMessage: 'Will the team bring boxes?', lastTime: '8:45 AM', unread: 3,
    donationRef: 'DON-006',
    messages: [
      { id: 'm1', senderId: 'USR-006', text: 'Greetings! I have 15 kg of canned goods and dry food items.', timestamp: '8:30 AM', type: 'received' },
      { id: 'm2', senderId: 'USR-006', text: 'When can you schedule a pickup?', timestamp: '8:35 AM', type: 'received' },
      { id: 'm3', senderId: 'USR-006', text: 'Will the team bring boxes?', timestamp: '8:45 AM', type: 'received' },
    ]
  },
];

export const notifications: Notification[] = [
  { id: 'N1', type: 'donation', title: 'New Donation Received', description: 'Nina Rossi donated 3 saplings (Environment)', time: '5 min ago', read: false },
  { id: 'N2', type: 'message', title: 'New Message', description: 'Mohammed Al-Rashid sent 3 messages', time: '15 min ago', read: false },
  { id: 'N3', type: 'pickup', title: 'Pickup Scheduled', description: 'Tom Bradley pickup confirmed for 1:00 PM', time: '1 hour ago', read: false },
  { id: 'N4', type: 'donation', title: 'Donation Completed', description: 'Laura Simmons $250 monetary donation processed', time: '2 hours ago', read: true },
  { id: 'N5', type: 'alert', title: 'Low Stock Alert', description: 'Environment saplings stock below 50 units', time: '3 hours ago', read: true },
  { id: 'N6', type: 'pickup', title: 'Pickup Completed', description: 'Team Alpha completed pickup from Sarah Mitchell', time: '5 hours ago', read: true },
];

export const monthlyTrends = [
  { month: 'Jan', Food: 42, Clothes: 38, Books: 25, Monetary: 3200, Environment: 12 },
  { month: 'Feb', Food: 55, Clothes: 45, Books: 30, Monetary: 4100, Environment: 18 },
  { month: 'Mar', Food: 68, Clothes: 52, Books: 40, Monetary: 5200, Environment: 22 },
  { month: 'Apr', Food: 74, Clothes: 61, Books: 35, Monetary: 6400, Environment: 28 },
  { month: 'May', Food: 89, Clothes: 75, Books: 55, Monetary: 7800, Environment: 35 },
  { month: 'Jun', Food: 95, Clothes: 82, Books: 62, Monetary: 9200, Environment: 42 },
];

export const categoryPieData = [
  { name: 'Food', value: 580, color: '#f59e0b' },
  { name: 'Clothes', value: 1240, color: '#8b5cf6' },
  { name: 'Books', value: 950, color: '#3b82f6' },
  { name: 'Monetary', value: 18750, color: '#10b981' },
  { name: 'Environment', value: 145, color: '#22c55e' },
];

export const recentActivity = [
  { id: 1, action: 'New donation received', donor: 'Nina Rossi', category: 'Environment', time: '5 min ago', icon: '🌱' },
  { id: 2, action: 'Pickup completed', donor: 'Sophie Laurent', category: 'Food', time: '2 hours ago', icon: '✅' },
  { id: 3, action: 'Donation scheduled', donor: 'Tom Bradley', category: 'Books', time: '3 hours ago', icon: '📅' },
  { id: 4, action: 'Monetary donation', donor: 'Laura Simmons', category: 'Monetary', time: '4 hours ago', icon: '💰' },
  { id: 5, action: 'New donor registered', donor: 'Raj Patel', category: 'Environment', time: '5 hours ago', icon: '👤' },
  { id: 6, action: 'Pickup assigned', donor: 'Mohammed Al-Rashid', category: 'Food', time: '6 hours ago', icon: '🚗' },
];
