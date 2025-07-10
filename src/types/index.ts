export type UserType = 'customer' | 'partner';

export type PickupStatus = 'pending' | 'accepted' | 'in-process' | 'pending-approval' | 'completed';

export interface User {
  id: string;
  phoneNumber: string;
  name: string;
  type: UserType;
}

export interface PickupRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  partnerId?: string;
  partnerName?: string;
  partnerPhone?: string;
  pickupDate: string;
  timeSlot: string;
  address: string;
  mapLink?: string;
  status: PickupStatus;
  pickupCode?: string;
  items?: PickupItem[];
  totalAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PickupItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface DataState {
  pickupRequests: PickupRequest[];
  loading: boolean;
  error: string | null;
} 