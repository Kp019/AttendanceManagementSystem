// Script to migrate existing users to Supabase Auth
// Run this after setting up your .env file with SUPABASE_SERVICE_ROLE_KEY
// node migrate_users_script.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function migrateUsers() {
  try {
    console.log('Starting user migration...');
    
    // Step 1: Get all existing users from the users table
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, name, email, role, created_at');
    
    if (fetchError) {
      console.error('Error fetching existing users:', fetchError);
      return;
    }
    
    console.log(`Found ${existingUsers.length} users to migrate`);
    
    // Step 2: Create auth users and user profiles
    const results = [];
    
    for (const user of existingUsers) {
      try {
        console.log(`Migrating user: ${user.name} (${user.email})`);
        
        // Generate a temporary password (user will need to reset)
        const tempPassword = crypto.randomBytes(12).toString('hex');
        
        // Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: tempPassword,
          user_metadata: {
            name: user.name,
            role: user.role
          },
          email_confirm: true, // Skip email confirmation
          id: user.id // Use the existing UUID
        });
        
        if (authError) {
          console.error(`Error creating auth user for ${user.email}:`, authError);
          results.push({ user: user.email, status: 'failed', error: authError.message });
          continue;
        }
        
        // Create user profile (this should happen automatically via trigger, but let's ensure it)
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            name: user.name,
            role: user.role,
            created_at: user.created_at,
            updated_at: new Date().toISOString()
          });
        
        if (profileError) {
          console.error(`Error creating profile for ${user.email}:`, profileError);
          results.push({ user: user.email, status: 'partial', error: profileError.message });
        } else {
          console.log(`✅ Successfully migrated: ${user.name}`);
          results.push({ user: user.email, status: 'success', tempPassword });
        }
        
      } catch (error) {
        console.error(`Unexpected error migrating ${user.email}:`, error);
        results.push({ user: user.email, status: 'failed', error: error.message });
      }
    }
    
    // Step 3: Summary
    console.log('\n=== Migration Summary ===');
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const partial = results.filter(r => r.status === 'partial').length;
    
    console.log(`✅ Successful: ${successful}`);
    console.log(`⚠️  Partial: ${partial}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (successful > 0) {
      console.log('\n=== Temporary Passwords (Users need to reset these) ===');
      results
        .filter(r => r.status === 'success')
        .forEach(r => {
          console.log(`${r.user}: ${r.tempPassword}`);
        });
    }
    
    if (failed > 0) {
      console.log('\n=== Failed Migrations ===');
      results
        .filter(r => r.status === 'failed')
        .forEach(r => {
          console.log(`${r.user}: ${r.error}`);
        });
    }
    
    // Step 4: Verify migration
    console.log('\n=== Verification ===');
    const { data: profiles, error: profileCheckError } = await supabase
      .from('users')
      .select('id, name, role');
    
    if (profileCheckError) {
      console.error('Error checking user profiles:', profileCheckError);
    } else {
      console.log(`User profiles created: ${profiles.length}`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateUsers().then(() => {
  console.log('\nMigration completed. Check the results above.');
  process.exit(0);
}).catch(error => {
  console.error('Migration script failed:', error);
  process.exit(1);
});
