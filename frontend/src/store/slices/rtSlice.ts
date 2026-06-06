import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

// ─── State ────────────────────────────────────────────────────────────────

interface RealTimeState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

const initialState: RealTimeState = {
  connected: false,
  connecting: false,
  error: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────

const rtSlice = createSlice({
  name: 'realtime',
  initialState,
  reducers: {
    setConnectionState(
      state,
      action: PayloadAction<{ connected: boolean; connecting: boolean; error: string | null }>
    ) {
      state.connected = action.payload.connected;
      state.connecting = action.payload.connecting;
      state.error = action.payload.error;
    },
  },
});

// ─── Actions ──────────────────────────────────────────────────────────────

export const { setConnectionState } = rtSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────

export const selectRTConnected = (state: RootState) => state.realtime.connected;
export const selectRTConnecting = (state: RootState) => state.realtime.connecting;
export const selectRTError = (state: RootState) => state.realtime.error;

export default rtSlice.reducer;
