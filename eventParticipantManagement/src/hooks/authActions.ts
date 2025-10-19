/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../lib/supabase';
import api from './http';
// import { AuthError } from '@supabase/supabase-js';

// Login async thunk
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return rejectWithValue(error.message);
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: profile?.name || data.user.user_metadata?.name,
          role: profile?.role || 'participant',
        },
        session: data.session,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

// Register async thunk
export const register = createAsyncThunk(
  'auth/register',
  async (userDetails: { name: string; email: string; password: string; role?: string }, { rejectWithValue }) => {
    try {
      console.log(userDetails, "userDetails");
      // const { data, error } = await supabase.auth.signUp({
      //   email: userDetails.email,
      //   password: userDetails.password,
      //   options: {
      //     data: {
      //       name: userDetails.name,
      //       role: userDetails.role || 'participant',
      //     },
      //   },
      // });

      // if (error) {
      //   return rejectWithValue(error.message);
      // }

      const data = await api.post('/auth/register', userDetails);
      console.log(data, "data");
      const user = data?.data?.user;
      // The users table will be automatically populated by the trigger
      // when a new user is created in auth.users
      return {
        user: user,
        message: 'Registration successful. Please check your email for verification.',
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

// Load current user based on stored token
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_: void, { rejectWithValue }) => {
    try {
      console.log("loadUser");
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log(session, "session");
      if (error || !session) {
        return rejectWithValue('No active session');
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: profile?.name || session.user.user_metadata?.name,
          role: profile?.role || 'participant',
        },
        session,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load user');
    }
  }
);

// Logout async thunk
export const logout = createAsyncThunk(
  'auth/logout',
  async (_: void, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return rejectWithValue(error.message);
      }
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);