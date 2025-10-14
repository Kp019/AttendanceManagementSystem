import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import eventsSlice from './slices/eventsSlice'
import participantsSlice from './slices/participantsSlice'
import attendanceSlice from './slices/attendanceSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    events: eventsSlice,
    participants: participantsSlice,
    attendance: attendanceSlice,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch