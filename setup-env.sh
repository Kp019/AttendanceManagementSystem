#!/bin/bash

echo "🚀 Setting up Supabase Auth Environment Variables"
echo "================================================"

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "eventParticipantManagement" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo ""
echo "📝 You need to get your Supabase credentials first:"
echo "1. Go to https://app.supabase.com"
echo "2. Select your project (or create a new one)"
echo "3. Go to Settings → API"
echo "4. Copy the Project URL, anon public key, and service_role key"
echo ""

# Create backend .env file
echo "📁 Creating backend/.env file..."
cat > backend/.env << 'EOF'
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# JWT Secret (generate a secure random string)
JWT_SECRET=your_jwt_secret_here

# Server Configuration
PORT=3001
NODE_ENV=development
EOF

# Create frontend .env.local file
echo "📁 Creating eventParticipantManagement/.env.local file..."
cat > eventParticipantManagement/.env.local << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Backend API URL
VITE_API_URL=http://localhost:3001
EOF

echo ""
echo "✅ Environment files created!"
echo ""
echo "📋 Next steps:"
echo "1. Edit backend/.env and replace the placeholder values with your actual Supabase credentials"
echo "2. Edit eventParticipantManagement/.env.local and replace the placeholder values"
echo "3. Generate a secure JWT secret (you can use: openssl rand -base64 32)"
echo ""
echo "🔧 To edit the files:"
echo "   - Backend: nano backend/.env"
echo "   - Frontend: nano eventParticipantManagement/.env.local"
echo ""
echo "📖 For detailed instructions, see SUPABASE_AUTH_SETUP.md"
