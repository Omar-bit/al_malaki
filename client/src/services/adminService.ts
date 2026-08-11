import type {
  AcceptAdminInvitationPayload,
  AcceptAdminInvitationResponse,
  ActivityLogEntry,
  ActivityLogFilters,
  AdminDashboardStats,
  AdminInvitation,
  AdminTeamMember,
  CreateAdminInvitationPayload,
  CreateAdminInvitationResponse,
  DeleteAdminInvitationResponse,
  LoyaltyCustomer,
  PaginatedResponse,
} from '../types/admin';
import { api } from './apiClient';

export function getAdminTeam(): Promise<AdminTeamMember[]> {
  return api.get<AdminTeamMember[]>('/admin/team');
}

export function getAdminInvitations(): Promise<AdminInvitation[]> {
  return api.get<AdminInvitation[]>('/admin/invitations');
}

export function createAdminInvitation(
  payload: CreateAdminInvitationPayload,
): Promise<CreateAdminInvitationResponse> {
  return api.post<CreateAdminInvitationResponse>('/admin/invitations', payload);
}

export function acceptAdminInvitation(
  payload: AcceptAdminInvitationPayload,
): Promise<AcceptAdminInvitationResponse> {
  return api.post<AcceptAdminInvitationResponse>(
    '/admin/invitations/accept',
    payload,
  );
}

export function deleteAdminInvitation(
  invitationId: string,
): Promise<DeleteAdminInvitationResponse> {
  return api.delete<DeleteAdminInvitationResponse>(
    `/admin/invitations/${encodeURIComponent(invitationId)}`,
  );
}

export interface VendorDashboardStats {
  ordersToday: number;
  topClients: number;
  newMessages: number;
  activePromos: number;
  pendingOrders: number;
  activeInfluencerCampaigns: number;
}

export function getActivityLogs(
  filters?: ActivityLogFilters,
): Promise<PaginatedResponse<ActivityLogEntry>> {
  return api.get<PaginatedResponse<ActivityLogEntry>>('/admin/activity-log', {
    query: {
      page: filters?.page,
      limit: filters?.limit,
      entityType: filters?.entityType,
      action: filters?.action,
      actorId: filters?.actorId,
      actorRole: filters?.actorRole,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      search: filters?.search,
      sortBy: filters?.sortBy,
      sortOrder: filters?.sortOrder,
    },
  });
}

export function getAdminDashboardStats(
  period?: string,
  date?: string,
): Promise<AdminDashboardStats> {
  return api.get<AdminDashboardStats>('/admin/dashboard-stats', {
    query: { period, date },
  });
}

export function getVendorDashboardStats(): Promise<VendorDashboardStats> {
  return api.get<VendorDashboardStats>('/admin/vendor/dashboard-stats');
}

export function getLoyaltyCustomers(
  search?: string,
): Promise<LoyaltyCustomer[]> {
  return api.get<LoyaltyCustomer[]>('/admin/loyalty/customers', {
    query: { search },
  });
}

export function adjustCustomerPoints(
  userId: string,
  points: number,
  description?: string,
): Promise<LoyaltyCustomer> {
  return api.patch<LoyaltyCustomer>(
    `/admin/loyalty/customers/${userId}/adjust-points`,
    { points, description },
  );
}
