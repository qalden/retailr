import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Notification, ModalConfig } from '@/types/ui';
import type { RootState } from '@/store';

// ─── State ────────────────────────────────────────────────────────────────

type ThemeMode = 'light' | 'dark' | 'system';

interface UiSliceState {
  isLoading: boolean;
  notifications: Notification[];
  modals: ModalConfig[];
  theme: ThemeMode;
  sidebarCollapsed: boolean;
}

const initialState: UiSliceState = {
  isLoading: false,
  notifications: [],
  modals: [],
  theme: 'light',
  sidebarCollapsed: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Slice ────────────────────────────────────────────────────────────────

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setGlobalLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    showNotification(
      state,
      action: PayloadAction<Omit<Notification, 'id'>>,
    ) {
      state.notifications.push({
        id: generateId(),
        autoHideDuration: 5000,
        ...action.payload,
      });
    },
    dismissNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    clearAllNotifications(state) {
      state.notifications = [];
    },
    openModal(state, action: PayloadAction<{ id: string; data?: unknown }>) {
      const existing = state.modals.find((m) => m.id === action.payload.id);
      if (existing) {
        existing.isOpen = true;
        existing.data = action.payload.data;
      } else {
        state.modals.push({
          id: action.payload.id,
          isOpen: true,
          data: action.payload.data,
        });
      }
    },
    closeModal(state, action: PayloadAction<string>) {
      const modal = state.modals.find((m) => m.id === action.payload);
      if (modal) {
        modal.isOpen = false;
        modal.data = undefined;
      }
    },
    closeAllModals(state) {
      state.modals = state.modals.map((m) => ({ ...m, isOpen: false, data: undefined }));
    },
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
  },
});

// ─── Actions ──────────────────────────────────────────────────────────────

export const {
  setGlobalLoading,
  showNotification,
  dismissNotification,
  clearAllNotifications,
  openModal,
  closeModal,
  closeAllModals,
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
} = uiSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────

export const selectIsGlobalLoading = (state: RootState) => state.ui.isLoading;
export const selectNotifications = (state: RootState) => state.ui.notifications;
export const selectModal = (id: string) => (state: RootState) =>
  state.ui.modals.find((m) => m.id === id);
export const selectTheme = (state: RootState) => state.ui.theme;
export const selectSidebarCollapsed = (state: RootState) => state.ui.sidebarCollapsed;

export default uiSlice.reducer;
