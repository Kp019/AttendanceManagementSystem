import { useAppSelector, useAppDispatch } from "../hooks/redux"; // Ensure correct path for redux hooks
import { login, register } from "../hooks/authActions"; // Import async thunks from authActions
import { logout } from "../store/slices/authSlice"; // Import sync action from authSlice
// import {
//   LoginCredentials,
//   RegisterUserData,
//   AuthState,
// } from "../types/authTypes"; // Ensure these types are defined correctly

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterUserData {
  name: string;
  email: string;
  password: string;
}

interface User {
  id?: string;
  name: string;
  email: string;
}

interface AuthState {
  loading: boolean;
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
}

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state: { auth: AuthState }) => state.auth);

  const handleLogin = async (credentials: LoginCredentials): Promise<void> => {
    try {
      await dispatch(login(credentials)).unwrap(); // Unwrap to handle errors properly
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      console.error("Login failed:", errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleRegister = async (userData: RegisterUserData): Promise<void> => {
    try {
      await dispatch(register(userData)).unwrap(); // Unwrap to handle errors properly
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      console.error("Registration failed:", errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleLogout = (): void => {
    dispatch(logout());
  };

  return {
    ...auth,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };
};
