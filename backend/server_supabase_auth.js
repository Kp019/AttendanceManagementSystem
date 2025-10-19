// server.js - Updated for Supabase Auth
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const QRCode = require('qrcode');
const { createClient } = require('@supabase/supabase-js');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('Missing Supabase service role key');
  process.exit(1);
}

// Regular client for authenticated operations
const supabase = createClient(supabaseUrl, supabaseKey);

// Service role client for admin operations (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads/qrcodes')) {
  fs.mkdirSync('uploads/qrcodes', { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Middleware to verify Supabase JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Get user profile with role information
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || 'participant'
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Helper function to generate QR code
const generateQRCode = async (data, filename) => {
  try {
    const qrPath = `uploads/qrcodes/${filename}.png`;
    await QRCode.toFile(qrPath, data);
    return `/uploads/qrcodes/${filename}.png`;
  } catch (error) {
    console.error('QR Code generation error:', error);
    return null;
  }
};

// =================== AUTH ENDPOINTS ===================

// Register user (creates profile after Supabase auth signup)
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name, role = 'participant' } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Sign up user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role
        }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // The user profile will be created automatically by the trigger
    // Return success response
    res.status(201).json({
      message: 'User registered successfully. Please check your email for verification.',
      user: data.user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Get user profile with role
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      message: 'Login successful',
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.user_metadata?.name,
        role: profile?.role || 'participant'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout user
app.post('/auth/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh session
app.post('/auth/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      session: data.session,
      user: data.user
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =================== EVENT ENDPOINTS ===================

// Create event
app.post('/events', authenticateToken, async (req, res) => {
  try {
    const { name, description, image_url } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Event name is required' });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create events' });
    }

    const uuid = uuidv4();

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .insert({
        uuid, 
        name,
        description,
        image_url,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Event creation error:', error);
      return res.status(400).json({ error: 'Failed to create event' });
    }

    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    console.error('Event creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all events
app.get('/events', authenticateToken, async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('events')
      .select(`
        *,
        participants(count)
      `);

    if (req.user.role === 'admin') {
      // Admin sees their own events + events they co-admin
      const { data: adminEvents } = await supabaseAdmin
        .from('event_admins')
        .select('event_id')
        .eq('user_id', req.user.id);

      const adminEventIds = adminEvents?.map(ea => ea.event_id) || [];
      
      if (adminEventIds.length > 0) {
        query = query.or(`created_by.eq.${req.user.id},id.in.(${adminEventIds.join(',')})`);
      } else {
        query = query.eq('created_by', req.user.id);
      }
    } else {
      // Participant sees events they're registered in
      const { data: participantEvents } = await supabaseAdmin
        .from('participants')
        .select('event_id')
        .eq('email', req.user.email);

      const participantEventIds = participantEvents?.map(p => p.event_id) || [];
      
      if (participantEventIds.length > 0) {
        query = query.in('id', participantEventIds);
      } else {
        // Return empty array if no events
        return res.json([]);
      }
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Events fetch error:', error);
      return res.status(400).json({ error: 'Failed to fetch events' });
    }

    res.json(events || []);
  } catch (error) {
    console.error('Events fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get event details
app.get('/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('uuid', id)
      .single();

    if (error || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user has access to this event
    const hasAccess = req.user.role === 'admin' && (
      event.created_by === req.user.id ||
      await supabaseAdmin
        .from('event_admins')
        .select('id')
        .eq('event_id', id)
        .eq('user_id', req.user.id)
        .single()
        .then(({ data }) => !!data)
    ) || (
      req.user.role === 'participant' &&
      await supabaseAdmin
        .from('participants')
        .select('id')
        .eq('event_id', id)
        .eq('email', req.user.email)
        .single()
        .then(({ data }) => !!data)
    );

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(event);
  } catch (error) {
    console.error('Event detail fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add co-admin to event
app.post('/events/:id/admins', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if current user is event owner
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!event || event.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Only event owner can add admins' });
    }

    // Check if user exists and is an admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', user_id)
      .single();

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(400).json({ error: 'User must be an admin' });
    }

    const { data, error } = await supabaseAdmin
      .from('event_admins')
      .insert({
        event_id: id,
        user_id: user_id
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'User is already an admin for this event' });
      }
      console.error('Add admin error:', error);
      return res.status(400).json({ error: 'Failed to add admin' });
    }

    res.status(201).json({ message: 'Admin added successfully', data });
  } catch (error) {
    console.error('Add admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =================== PARTICIPANT ENDPOINTS ===================

// Upload CSV and create participants
app.post('/events/:id/participants/upload', authenticateToken, upload.single('csvFile'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    // Check if user has admin access to this event
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('created_by')
      .eq('uuid', id)
      .single();

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const hasAdminAccess = event.created_by === req.user.id || 
      await supabaseAdmin
        .from('event_admins')
        .select('id')
        .eq('event_id', id)
        .eq('user_id', req.user.id)
        .single()
        .then(({ data }) => !!data);

    if (!hasAdminAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const participants = [];

    // Parse CSV file
    const stream = fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        if (row.name && row.email) {
          participants.push({
            event_id: id,
            name: row.name.trim(),
            email: row.email.trim().toLowerCase(),
            phone: row.phone?.trim() || null,
            qr_code: uuidv4()
          });
        }
      })
      .on('end', async () => {
        try {
          if (participants.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'No valid participants found in CSV' });
          }

          console.log(participants, 'participant');

          // Insert participants into database
          const { data, error } = await supabaseAdmin
            .from('participants')
            .insert(participants)
            .select();

          if (error) {
            console.error('Participant insertion error:', error);
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Failed to add participants' });
          }

          // Generate QR codes for each participant
          const qrPromises = data.map(async (participant) => {
            const qrData = JSON.stringify({
              participant_id: participant.id,
              event_id: participant.event_id,
              qr_code: participant.qr_code
            });
            
            const qrPath = await generateQRCode(qrData, `participant_${participant.id}`);
            
            if (qrPath) {
              await supabaseAdmin
                .from('participants')
                .update({ qr_code_url: qrPath })
                .eq('id', participant.id);
            }
            
            return { ...participant, qr_code_url: qrPath };
          });

          const updatedParticipants = await Promise.all(qrPromises);

          // Clean up uploaded CSV file
          fs.unlinkSync(req.file.path);

          res.status(201).json({
            message: `${data.length} participants added successfully`,
            participants: updatedParticipants
          });
        } catch (error) {
          console.error('CSV processing error:', error);
          fs.unlinkSync(req.file.path);
          res.status(500).json({ error: 'Failed to process CSV' });
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        fs.unlinkSync(req.file.path);
        res.status(400).json({ error: 'Invalid CSV file' });
      });

  } catch (error) {
    console.error('CSV upload error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get participants for an event
app.get('/events/:id/participants', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: participants, error } = await supabaseAdmin
      .from('participants')
      .select(`
        *,
        attendance(
          id,
          attendance_column_id,
          status,
          marked_at,
          attendance_columns(id, column_name)
        )
      `)
      .eq('event_id', id)
      .order('name');

    if (error) {
      console.error('Participants fetch error:', error);
      return res.status(400).json({ error: 'Failed to fetch participants' });
    }

    res.json(participants || []);
  } catch (error) {
    console.error('Participants fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add single participant
app.post('/events/:id/participants', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const participantData = {
      event_id: id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      qr_code: uuidv4()
    };

    const { data: participant, error } = await supabaseAdmin
      .from('participants')
      .insert(participantData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'Participant with this email already exists for this event' });
      }
      console.error('Participant creation error:', error);
      return res.status(400).json({ error: 'Failed to add participant' });
    }

    // Generate QR code
    const qrData = JSON.stringify({
      participant_id: participant.id,
      event_id: participant.event_id,
      qr_code: participant.qr_code
    });
    
    const qrPath = await generateQRCode(qrData, `participant_${participant.id}`);
    
    // Update participant with QR code URL
    const { data: updatedParticipant } = await supabaseAdmin
      .from('participants')
      .update({ qr_code_url: qrPath })
      .eq('id', participant.id)
      .select()
      .single();

    res.status(201).json({
      message: 'Participant added successfully',
      participant: updatedParticipant
    });
  } catch (error) {
    console.error('Participant creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update participant
app.put('/participants/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;

    const { data: participant, error } = await supabaseAdmin
      .from('participants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Email already exists for this event' });
      }
      console.error('Participant update error:', error);
      return res.status(400).json({ error: 'Failed to update participant' });
    }

    res.json({ message: 'Participant updated successfully', participant });
  } catch (error) {
    console.error('Participant update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete participant
app.delete('/participants/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('participants')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Participant deletion error:', error);
      return res.status(400).json({ error: 'Failed to delete participant' });
    }

    res.json({ message: 'Participant deleted successfully' });
  } catch (error) {
    console.error('Participant deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get participant QR code
app.get('/participants/:id/qrcode', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: participant, error } = await supabaseAdmin
      .from('participants')
      .select('qr_code_url')
      .eq('id', id)
      .single();

    if (error || !participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    res.json({ qr_code_url: participant.qr_code_url });
  } catch (error) {
    console.error('QR code fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk download QR codes
app.get('/events/:id/qrcodes/zip', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: participants, error } = await supabaseAdmin
      .from('participants')
      .select('id, name, qr_code_url')
      .eq('event_id', id);

    if (error) {
      console.error('Participants fetch error:', error);
      return res.status(400).json({ error: 'Failed to fetch participants' });
    }

    if (!participants || participants.length === 0) {
      return res.status(404).json({ error: 'No participants found' });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.attachment(`event_${id}_qrcodes.zip`);
    res.setHeader('Content-Type', 'application/zip');
    
    archive.pipe(res);

    participants.forEach(participant => {
      if (participant.qr_code_url && fs.existsSync(participant.qr_code_url.substring(1))) {
        const fileName = `${participant.name.replace(/[^a-zA-Z0-9]/g, '_')}_qrcode.png`;
        archive.file(participant.qr_code_url.substring(1), { name: fileName });
      }
    });

    archive.finalize();
  } catch (error) {
    console.error('QR codes zip error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =================== ATTENDANCE ENDPOINTS ===================

// Add attendance column
app.post('/events/:id/attendance-columns', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { column_name } = req.body;

    if (!column_name) {
      return res.status(400).json({ error: 'Column name is required' });
    }

    console.log(column_name, 'qwerty')

    const { data: column, error } = await supabaseAdmin
      .from('attendance_columns')
      .insert({
        event_uuid: id,
        column_name: column_name.trim()
      })
      .select();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Attendance column already exists' });
      }
      console.error('Attendance column creation error:', error);
      return res.status(400).json({ error: 'Failed to create attendance column' });
    }

    res.status(201).json({
      message: 'Attendance column added successfully',
      column
    });
  } catch (error) {
    console.error('Attendance column creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance columns
app.get('/events/:id/attendance-columns', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: columns, error } = await supabaseAdmin
      .from('attendance_columns')
      .select('*')
      .eq('event_uuid', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Attendance columns fetch error:', error);
      return res.status(400).json({ error: 'Failed to fetch attendance columns' });
    }

    res.json(columns || []);
  } catch (error) {
    console.error('Attendance columns fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark attendance by QR scan
app.post('/attendance/mark', authenticateToken, async (req, res) => {
  try {
    const { participant_id, attendance_column_id, status = true } = req.body;

    if (!participant_id || !attendance_column_id) {
      return res.status(400).json({ error: 'Participant ID and attendance column ID are required' });
    }

    console.log(participant_id, attendance_column_id)

    // Verify participant exists
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .select('id, event_id')
      .eq('id', participant_id)
      .single();

      // console.log(data)

    if (participantError || !participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Verify attendance column exists and belongs to the same event
    const { data: column, error: columnError } = await supabaseAdmin
      .from('attendance_columns')
      .select('id, event_uuid')
      .eq('id', attendance_column_id)
      .single();
      
      console.log(participant, column)

    if (columnError || !column) {
      return res.status(404).json({ error: 'Attendance column not found' });
    }

    if (participant.event_id !== column.event_uuid) {
      return res.status(400).json({ error: 'Participant and attendance column belong to different events' });
    }

    // Check if attendance record exists
    const { data: existingRecord } = await supabaseAdmin
      .from('attendance')
      .select('id, status')
      .eq('participant_id', participant_id)
      .eq('attendance_column_id', attendance_column_id)
      .single();

    let result;
    if (existingRecord) {
      // Update existing record
      const { data, error } = await supabaseAdmin
        .from('attendance')
        .update({ 
          status,
          marked_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id)
        .select(`
          *,
          participants(name, email),
          attendance_columns(column_name)
        `)
        .single();
      
      if (error) {
        console.error('Attendance update error:', error);
        return res.status(400).json({ error: 'Failed to update attendance' });
      }
      result = data;
    } else {
      // Create new record
      const { data, error } = await supabaseAdmin
        .from('attendance')
        .insert({
          participant_id,
          attendance_column_id,
          status
        })
        .select(`
          *,
          participants(name, email),
          attendance_columns(column_name)
        `)
        .single();
      
      if (error) {
        console.error('Attendance creation error:', error);
        return res.status(400).json({ error: 'Failed to mark attendance' });
      }
      result = data;
    }

    res.json({
      message: 'Attendance marked successfully',
      attendance: result
    });
  } catch (error) {
    console.error('Attendance marking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance for event
app.get('/events/:id/attendance', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get all participants with their attendance data
    const { data: participants, error: participantsError } = await supabaseAdmin
      .from('participants')
      .select(`
        *,
        attendance(
          id,
          attendance_column_id,
          status,
          marked_at,
          updated_at
        )
      `)
      .eq('event_id', id)
      .order('name');

    if (participantsError) {
      console.error('Attendance fetch error:', participantsError);
      return res.status(400).json({ error: 'Failed to fetch attendance data' });
    }

    // Get all attendance columns for the event
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('attendance_columns')
      .select('*')
      .eq('event_id', id)
      .order('created_at');

    if (columnsError) {
      console.error('Attendance columns fetch error:', columnsError);
      return res.status(400).json({ error: 'Failed to fetch attendance columns' });
    }

    res.json({
      participants: participants || [],
      columns: columns || []
    });
  } catch (error) {
    console.error('Attendance data fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify QR code and get participant info
app.post('/qr/verify', authenticateToken, async (req, res) => {
  try {
    const { qr_data } = req.body;

    if (!qr_data) {
      return res.status(400).json({ error: 'QR data is required' });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(qr_data);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid QR code format' });
    }

    const { participant_id, event_id, qr_code } = parsedData;

    if (!participant_id || !event_id || !qr_code) {
      return res.status(400).json({ error: 'Invalid QR code data' });
    }

    // Verify participant and QR code
    const { data: participant, error } = await supabaseAdmin
      .from('participants')
      .select(`
        *,
        events(name, description)
      `)
      .eq('id', participant_id)
      .eq('event_id', event_id)
      .eq('qr_code', qr_code)
      .single();

    if (error || !participant) {
      return res.status(404).json({ error: 'Invalid QR code' });
    }

    res.json({
      message: 'QR code verified successfully',
      participant
    });
  } catch (error) {
    console.error('QR verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete attendance column
app.delete('/attendance-columns/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('attendance_columns')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Attendance column deletion error:', error);
      return res.status(400).json({ error: 'Failed to delete attendance column' });
    }

    res.json({ message: 'Attendance column deleted successfully' });
  } catch (error) {
    console.error('Attendance column deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =================== UTILITY ENDPOINTS ===================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Get user profile
app.get('/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, name, role, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
