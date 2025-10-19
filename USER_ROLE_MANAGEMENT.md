# User Role Management System

This document explains how the role-based user management system works in the Event Management application.

## Overview

The system uses Supabase Auth for authentication and a custom `users` table to store additional user information including roles.

## Database Structure

### Tables

1. **auth.users** (Supabase managed)
   - Stores authentication data (email, password hash, etc.)
   - Managed by Supabase Auth

2. **users** (Custom table)
   - `id` (UUID, references auth.users.id)
   - `name` (VARCHAR)
   - `role` (VARCHAR, 'participant' or 'admin')
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

### Triggers

- **handle_new_user()**: Automatically creates a user profile when a new user signs up
- **update_users_updated_at**: Updates the updated_at timestamp on profile changes

## User Roles

### Participant
- Default role for new users
- Can view events they're registered for
- Can manage their own profile
- Cannot create events or manage other users

### Admin
- Can create and manage events
- Can view and manage all users
- Can change user roles
- Can delete users (except themselves)
- Full access to the system

## Registration Process

1. User fills out registration form with:
   - Name
   - Email
   - Password
   - Role selection (participant/admin)

2. Supabase Auth creates the user account

3. The `handle_new_user()` trigger automatically:
   - Creates a record in `users` table
   - Sets the role from the metadata
   - Links the profile to the auth user

## User Management Features

### Admin-Only Features
- View all users in the system
- Change user roles (participant ↔ admin)
- Delete users (with confirmation)
- Access to Users Management page

### User Management Page
- Located at `/users` route
- Only accessible to admin users
- Shows user list with:
  - Name and email
  - Current role
  - Registration date
  - Action buttons (edit role, delete)

## API Endpoints

### GET /users
- **Access**: Admin only
- **Returns**: List of all users with their profiles
- **Response**: Array of user objects with id, name, email, role, timestamps

### PUT /users/:id/role
- **Access**: Admin only
- **Body**: `{ "role": "participant" | "admin" }`
- **Returns**: Updated user object

### DELETE /users/:id
- **Access**: Admin only
- **Prevents**: Admin from deleting themselves
- **Returns**: Success message

## Security

- Row Level Security (RLS) enabled on users table
- Users can only view/update their own profile
- Admin operations require admin role verification
- JWT token validation for all protected endpoints

## Navigation

- Users link appears in navigation only for admin users
- Available on Home page and Events page
- Redirects non-admin users away from user management

## Usage

1. **Register as Admin**: Select "Event Admin" role during registration
2. **Access User Management**: Click "Users" in navigation (admin only)
3. **Manage Users**: Edit roles, delete users as needed
4. **Role Changes**: Take effect immediately, no restart required

## Troubleshooting

- If user profile isn't created: Check if the trigger is properly set up
- If role changes don't work: Verify admin permissions
- If users can't access management: Check their role in the database
