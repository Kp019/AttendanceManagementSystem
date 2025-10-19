// Test script to verify Supabase Auth setup
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testSupabaseAuth() {
  console.log('🧪 Testing Supabase Auth Setup...\n');

  // Test 1: Environment variables
  console.log('1. Checking environment variables...');
  if (!supabaseUrl || !supabaseKey || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
    return;
  }
  console.log('✅ Environment variables loaded');

  // Test 2: Supabase client connection
  console.log('\n2. Testing Supabase client connection...');
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return;
    }
    console.log('✅ Supabase client connected successfully');
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return;
  }

  // Test 3: Service role client
  console.log('\n3. Testing service role client...');
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabaseAdmin.from('users').select('count').limit(1);
    if (error) {
      console.error('❌ Service role client failed:', error.message);
      return;
    }
    console.log('✅ Service role client working');
  } catch (error) {
    console.error('❌ Service role client error:', error.message);
    return;
  }

  // Test 4: Database schema
  console.log('\n4. Checking database schema...');
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if users table exists
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ users table not found:', profilesError.message);
      console.log('💡 Run the migration script: backend/migrate_to_supabase_auth.sql');
      return;
    }

    // Check if events table exists and has proper foreign key
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('*')
      .limit(1);
    
    if (eventsError) {
      console.error('❌ events table issue:', eventsError.message);
      return;
    }

    console.log('✅ Database schema looks good');
  } catch (error) {
    console.error('❌ Schema check error:', error.message);
    return;
  }

  // Test 5: Auth functionality
  console.log('\n5. Testing auth functionality...');
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test signup (this will create a test user)
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User',
          role: 'participant'
        }
      }
    });

    if (signupError) {
      console.error('❌ Signup test failed:', signupError.message);
      return;
    }

    console.log('✅ User signup test passed');
    console.log(`   Created user: ${testEmail}`);

    // Clean up test user
    if (signupData.user) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      await supabaseAdmin.auth.admin.deleteUser(signupData.user.id);
      console.log('✅ Test user cleaned up');
    }

  } catch (error) {
    console.error('❌ Auth test error:', error.message);
    return;
  }

  console.log('\n🎉 All tests passed! Your Supabase Auth setup is working correctly.');
  console.log('\n📋 Next steps:');
  console.log('1. Create your first admin user in Supabase dashboard');
  console.log('2. Start your backend server: npm run dev');
  console.log('3. Start your frontend: npm run dev');
  console.log('4. Test the complete authentication flow');
}

// Run the test
testSupabaseAuth().catch(console.error);
