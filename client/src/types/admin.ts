export type TeamRole = 'ADMIN' | 'VENDOR';

export interface AdminTeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: TeamRole;
  verifiedEmail: boolean;
  createdAt: string;
}

export type AdminInvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED';

export interface AdminInvitation {
  id: string;
  email: string;
  role: TeamRole;
  status: AdminInvitationStatus;
  invitedByName: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface CreateAdminInvitationPayload {
  email: string;
  role: TeamRole;
}

export interface CreateAdminInvitationResponse {
  message: string;
  expiresAt: string;
}

export interface AcceptAdminInvitationPayload {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber?: string;
}

export interface AcceptAdminInvitationResponse {
  message: string;
}

export interface DeleteAdminInvitationResponse {
  message: string;
}

export interface MetricWithTrend {
  value: number;
  formattedValue: string;
  trend: number;
  isPositive: boolean;
}

export interface DashboardChartPoint {
  label: string;
  revenue: number;
  orders: number;
  users: number;
}

export interface RecentOrder {
  id: string;
  customer: string;
  total: number;
  status: string;
  date: string;
}

export interface BestSellingProduct {
  name: string;
  unitsSold: number;
  revenue: number;
}

export interface AdminDashboardStats {
  revenue: MetricWithTrend;
  orders: MetricWithTrend;
  users: MetricWithTrend;
  points: MetricWithTrend;
  chartData: DashboardChartPoint[];
  bestSellingProduct: BestSellingProduct | null;
  recentOrders: RecentOrder[];
  totalProducts: number;
}

export interface ActivityLogEntry {
  id: string;
  actorId: string;
  actorName: string | null;
  actorRole: 'ADMIN' | 'VENDOR' | null;
  entityType: string;
  entityId: string | null;
  action: string;
  description: string | null;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ActivityLogFilters {
  page?: number;
  limit?: number;
  entityType?: string;
  action?: string;
  actorId?: string;
  actorRole?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface LoyaltyCustomer {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
  };
  points: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  totalPurchases: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}
