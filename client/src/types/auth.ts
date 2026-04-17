export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
}
