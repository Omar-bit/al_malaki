export interface Product {
  id: string;
  name: string;
  image: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export type {
  AuthCredentials,
  AuthResponse,
  AuthUser,
  RegisterPayload,
  RegisterResponse,
  RequestRegisterOtpPayload,
  RequestRegisterOtpResponse,
  VerifyRegisterOtpPayload,
} from './auth';

export type {
  AcceptAdminInvitationPayload,
  AcceptAdminInvitationResponse,
  AdminTeamMember,
  CreateAdminInvitationPayload,
  CreateAdminInvitationResponse,
  TeamRole,
} from './admin';
