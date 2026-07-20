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
import { ApiError } from './authService';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000';

type ApiErrorPayload = {
  message?: string | string[];
  code?: string;
};

async function parseError(
  response: Response,
): Promise<{ message: string; code?: string }> {
  try {
    const payload = (await response.json()) as ApiErrorPayload;

    const code =
      typeof payload.code === 'string' && payload.code.trim().length > 0
        ? payload.code.trim()
        : undefined;

    if (Array.isArray(payload.message)) {
      return {
        message: payload.message.join(', '),
        code,
      };
    }

    if (typeof payload.message === 'string') {
      return {
        message: payload.message,
        code,
      };
    }
  } catch {
    // No-op: fallback below when response body is not JSON.
  }

  return {
    message: 'Request failed. Please try again.',
  };
}

export async function getAdminTeam(): Promise<AdminTeamMember[]> {
  const response = await fetch(`${API_BASE_URL}/admin/team`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as AdminTeamMember[];
}

export async function getAdminInvitations(): Promise<AdminInvitation[]> {
  const response = await fetch(`${API_BASE_URL}/admin/invitations`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as AdminInvitation[];
}

export async function createAdminInvitation(
  payload: CreateAdminInvitationPayload,
): Promise<CreateAdminInvitationResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/invitations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as CreateAdminInvitationResponse;
}

export async function acceptAdminInvitation(
  payload: AcceptAdminInvitationPayload,
): Promise<AcceptAdminInvitationResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/invitations/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as AcceptAdminInvitationResponse;
}

export async function deleteAdminInvitation(
  invitationId: string,
): Promise<DeleteAdminInvitationResponse> {
  const response = await fetch(
    `${API_BASE_URL}/admin/invitations/${encodeURIComponent(invitationId)}`,
    {
      method: 'DELETE',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as DeleteAdminInvitationResponse;
}

export interface VendorDashboardStats {
  ordersToday: number;
  topClients: number;
  newMessages: number;
  activePromos: number;
}

export async function getActivityLogs(
  filters?: ActivityLogFilters,
): Promise<PaginatedResponse<ActivityLogEntry>> {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.entityType) params.append('entityType', filters.entityType);
  if (filters?.action) params.append('action', filters.action);
  if (filters?.actorId) params.append('actorId', filters.actorId);
  if (filters?.actorRole) params.append('actorRole', filters.actorRole);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
  const queryString = params.toString() ? `?${params.toString()}` : '';

  const response = await fetch(
    `${API_BASE_URL}/admin/activity-log${queryString}`,
    {
      method: 'GET',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as PaginatedResponse<ActivityLogEntry>;
}

export async function getAdminDashboardStats(
  period?: string,
  date?: string,
): Promise<AdminDashboardStats> {
  const params = new URLSearchParams();
  if (period) params.append('period', period);
  if (date) params.append('date', date);
  const queryString = params.toString() ? `?${params.toString()}` : '';

  const response = await fetch(
    `${API_BASE_URL}/admin/dashboard-stats${queryString}`,
    {
      method: 'GET',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as AdminDashboardStats;
}

export async function getVendorDashboardStats(): Promise<VendorDashboardStats> {
  const response = await fetch(`${API_BASE_URL}/admin/vendor/dashboard-stats`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as VendorDashboardStats;
}

export async function getLoyaltyCustomers(
  search?: string,
): Promise<LoyaltyCustomer[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  const queryString = params.toString() ? `?${params.toString()}` : '';

  const response = await fetch(
    `${API_BASE_URL}/admin/loyalty/customers${queryString}`,
    {
      method: 'GET',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as LoyaltyCustomer[];
}

export async function adjustCustomerPoints(
  userId: string,
  points: number,
  description?: string,
): Promise<LoyaltyCustomer> {
  const response = await fetch(
    `${API_BASE_URL}/admin/loyalty/customers/${userId}/adjust-points`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ points, description }),
    },
  );

  if (!response.ok) {
    const error = await parseError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as LoyaltyCustomer;
}
