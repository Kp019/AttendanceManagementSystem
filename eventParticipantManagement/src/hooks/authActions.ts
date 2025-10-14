/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import api from './http';

// Define the base API URL
const API_URL = 'http://localhost:3001/auth'; 

// Login async thunk
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/auth/login`, credentials);
      return response.data; // Assuming the API returns { user, token }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// Register async thunk
export const register = createAsyncThunk(
  'auth/register',
  async (userDetails: { name: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/auth/register`, userDetails);
      return response.data; // Assuming the API returns { user, token }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

// Load current user based on stored token
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_: void, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/profile');
      return response.data; // Expecting user object
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load user');
    }
  }
);