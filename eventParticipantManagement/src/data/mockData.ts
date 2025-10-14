export const mockUser = { id: 1, name: "John Admin", email: "admin@example.com", role: "admin" };

export const mockEvents = [
  { id: 1, name: "Tech Conference 2024", description: "Annual technology conference", created_by: 1, participants_count: 150 },
  { id: 2, name: "Food Festival", description: "Local food tasting event", created_by: 1, participants_count: 200 }
];

export const mockParticipants = [
  { id: 1, event_id: 1, name: "Alice Johnson", email: "alice@mail.com", phone: "1234567890", qr_code: "QR001" },
  { id: 2, event_id: 1, name: "Bob Smith", email: "bob@mail.com", phone: "9876543210", qr_code: "QR002" }
];

export const mockAttendanceColumns = [
  { id: 1, event_id: 1, column_name: "Day 1 Registration" },
  { id: 2, event_id: 1, column_name: "Lunch" },
  { id: 3, event_id: 1, column_name: "Dinner" },
  { id: 4, event_id: 1, column_name: "Day 2 Registration" }
];
