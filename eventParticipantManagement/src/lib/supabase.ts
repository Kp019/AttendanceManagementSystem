import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';


export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          role: 'participant' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          role?: 'participant' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          role?: 'participant' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          uuid: string;
          name: string;
          description: string | null;
          image_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          uuid: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          uuid?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      participants: {
        Row: {
          id: number;
          event_id: string;
          name: string;
          email: string;
          phone: string | null;
          qr_code: string;
          qr_code_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          event_id: string;
          name: string;
          email: string;
          phone?: string | null;
          qr_code: string;
          qr_code_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          event_id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          qr_code?: string;
          qr_code_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      attendance_columns: {
        Row: {
          id: number;
          event_uuid: string;
          column_name: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          event_uuid: string;
          column_name: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          event_uuid?: string;
          column_name?: string;
          created_at?: string;
        };
      };
      attendance: {
        Row: {
          id: number;
          participant_id: number;
          attendance_column_id: number;
          status: boolean;
          marked_at: string;
        };
        Insert: {
          id?: number;
          participant_id: number;
          attendance_column_id: number;
          status?: boolean;
          marked_at?: string;
        };
        Update: {
          id?: number;
          participant_id?: number;
          attendance_column_id?: number;
          status?: boolean;
          marked_at?: string;
        };
      };
    };
  };
};
