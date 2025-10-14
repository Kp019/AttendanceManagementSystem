/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { login, register, loadUser } from '../../hooks/authActions';

interface AuthState {
  loading: boolean;
  user: any | null; // Replace `any` with the actual user type
  isAuthenticated: boolean;
  error: string | null;
  authInitialized: boolean;
}

const initialState: AuthState = {
  loading: false,
  user: null,
  isAuthenticated: false,
  error: null,
  authInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token');
      }
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
      .addCase(loadUser.fulfilled, (state, action: PayloadAction<{ user: any }>) => {
        state.loading = false;
        state.user = action.payload.user ?? action.payload ?? null;
        state.isAuthenticated = !!state.user;
        state.authInitialized = true;
      })
      .addCase(loadUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.authInitialized = true;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<{ user: any; token?: string }>) => {
        state.loading = false;
        state.user = action.payload.user ?? null;
        state.isAuthenticated = true;
        if (typeof localStorage !== 'undefined' && action.payload.token !== undefined) {
          localStorage.setItem('token', action.payload.token);
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message ?? 'An error occurred';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<{ user: any; token?: string }>) => {
        state.loading = false;
        state.user = action.payload.user ?? null;
        state.isAuthenticated = true;
        if (typeof localStorage !== 'undefined' && action.payload.token != null) {
          localStorage.setItem('token', action.payload.token);
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message ?? 'An error occurred';
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;