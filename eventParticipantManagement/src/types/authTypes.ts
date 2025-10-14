export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
}

export interface AuthState {
  user: { id: string; name: string; email: string } | null;
  token: string | null;
  isAuthenticated: boolean;
}
