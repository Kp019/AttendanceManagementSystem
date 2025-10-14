import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../hooks/http'

interface AttendanceColumn {
  id: string;
  event_id: string;
  column_name: string;
  created_at: string;
}

interface AttendanceRecord {
  id: string;
  participant_id: string;
  attendance_column_id: string;
  status: boolean;
  updated_at: string;
}

interface AttendanceState {
  columns: AttendanceColumn[];
  records: AttendanceRecord[];
  loading: boolean;
  error: string | null;
  markingAttendance: boolean;
}

const initialState: AttendanceState = {
  columns: [],
  records: [],
  loading: false,
  error: null,
  markingAttendance: false,
}

// Async thunks
export const fetchAttendanceColumns = createAsyncThunk(
  'attendance/fetchColumns',
  async (eventId: string) => {
    const { data } = await api.get(`/events/${eventId}/attendance-columns`);
    return data;
  }
);

export const createAttendanceColumn = createAsyncThunk(
  'attendance/createColumn',
  async ({ eventId, columnName }: { eventId: string; columnName: string }) => {
    const { data } = await api.post(`/events/${eventId}/attendance-columns`, { column_name: columnName });
    return data;
  }
);

export const markAttendance = createAsyncThunk(
  'attendance/markAttendance',
  async ({ 
    participantId, 
    attendanceColumnId, 
    status = true 
  }: { 
    participantId: string; 
    attendanceColumnId: string; 
    status?: boolean;
  }) => {
    const { data } = await api.post(`/attendance/mark`, {
      participant_id: participantId,
      attendance_column_id: attendanceColumnId,
      status,
    });
    return data;
  }
);

// QR Scanner specific action
export const markAttendanceByQR = createAsyncThunk(
  'attendance/markAttendanceByQR',
  async ({ 
    qrData, 
    attendanceColumnId 
  }: { 
    qrData: { participant_id: string; event_id: string; qr_code: string }; 
    attendanceColumnId: string;
  }) => {
    const { data } = await api.post(`/attendance/mark`, {
      participant_id: qrData.participant_id,
      attendance_column_id: attendanceColumnId,
      status: true,
    });
    return data;
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAttendanceData: (state) => {
      state.columns = [];
      state.records = [];
    },
    // Local state update for real-time attendance marking
    updateAttendanceStatus: (state, action) => {
      const { participantId, attendanceColumnId, status } = action.payload;
      const existingRecord = state.records.find(
        r => r.participant_id === participantId && r.attendance_column_id === attendanceColumnId
      );
      
      if (existingRecord) {
        existingRecord.status = status;
        existingRecord.updated_at = new Date().toISOString();
      } else {
        state.records.push({
          id: `temp_${Date.now()}`,
          participant_id: participantId,
          attendance_column_id: attendanceColumnId,
          status,
          updated_at: new Date().toISOString(),
        });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch attendance columns
      .addCase(fetchAttendanceColumns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceColumns.fulfilled, (state, action) => {
        state.loading = false;
        state.columns = action.payload;
      })
      .addCase(fetchAttendanceColumns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch attendance columns';
      })
      
      // Create attendance column
      .addCase(createAttendanceColumn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAttendanceColumn.fulfilled, (state, action) => {
        state.loading = false;
        state.columns.push(action.payload.column);
      })
      .addCase(createAttendanceColumn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create attendance column';
      })
      
      // Mark attendance
      .addCase(markAttendance.pending, (state) => {
        state.markingAttendance = true;
        state.error = null;
      })
      .addCase(markAttendance.fulfilled, (state, action) => {
        state.markingAttendance = false;
        const attendanceData = action.payload.attendance;
        
        // Update or add the attendance record
        const existingIndex = state.records.findIndex(
          r => r.participant_id === attendanceData.participant_id && 
               r.attendance_column_id === attendanceData.attendance_column_id
        );
        
        if (existingIndex !== -1) {
          state.records[existingIndex] = attendanceData;
        } else {
          state.records.push(attendanceData);
        }
      })
      .addCase(markAttendance.rejected, (state, action) => {
        state.markingAttendance = false;
        state.error = action.error.message || 'Failed to mark attendance';
      })
      
      // Mark attendance by QR
      .addCase(markAttendanceByQR.pending, (state) => {
        state.markingAttendance = true;
        state.error = null;
      })
      .addCase(markAttendanceByQR.fulfilled, (state, action) => {
        state.markingAttendance = false;
        const attendanceData = action.payload.attendance;
        
        // Update or add the attendance record
        const existingIndex = state.records.findIndex(
          r => r.participant_id === attendanceData.participant_id && 
               r.attendance_column_id === attendanceData.attendance_column_id
        );
        
        if (existingIndex !== -1) {
          state.records[existingIndex] = attendanceData;
        } else {
          state.records.push(attendanceData);
        }
      })
      .addCase(markAttendanceByQR.rejected, (state, action) => {
        state.markingAttendance = false;
        state.error = action.error.message || 'Failed to mark attendance by QR';
      });
  },
});

export const { 
  clearError, 
  clearAttendanceData, 
  updateAttendanceStatus 
} = attendanceSlice.actions;

export default attendanceSlice.reducer;