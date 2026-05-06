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
