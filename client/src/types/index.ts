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
  RequestRegisterOtpPayload,
  RequestRegisterOtpResponse,
} from './auth';
