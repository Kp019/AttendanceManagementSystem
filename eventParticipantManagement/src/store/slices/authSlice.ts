/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { login, register, loadUser, logout } from '../../hooks/authActions';

interface User {
  id: string;
  email: string | undefined;
  name: string;
  role: 'participant' | 'admin';
}

interface AuthState {
  loading: boolean;
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
  error: string | null;
  authInitialized: boolean;
}

const initialState: AuthState = {
  loading: false,
  user: null,
  session: null,
  isAuthenticated: false,
  error: null,
  authInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logoutLocal(state) {
      state.user = null;
      state.session = null;
      state.isAuthenticated = false;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action: PayloadAction<{ user: User; session: any }>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isAuthenticated = true;
        state.authInitialized = true;
      })
      .addCase(loadUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
        state.authInitialized = true;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<{ user: User; session: any }>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        // Note: For Supabase auth, user won't be authenticated until email is verified
        // state.user = action.payload.user;
        // state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logoutLocal, clearError } = authSlice.actions;
export default authSlice.reducer;