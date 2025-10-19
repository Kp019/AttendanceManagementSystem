// Environment configuration
export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://jkpzyvzeyakewcbseaub.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcHp5dnpleWFrZXdjYnNlYXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5ODM0NzgsImV4cCI6MjA3NDU1OTQ3OH0.vNYlndPXU_d7VQtiX0MJlgKuxS6nLjSLrxrwOtzuZ2w',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
};

// Validate required environment variables
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}
