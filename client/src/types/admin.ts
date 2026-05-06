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
