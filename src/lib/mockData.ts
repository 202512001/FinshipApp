// BACKEND INTEGRATION POINT: Replace all exports with API calls to your cloud database

export type Gender = 'Male' | 'Female';
export type MemberStatus = 'pending' | 'approved' | 'blocked';
export type AdminRole = 'main' | 'male' | 'female';

export interface Member {
  id: string;
  name: string;
  mobile: string;
  gender: Gender;
  society: string;
  area: string;
  lat: number;
  lng: number;
  status: MemberStatus;
  registeredAt: string;
  lastActive: string;
  pin?: string;
}

export interface Admin {
  id: string;
  name: string;
  mobile: string;
  gender: Gender;
  role: AdminRole;
  password: string;
  createdAt: string;
}

export interface CommunityRecord {
  id: string;
  name: string;
  mobile: string;
  gender: Gender;
  area: string;
  society: string;
  block: string;
  building: string;
  lat: number;
  lng: number;
  lastVisitedDate: string | null;
  visitCount: number;
  priority: 'high' | 'medium' | 'low';
  notes: string;
}

export interface VisitRecord {
  id: string;
  communityRecordId: string;
  communityRecordName: string;
  groupId: string;
  groupMembers: string[];
  adminId: string;
  adminName: string;
  visitDate: string;
  visitTime: string;
  notes: string;
  gender: Gender;
}

export interface Alert {
  id: string;
  senderId: string;
  senderName: string;
  senderArea: string;
  senderSociety: string;
  gender: Gender;
  sentAt: string;
  expiresAt: string;
  acceptedBy: string[];
  status: 'active' | 'expired' | 'grouped';
}

export interface Group {
  id: string;
  alertId: string;
  gender: Gender;
  members: string[];
  memberNames: string[];
  societies: string[];
  recommendedVisit: string | null;
  formedAt: string;
  status: 'active' | 'completed';
}

// Mock Members
export const mockMembers: Member[] = [
  {
    id: 'member-001',
    name: 'Yusuf Bhai Patel',
    mobile: '9876543210',
    gender: 'Male',
    society: 'Al-Noor Society',
    area: 'Area A - Jogeshwari',
    lat: 19.1307,
    lng: 72.8497,
    status: 'approved',
    registeredAt: '2026-01-10',
    lastActive: '2026-06-30',
    pin: '1234',
  },
  {
    id: 'member-002',
    name: 'Ibrahim Shaikh',
    mobile: '9876543211',
    gender: 'Male',
    society: 'Bismillah Complex',
    area: 'Area A - Jogeshwari',
    lat: 19.1325,
    lng: 72.8510,
    status: 'approved',
    registeredAt: '2026-01-15',
    lastActive: '2026-06-29',
    pin: '2345',
  },
  {
    id: 'member-003',
    name: 'Farhan Qureshi',
    mobile: '9876543212',
    gender: 'Male',
    society: 'Rehmat Nagar',
    area: 'Area B - Andheri',
    lat: 19.1136,
    lng: 72.8697,
    status: 'approved',
    registeredAt: '2026-02-01',
    lastActive: '2026-06-28',
    pin: '3456',
  },
  {
    id: 'member-004',
    name: 'Rashid Mansuri',
    mobile: '9876543213',
    gender: 'Male',
    society: 'Gulshan-e-Madina',
    area: 'Area A - Jogeshwari',
    lat: 19.1290,
    lng: 72.8480,
    status: 'pending',
    registeredAt: '2026-06-28',
    lastActive: '2026-06-28',
  },
  {
    id: 'member-005',
    name: 'Zubair Khan',
    mobile: '9876543214',
    gender: 'Male',
    society: 'Madina Colony',
    area: 'Area B - Andheri',
    lat: 19.1150,
    lng: 72.8680,
    status: 'pending',
    registeredAt: '2026-06-29',
    lastActive: '2026-06-29',
  },
  {
    id: 'member-006',
    name: 'Fatima Bhen Shaikh',
    mobile: '9876543215',
    gender: 'Female',
    society: 'Al-Noor Society',
    area: 'Area A - Jogeshwari',
    lat: 19.1307,
    lng: 72.8497,
    status: 'approved',
    registeredAt: '2026-01-20',
    lastActive: '2026-06-30',
    pin: '4567',
  },
  {
    id: 'member-007',
    name: 'Rukhsana Ansari',
    mobile: '9876543216',
    gender: 'Female',
    society: 'Bismillah Complex',
    area: 'Area A - Jogeshwari',
    lat: 19.1325,
    lng: 72.8510,
    status: 'approved',
    registeredAt: '2026-02-10',
    lastActive: '2026-06-29',
    pin: '5678',
  },
  {
    id: 'member-008',
    name: 'Nusrat Begum',
    mobile: '9876543217',
    gender: 'Female',
    society: 'Rehmat Nagar',
    area: 'Area B - Andheri',
    lat: 19.1136,
    lng: 72.8697,
    status: 'pending',
    registeredAt: '2026-06-30',
    lastActive: '2026-06-30',
  },
];

// Mock Community Records
export const mockCommunityRecords: CommunityRecord[] = [
  {
    id: 'rec-001',
    name: 'Abdul Karim Memon',
    mobile: '9800000001',
    gender: 'Male',
    area: 'Area A - Jogeshwari',
    society: 'Al-Noor Society',
    block: 'Block 3',
    building: 'Noor Manzil',
    lat: 19.1310,
    lng: 72.8500,
    lastVisitedDate: '2026-04-10',
    visitCount: 12,
    priority: 'medium',
    notes: 'Elderly, prefers afternoon visits',
  },
  {
    id: 'rec-002',
    name: 'Hafiz Ismail Siddiqui',
    mobile: '9800000002',
    gender: 'Male',
    area: 'Area A - Jogeshwari',
    society: 'Bismillah Complex',
    block: 'Block 1',
    building: 'Rahmat Building',
    lat: 19.1328,
    lng: 72.8512,
    lastVisitedDate: '2026-01-15',
    visitCount: 3,
    priority: 'high',
    notes: 'Unwell, needs regular check-ins',
  },
  {
    id: 'rec-003',
    name: 'Mohammad Salim Vohra',
    mobile: '9800000003',
    gender: 'Male',
    area: 'Area B - Andheri',
    society: 'Rehmat Nagar',
    block: 'Block 7',
    building: 'Salim Villa',
    lat: 19.1140,
    lng: 72.8700,
    lastVisitedDate: '2026-05-20',
    visitCount: 8,
    priority: 'low',
    notes: '',
  },
  {
    id: 'rec-004',
    name: 'Suleman Bhai Rangwala',
    mobile: '9800000004',
    gender: 'Male',
    area: 'Area B - Andheri',
    society: 'Gulshan-e-Madina',
    block: 'Block 2',
    building: 'Gulshan Tower A',
    lat: 19.1160,
    lng: 72.8660,
    lastVisitedDate: null,
    visitCount: 0,
    priority: 'high',
    notes: 'New to area, never visited',
  },
  {
    id: 'rec-005',
    name: 'Yaqub Hussain Tamboli',
    mobile: '9800000005',
    gender: 'Male',
    area: 'Area A - Jogeshwari',
    society: 'Madina Colony',
    block: 'Block 4',
    building: 'Hussain Bungalow',
    lat: 19.1295,
    lng: 72.8490,
    lastVisitedDate: '2026-06-01',
    visitCount: 5,
    priority: 'medium',
    notes: '',
  },
  {
    id: 'rec-006',
    name: 'Amina Bhen Lokhandwala',
    mobile: '9800000006',
    gender: 'Female',
    area: 'Area A - Jogeshwari',
    society: 'Al-Noor Society',
    block: 'Block 2',
    building: 'Amina Manzil',
    lat: 19.1305,
    lng: 72.8495,
    lastVisitedDate: '2026-03-22',
    visitCount: 7,
    priority: 'medium',
    notes: 'Widow, lives alone',
  },
  {
    id: 'rec-007',
    name: 'Khadija Bhen Patel',
    mobile: '9800000007',
    gender: 'Female',
    area: 'Area A - Jogeshwari',
    society: 'Bismillah Complex',
    block: 'Block 5',
    building: 'Khadija House',
    lat: 19.1320,
    lng: 72.8505,
    lastVisitedDate: null,
    visitCount: 0,
    priority: 'high',
    notes: 'Elderly, no family nearby',
  },
  {
    id: 'rec-008',
    name: 'Zainab Begum Shaikh',
    mobile: '9800000008',
    gender: 'Female',
    area: 'Area B - Andheri',
    society: 'Rehmat Nagar',
    block: 'Block 9',
    building: 'Zainab Niwas',
    lat: 19.1130,
    lng: 72.8695,
    lastVisitedDate: '2026-06-15',
    visitCount: 4,
    priority: 'low',
    notes: '',
  },
];

// Mock Visit Records
export const mockVisitRecords: VisitRecord[] = [
  {
    id: 'visit-001',
    communityRecordId: 'rec-001',
    communityRecordName: 'Abdul Karim Memon',
    groupId: 'group-001',
    groupMembers: ['Yusuf Bhai Patel', 'Ibrahim Shaikh', 'Farhan Qureshi'],
    adminId: 'admin-001',
    adminName: 'Admin Salim',
    visitDate: '2026-04-10',
    visitTime: '15:30',
    notes: 'Alhamdulillah, he was in good health. Spent 45 minutes.',
    gender: 'Male',
  },
  {
    id: 'visit-002',
    communityRecordId: 'rec-002',
    communityRecordName: 'Hafiz Ismail Siddiqui',
    groupId: 'group-002',
    groupMembers: ['Yusuf Bhai Patel', 'Rashid Mansuri'],
    adminId: 'admin-001',
    adminName: 'Admin Salim',
    visitDate: '2026-01-15',
    visitTime: '11:00',
    notes: 'Not feeling well. Needs follow-up.',
    gender: 'Male',
  },
  {
    id: 'visit-003',
    communityRecordId: 'rec-003',
    communityRecordName: 'Mohammad Salim Vohra',
    groupId: 'group-003',
    groupMembers: ['Ibrahim Shaikh', 'Farhan Qureshi', 'Zubair Khan', 'Yusuf Bhai Patel'],
    adminId: 'admin-001',
    adminName: 'Admin Salim',
    visitDate: '2026-05-20',
    visitTime: '16:00',
    notes: '',
    gender: 'Male',
  },
  {
    id: 'visit-004',
    communityRecordId: 'rec-006',
    communityRecordName: 'Amina Bhen Lokhandwala',
    groupId: 'group-004',
    groupMembers: ['Fatima Bhen Shaikh', 'Rukhsana Ansari'],
    adminId: 'admin-002',
    adminName: 'Admin Fatima',
    visitDate: '2026-03-22',
    visitTime: '10:30',
    notes: 'She was happy to have visitors. Brought food.',
    gender: 'Female',
  },
];

// Mock Alerts
export const mockAlerts: Alert[] = [
  {
    id: 'alert-001',
    senderId: 'member-001',
    senderName: 'Yusuf Bhai Patel',
    senderArea: 'Area A - Jogeshwari',
    senderSociety: 'Al-Noor Society',
    gender: 'Male',
    sentAt: new Date(Date.now() - 90000).toISOString(),
    expiresAt: new Date(Date.now() + 150000).toISOString(),
    acceptedBy: ['member-002'],
    status: 'active',
  },
];

// Mock Groups
export const mockGroups: Group[] = [
  {
    id: 'group-001',
    alertId: 'alert-prev-001',
    gender: 'Male',
    members: ['member-001', 'member-002', 'member-003'],
    memberNames: ['Yusuf Bhai Patel', 'Ibrahim Shaikh', 'Farhan Qureshi'],
    societies: ['Al-Noor Society', 'Bismillah Complex', 'Rehmat Nagar'],
    recommendedVisit: 'rec-001',
    formedAt: '2026-06-29T14:30:00Z',
    status: 'completed',
  },
];

//export const ADMIN_PANEL_PASSWORD = 'WeWill2026';

/*export const demoCredentials = [
  { role: 'Male Member', mobile: '9099920875', pin: '1234', name: 'Dhyey' },
  { role: 'Female Member', mobile: '9904040385', pin: '1234', name: 'Shruti' },
  { role: 'Admin Panel', mobile: 'N/A', pin: '(contact main admin)', name: 'Password Entry' },
];*/

