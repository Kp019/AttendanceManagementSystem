/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../hooks/http'

export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async () => {
    const { data } = await api.get('/events');
    return data;
  }
);

interface EventData {
  uuid: any;
  id: string;
  name: string;
  description: string;
  image_url?: string;
  created_by: string;
  created_at: string;
  participants?: { count: number }[];
}

export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (eventData: Omit<EventData, 'id' | 'created_by' | 'created_at' | 'participants'>) => {
    const { data } = await api.post('/events', eventData);
    return data;
  }
);

export const fetchEventById = createAsyncThunk(
  'events/fetchEventById',
  async (
    { eventId, token }: { eventId: string; token: string }
  ) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log(token, "token");
    const { data } = await api.get(`/events/${eventId}`);
    return data;
  }
);

export const addEventAdmin = createAsyncThunk(
  'events/addAdmin',
  async ({ eventId, userId }: { eventId: string; userId: string }) => {
    const { data } = await api.post(`/events/${eventId}/admins`, { user_id: userId });
    return data;
  }
);

interface EventsState {
  list: EventData[];
  selectedEvent: EventData | null;
  loading: boolean;
  error: string | null;
}

const initialState: EventsState = {
  list: [],
  selectedEvent: null,
  loading: false,
  error: null,
}

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    selectEvent: (state, action) => {
      state.selectedEvent = action.payload;
    },
    clearSelectedEvent: (state) => {
      state.selectedEvent = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch events
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.list = action.payload;
        state.loading = false;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch events';
      })
      
      // Create event
      .addCase(createEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.list.push(action.payload.event);
        state.loading = false;
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create event';
      })
      
      // Fetch event by ID
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.selectedEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch event';
      })
      
      // Add event admin
      .addCase(addEventAdmin.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to add admin';
      });
  },
});

export const { selectEvent, clearSelectedEvent, clearError } = eventsSlice.actions;
// export { fetchEventById, addEventAdmin };
export default eventsSlice.reducer;
