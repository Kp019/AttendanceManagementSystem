import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../hooks/http'

interface Participant {
  id: string;
  event_id: string;
  name: string;
  email: string;
  phone: string;
  qr_code: string;
  qr_code_url: string;
  created_at: string;
  attendance?: AttendanceRecord[];
}

interface AttendanceRecord {
  attendance_column_id: string;
  status: boolean;
  attendance_columns: {
    column_name: string;
  };
}

interface ParticipantsState {
  list: Participant[];
  selectedParticipant: Participant | null;
  loading: boolean;
  error: string | null;
  uploadLoading: boolean;
}

const initialState: ParticipantsState = {
  list: [],
  selectedParticipant: null,
  loading: false,
  error: null,
  uploadLoading: false,
}

// Async thunks
export const fetchParticipants = createAsyncThunk(
  'participants/fetchParticipants',
  async (eventId: string) => {
    const { data } = await api.get(`/events/${eventId}/participants`);
    return data;
  }
);

export const uploadParticipantsCsv = createAsyncThunk(
  'participants/upload',
  async ({ eventId, csvFile }: { eventId: string; csvFile: File }) => {
    const formData = new FormData();
    formData.append('csvFile', csvFile);
    
    console.log(formData, eventId, 'formData_uploadParticipantsCsv')
    
    const { data } = await api.post(`/events/${eventId}/participants/upload`, formData);
    return data;
  }
);

export const addParticipant = createAsyncThunk(
  'participants/addParticipant',
  async ({ eventId, participant }: { eventId: string; participant: Omit<Participant, 'id' | 'event_id' | 'qr_code' | 'qr_code_url' | 'created_at'> }) => {
    const { data } = await api.post(`/events/${eventId}/participants`, participant);
    return data;
  }
);

export const updateParticipant = createAsyncThunk(
  'participants/updateParticipant',
  async ({ participantId, updates }: { participantId: string; updates: Partial<Participant> }) => {
    const { data } = await api.put(`/participants/${participantId}`, updates);
    return data;
  }
);

export const deleteParticipant = createAsyncThunk(
  'participants/deleteParticipant',
  async (participantId: string) => {
    await api.delete(`/participants/${participantId}`);
    return { participantId };
  }
);

export const fetchParticipantQRCode = createAsyncThunk(
  'participants/fetchQRCode',
  async (participantId: string) => {
    const { data } = await api.get(`/participants/${participantId}/qrcode`);
    return data;
  }
);

export const downloadQRCodesZip = createAsyncThunk(
  'participants/downloadQRCodesZip',
  async (eventId: string) => {
    const response = await api.get(`/events/${eventId}/qrcodes/zip`, { responseType: 'blob' });
    const blob = response.data as Blob;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `event_${eventId}_qrcodes.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  }
);

const participantsSlice = createSlice({
  name: 'participants',
  initialState,
  reducers: {
    selectParticipant: (state, action) => {
      state.selectedParticipant = action.payload;
    },
    clearSelectedParticipant: (state) => {
      state.selectedParticipant = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearParticipants: (state) => {
      state.list = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch participants
      .addCase(fetchParticipants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParticipants.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchParticipants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch participants';
      })
      
      // Upload CSV
      .addCase(uploadParticipantsCsv.pending, (state) => {
        state.uploadLoading = true;
        state.error = null;
      })
      .addCase(uploadParticipantsCsv.fulfilled, (state, action) => {
        state.uploadLoading = false;
        state.list = [...state.list, ...action.payload.participants];
      })
      .addCase(uploadParticipantsCsv.rejected, (state, action) => {
        state.uploadLoading = false;
        state.error = action.error.message || 'Failed to upload CSV';
      })
      
      // Add participant
      .addCase(addParticipant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addParticipant.fulfilled, (state, action) => {
        state.loading = false;
        state.list.push(action.payload.participant);
      })
      .addCase(addParticipant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add participant';
      })
      
      // Update participant
      .addCase(updateParticipant.fulfilled, (state, action) => {
        const index = state.list.findIndex(p => p.id === action.payload.participant.id);
        if (index !== -1) {
          state.list[index] = action.payload.participant;
        }
        if (state.selectedParticipant?.id === action.payload.participant.id) {
          state.selectedParticipant = action.payload.participant;
        }
      })
      .addCase(updateParticipant.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update participant';
      })
      
      // Delete participant
      .addCase(deleteParticipant.fulfilled, (state, action) => {
        state.list = state.list.filter(p => p.id !== action.payload.participantId);
        if (state.selectedParticipant?.id === action.payload.participantId) {
          state.selectedParticipant = null;
        }
      })
      .addCase(deleteParticipant.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete participant';
      })
      
      // Download QR codes
      .addCase(downloadQRCodesZip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadQRCodesZip.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(downloadQRCodesZip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to download QR codes';
      });
  },
});

export const { 
  selectParticipant, 
  clearSelectedParticipant, 
  clearError, 
  clearParticipants 
} = participantsSlice.actions;

export default participantsSlice.reducer;