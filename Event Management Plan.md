# 📋 Action Plan – Event Food & Attendance Website (QR Code Based)

## 1. 🎯 Project Goals
- Manage **event participants** and their attendance at multiple sessions (meals, registrations, etc.).
- Use **QR codes** for participants to mark attendance at each stage.
- Allow **admins** to manage participants and event data.
- Allow **participants** to view event info and get their personal QR code.
- Support **multi-admin assignment**.

---

## 2. 👥 Roles
1. **Admin**
   - Create & manage events.
   - Upload & manage participants (CSV/CRUD).
   - Configure attendance columns (registration, meals, sessions).
   - Scan QR codes to update participant status.
   - Assign other users as co-admins.
2. **Participant**
   - View their event details.
   - Download/scan their unique QR code.
   - Track their own attendance status (optional view).

---

## 3. 🌐 Website Pages
### **1. Home Page**
- Intro to features: event management, QR code attendance, food tracking.
- Navigation: Home | Events | Login/Register.

### **2. Events Page**
- List of events created by the logged-in user.
- For **participants**: List of events they are registered in.
- CTA: “Create Event” (for admins).

### **3. Event Detail Page**
#### **Admin View**
- **Participant Data Management**
  - Upload CSV → parse & insert into DB. or can add people one by one.
  - Show table: Name, Email, Phone, QR Code, etc.
  - CRUD operations.
  - Generate QR code column for each participant.
  - Bulk download QR codes (ZIP).
- **Event Data Management**
  - Configure attendance fields (e.g., Day 1 Registration, Lunch, Dinner).
  - Display an attendance table (Participants × Attendance Columns).
- **QR Scanner**
  - On clicking a column block → open QR scanner modal.
  - Scan participant QR → update checkbox for that attendance column.
- **Admin Management**
  - Add/remove co-admins for this event.

#### **Participant View**
- Show event details (title, description, date, image).
- Show personal QR code.
- Show attendance status (optional: checkmarks for meals/registration completed).

---

## 4. 🗄 Database Schema
### **Users Table**
| id | name | email | password_hash | role (admin/participant) | created_at |

### **Events Table**
| id | name | description | image_url | created_by (user_id) | created_at |

### **Event_Admins Table**
| id | event_id | user_id |

### **Participants Table**
| id | event_id | name | email | phone | qr_code_url | created_at |

### **Attendance_Columns Table**
| id | event_id | column_name (e.g., "Day1 Lunch") | created_at |

### **Attendance Table**
| id | participant_id | attendance_column_id | status (boolean) | updated_at |

---

## 5. 📦 Tech Stack
### **Frontend**
- React + vite + typescript.
- Tailwind CSS (UI styling).
- QR Code generator (`qrcode.react` or `qr-code-styling`).
- QR Scanner (`react-qr-reader`).

### **Backend**
- Node.js (Express.js).
- supabase
- CSV parsing (`multer`, `csv-parser`).
- File storage for QR code images (local or cloud e.g. S3).
- Bulk ZIP download (`archiver`).

### **Database**
- Supabase

---

## 6. 🔗 API Endpoints
### **Auth**
- `POST /auth/register`
- `POST /auth/login`

### **Events**
- `POST /events` → create event (admin only).
- `GET /events` → list events (all users).
- `GET /events/:id` → event details.
- `POST /events/:id/admins` → add co-admin.
- `DELETE /events/:id/admins/:userId` → remove co-admin.

### **Participants**
- `POST /events/:id/participants/upload` → upload CSV.
- `GET /events/:id/participants` → list participants.
- `POST /events/:id/participants` → add single participant.
- `PUT /participants/:id` → update participant.
- `DELETE /participants/:id` → delete participant.
- `GET /participants/:id/qrcode` → get participant QR code.
- `GET /events/:id/qrcodes/zip` → bulk download.

### **Attendance**
- `POST /events/:id/attendance-columns` → add attendance field.
- `GET /events/:id/attendance-columns` → list columns.
- `POST /attendance/mark` → mark attendance by QR scan.

---

## 7. 📑 CSV Upload Format
```csv
name,email,phone
Alice Johnson,alice@mail.com,1234567890
Bob Smith,bob@mail.com,9876543210
```

## 9. 📊 Example User Flow
1. **Admin logs in → creates event.**
2. **Admin uploads CSV → participants added & QR codes generated.**
3. **Participants log in → see their QR code.**
4. **At event:**
   - Admin selects "Lunch" column → opens scanner.
   - Participant shows QR → scanner updates DB.
5. **Admin downloads report of attendance.**
