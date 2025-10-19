# Supabase Auth Setup Guide

This guide will help you set up Supabase authentication for your Event Management Platform.

## Prerequisites

- A Supabase account and project
- Node.js and npm installed
- Your project running locally

## Step 1: Supabase Project Setup

### 1.1 Create/Configure Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or use an existing one
3. Note down your project URL and API keys from Settings → API

### 1.2 Configure Authentication Settings

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Configure the following settings:
   - **Enable email confirmations**: Toggle ON if you want email verification
   - **Site URL**: Set to `http://localhost:5173` for development
   - **Redirect URLs**: Add `http://localhost:5173/**` for development
   - **JWT expiry**: Set to 3600 (1 hour) or your preference

### 1.3 Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the templates for:
   - Confirm signup
   - Reset password
   - Invite user

## Step 2: Database Schema Setup

### 2.1 Run Migration Script

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `backend/migrate_to_supabase_auth.sql`
4. Execute the script

This will:
- Create a `users` table that references `auth.users`
- Set up proper RLS policies
- Create triggers for automatic profile creation
- Update foreign key relationships

### 2.2 Verify Schema

After running the migration, verify these tables exist:
- `users` (new)
- `events` (updated)
- `event_admins` (updated)
- `participants` (unchanged)
- `attendance_columns` (unchanged)
- `attendance` (unchanged)

## Step 3: Environment Variables

### 3.1 Backend Environment Variables

Create or update your `backend/.env` file:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Secret (keep your existing one)
JWT_SECRET=your_jwt_secret

# Other existing variables...
PORT=3001
NODE_ENV=development
```

### 3.2 Frontend Environment Variables

Create a `.env.local` file in your `eventParticipantManagement` directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API URL
VITE_API_URL=http://localhost:3001
```

**Important**: Replace `your_supabase_project_url` and `your_supabase_anon_key` with your actual Supabase project values.

## Step 4: Update Backend Server

### 4.1 Switch to New Server File

Replace your current `backend/server.js` with `backend/server_supabase_auth.js`:

```bash
cd backend
mv server.js server_old.js
mv server_supabase_auth.js server.js
```

### 4.2 Install Dependencies

Make sure you have all required dependencies:

```bash
cd backend
npm install @supabase/supabase-js
```

## Step 5: Frontend Setup

### 5.1 Install Dependencies

The Supabase client should already be installed. If not:

```bash
cd eventParticipantManagement
npm install @supabase/supabase-js
```

### 5.2 Update Package.json Scripts

Your existing scripts should work fine. The new auth system is backward compatible with your existing Redux setup.

## Step 6: Testing the Setup

### 6.1 Start the Backend

```bash
cd backend
npm run dev
```

### 6.2 Start the Frontend

```bash
cd eventParticipantManagement
npm run dev
```

### 6.3 Test Authentication

1. Go to `http://localhost:5173`
2. Try to register a new user
3. Check your email for verification (if enabled)
4. Try to log in
5. Verify that the user can access protected routes

## Step 7: Create Your First Admin User

### 7.1 Manual Admin Creation

Since you need an admin user to create events, you can create one manually:

1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add user**
4. Fill in the details and set a password
5. Go to **Table Editor** → **users**
6. Find the user and change their role to `admin`

### 7.2 Alternative: Database Query

You can also update a user's role directly:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## Step 8: Key Differences from Previous Setup

### 8.1 Authentication Flow

- **Before**: Custom JWT tokens stored in localStorage
- **Now**: Supabase sessions with automatic refresh
- **Benefits**: Better security, automatic token refresh, built-in auth features

### 8.2 User Management

- **Before**: Custom users table with password hashing
- **Now**: Supabase auth.users + users table
- **Benefits**: Built-in email verification, password reset, social logins

### 8.3 API Calls

- **Before**: Authorization header with custom JWT
- **Now**: Authorization header with Supabase access token
- **Benefits**: Automatic token validation, better error handling

## Step 9: Optional Enhancements

### 9.1 Social Authentication

To enable Google/GitHub login:

1. Go to **Authentication** → **Providers** in Supabase
2. Enable desired providers
3. Configure OAuth settings
4. Update frontend to use social login methods

### 9.2 Email Verification

If you enabled email verification:

1. Users must verify their email before they can log in
2. Customize email templates in Supabase dashboard
3. Handle verification status in your frontend

### 9.3 Password Reset

Password reset is automatically handled by Supabase:

1. Users can request password reset
2. They'll receive an email with reset link
3. Create a password reset page in your frontend

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check your `.env` files
   - Ensure variable names start with `VITE_` for frontend
   - Restart your development servers

2. **"Invalid token" errors**
   - Check if your Supabase URL and keys are correct
   - Ensure the user is authenticated
   - Check browser network tab for 401 errors

3. **"User profile not found"**
   - Run the migration script completely
   - Check if the trigger is created properly
   - Manually create a user profile if needed

4. **RLS policy errors**
   - Verify RLS policies are set up correctly
   - Check if user has proper role assignment
   - Test with service role key for admin operations

### Getting Help

- Check Supabase documentation: https://supabase.com/docs
- Review the migration script for any errors
- Check browser console and network tabs for detailed error messages

## Migration Checklist

- [ ] Supabase project created and configured
- [ ] Database migration script executed
- [ ] Environment variables set up
- [ ] Backend server updated
- [ ] Frontend dependencies installed
- [ ] First admin user created
- [ ] Authentication flow tested
- [ ] Protected routes working
- [ ] User registration/login working

## Next Steps

After completing this setup:

1. Test all authentication flows
2. Update your frontend components to use the new auth system
3. Consider adding social authentication
4. Set up email templates for better UX
5. Configure production environment variables
6. Set up proper CORS and security headers for production
