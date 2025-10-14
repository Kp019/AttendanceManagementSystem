# 🎫 Event Participant Management System

A modern QR Code-based Event Management System built with **React + Redux + TypeScript** frontend and **Node.js + Express + Supabase** backend.

## ✨ Features

### 🔐 **Authentication System**
- User registration with role assignment (Admin/Participant)
- JWT-based authentication
- Role-based access control

### 📅 **Event Management**
- Create and manage events with images
- Co-admin assignment functionality
- Role-based event visibility

### 👥 **Participant Management**
- CSV bulk import with automatic QR code generation
- Individual participant CRUD operations
- Participant contact information management
- QR code generation for each participant

### ✅ **Attendance Tracking**
- Dynamic attendance columns (meals, sessions, activities)
- QR code scanning for attendance marking
- Real-time attendance status updates
- Bulk QR code download (ZIP format)

### 📱 **Modern UI/UX**
- Responsive design with Tailwind CSS
- Real-time loading states and error handling
- Intuitive navigation and user interface

---

## 🏗 Tech Stack

### **Frontend**
- **React 19** with TypeScript
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Vite** for development and building

### **Backend**
- **Node.js** with Express.js
- **Supabase** for database and authentication
- **JWT** for token-based authentication
- **Multer** for file uploads
- **QRCode** library for QR generation
- **Archiver** for ZIP file creation

### **Database**
- **Supabase (PostgreSQL)**

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- NPM or Yarn
- Supabase account

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd event-participat
```

### 2. Backend Setup
```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials
```

**Required Environment Variables:**
```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
JWT_SECRET=your-super-secret-jwt-key-here
PORT=3001
NODE_ENV=development
```

### 3. Frontend Setup
```bash
cd ../eventParticipantManagement
npm install
```

### 4. Database Schema
Create these tables in your Supabase database:

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  role VARCHAR CHECK (role IN ('admin', 'participant')) DEFAULT 'participant',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Events table
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  image_url VARCHAR,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Event admins table
CREATE TABLE event_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(event_id, user_id)
);

-- Participants table
CREATE TABLE participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  phone VARCHAR,
  qr_code VARCHAR UNIQUE NOT NULL,
  qr_code_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Attendance columns table
CREATE TABLE attendance_columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  column_name VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Attendance table
CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  attendance_column_id UUID REFERENCES attendance_columns(id) ON DELETE CASCADE,
  status BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(participant_id, attendance_column_id)
);
```

### 5. Run the Application

**Option A: Using the startup script (Recommended)**
```bash
./start-dev.sh
```

**Option B: Manual startup**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd eventParticipantManagement
npm run dev
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001

---

## 📱 Usage Guide

### 1. **Registration & Login**
- Visit http://localhost:5173
- Register as Admin or Participant
- Login with your credentials

### 2. **Create Events (Admin)**
- Navigate to Events page
- Click "Create Event"
- Fill in event details and submit

### 3. **Manage Participants**
- Open an event detail page
- Upload CSV file or add participants individually
- Download QR codes for distribution

### 4. **Track Attendance**
- Add attendance columns (e.g., "Day 1 Lunch")
- Click on attendance column to open QR scanner
- Scan participant QR codes to mark attendance

### 5. **CSV Upload Format**
```csv
name,email,phone
Alice Johnson,alice@example.com,+1234567890
Bob Smith,bob@example.com,+1987654321
```

---

## 🔧 API Endpoints

### **Authentication**
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login

### **Events**
- `GET /events` - List user events
- `POST /events` - Create event
- `GET /events/:id` - Get event details
- `POST /events/:id/admins` - Add co-admin

### **Participants**
- `GET /events/:id/participants` - List participants
- `POST /events/:id/participants` - Add participant
- `POST /events/:id/participants/upload` - Upload CSV
- `PUT /participants/:id` - Update participant
- `DELETE /participants/:id` - Delete participant
- `GET /events/:id/qrcodes/zip` - Download QR codes

### **Attendance**
- `GET /events/:id/attendance-columns` - List columns
- `POST /events/:id/attendance-columns` - Add column
- `POST /attendance/mark` - Mark attendance

---

## 🔨 Development

### **Project Structure**
```
event-participat/
├── backend/                 # Node.js backend
│   ├── server.js           # Main server file
│   ├── uploads/            # File uploads directory
│   └── package.json
├── eventParticipantManagement/  # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store & slices
│   │   └── App.tsx
│   └── package.json
└── README.md
```

### **Redux Store Structure**
- `authSlice` - Authentication state
- `eventsSlice` - Events management
- `participantsSlice` - Participants CRUD
- `attendanceSlice` - Attendance tracking

---

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing  
```bash
cd eventParticipantManagement
npm run test
```

---

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Deploy to your preferred platform (Vercel, Heroku, AWS, etc.)
3. Ensure Supabase is configured for production

### Frontend Deployment
1. Build the frontend:
   ```bash
   npm run build
   ```
2. Deploy the `dist` folder to your hosting service
3. Update API endpoints for production

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🆘 Troubleshooting

### Common Issues

**Frontend can't connect to backend:**
- Ensure backend is running on port 3001
- Check Vite proxy configuration
- Verify API endpoint URLs

**Database connection issues:**
- Verify Supabase credentials in .env
- Check database table creation
- Ensure RLS policies are configured

**QR Code generation fails:**
- Check file permissions in uploads directory
- Verify QRCode library installation

---

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**🎉 Happy Event Managing!**