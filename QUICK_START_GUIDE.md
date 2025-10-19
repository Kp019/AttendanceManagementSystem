# 🚀 Quick Start Guide - Supabase Auth Setup

## Prerequisites
- Supabase account (free at https://app.supabase.com)
- Node.js installed
- Terminal/Command prompt access

## Step 1: Create Supabase Project

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Create New Project**:
   - Click "New Project"
   - Choose your organization
   - Project name: `Event Management Platform`
   - Database password: Generate a strong password (save it!)
   - Region: Choose closest to your location
   - Click "Create new project"
   - Wait 2-3 minutes for setup to complete

## Step 2: Get API Credentials

1. **In your Supabase project dashboard**:
   - Go to **Settings** → **API**
   - Copy these three values:

```
Project URL: https://your-project-id.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Important**: Keep the service_role key secret - never commit it to version control!

## Step 3: Create Environment Files

### Backend Environment File

Create `backend/.env` with this content:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_secure_random_string_here

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Frontend Environment File

Create `eventParticipantManagement/.env.local` with this content:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend API URL
VITE_API_URL=http://localhost:3001
```

## Step 4: Generate JWT Secret

Run this command to generate a secure JWT secret:

```bash
openssl rand -base64 32
```

Copy the output and paste it as the `JWT_SECRET` value in your backend `.env` file.

## Step 5: Set Up Database Schema

1. **In your Supabase dashboard**:
   - Go to **SQL Editor**
   - Click "New Query"
   - Copy the entire content from `backend/migrate_to_supabase_auth.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the migration

This will create:
- `users` table
- Updated foreign key relationships
- Row Level Security policies
- Automatic user profile creation triggers

## Step 6: Test the Setup

### Test Backend Connection

```bash
cd backend
node test_supabase_auth.js
```

You should see:
```
🧪 Testing Supabase Auth Setup...
✅ Environment variables loaded
✅ Supabase client connected successfully
✅ Service role client working
✅ Database schema looks good
✅ User signup test passed
🎉 All tests passed!
```

### Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd eventParticipantManagement
npm run dev
```

## Step 7: Create Your First Admin User

Since you need an admin to create events, create one manually:

### Option A: Via Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Fill in:
   - Email: `admin@yourapp.com`
   - Password: Choose a strong password
4. Click **Add user**
5. Go to **Table Editor** → **users**
6. Find your user and change `role` to `admin`

### Option B: Via SQL Query

In **SQL Editor**, run:

```sql
-- First, get the user ID from auth.users
SELECT id, email FROM auth.users WHERE email = 'admin@yourapp.com';

-- Then update their role (replace 'user-id-here' with actual ID)
UPDATE users 
SET role = 'admin' 
WHERE id = 'user-id-here';
```

## Step 8: Test the Application

1. **Open your browser**: http://localhost:5173
2. **Register a new user** (will be participant by default)
3. **Login with your admin user**
4. **Create an event** (should work if you're admin)
5. **Test participant features**

## Troubleshooting

### Common Issues:

**"Missing Supabase environment variables"**
- Check your `.env` files exist
- Verify variable names are correct
- Restart your servers after changes

**"Invalid token" errors**
- Check Supabase URL and keys are correct
- Ensure user is logged in
- Check browser network tab for 401 errors

**"User profile not found"**
- Run the database migration script
- Check if triggers are created properly
- Manually create user profile if needed

**"Permission denied" errors**
- Check RLS policies are set up
- Verify user has proper role
- Test with service role for admin operations

### Getting Help:

1. Check browser console for errors
2. Check backend terminal for error messages
3. Verify environment variables are loaded
4. Test Supabase connection with the test script

## Next Steps

Once everything is working:

1. **Customize email templates** in Supabase dashboard
2. **Add social authentication** (Google, GitHub)
3. **Configure production environment**
4. **Set up proper CORS and security headers**
5. **Add password reset functionality**

## Quick Commands Reference

```bash
# Generate JWT secret
openssl rand -base64 32

# Test Supabase connection
cd backend && node test_supabase_auth.js

# Start backend
cd backend && npm run dev

# Start frontend
cd eventParticipantManagement && npm run dev

# Check environment variables
echo $SUPABASE_URL
```

---

🎉 **You're all set!** Your Event Management Platform now has secure Supabase authentication with proper user roles and permissions.
