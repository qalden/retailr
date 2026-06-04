import type { ReactNode } from 'react';

// ─── Layout ───────────────────────────────────────────────────────────────

export interface LayoutProps {
  children: ReactNode;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

// ─── Notification ─────────────────────────────────────────────────────────

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  severity: NotificationSeverity;
  autoHideDuration?: number;
}

// ─── Modal ────────────────────────────────────────────────────────────────

export interface ModalConfig {
  id: string;
  isOpen: boolean;
  data?: unknown;
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

// ─── Table ────────────────────────────────────────────────────────────────

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
  width?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

// ─── Form ─────────────────────────────────────────────────────────────────

export interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  helpText?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────

export interface LoginFormValues {
  email: string;
  password: string;
}

// ─── Route / Navigation ───────────────────────────────────────────────────

export interface NavItem {
  label: string;
  path: string;
  icon?: ReactNode;
  roles?: string[];
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}
