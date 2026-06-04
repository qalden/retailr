import type { OrderStatus, StockMovementType } from './api';

// ─── User / Auth ──────────────────────────────────────────────────────────

export type UserRole =
  | 'ROLE_ADMIN'
  | 'ROLE_SALES_OFFICER'
  | 'ROLE_INVENTORY_MANAGER'
  | 'ROLE_VIEWER';

export interface User {
  id: number;
  email: string;
  name: string;
  roles: UserRole[];
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

// ─── Product / Catalog ───────────────────────────────────────────────────

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  categoryId: number;
  categoryName: string;
  unitPrice: number;
  lowStockThreshold: number;
  supplierIds: number[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

// ─── Supplier ─────────────────────────────────────────────────────────────

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Stock ────────────────────────────────────────────────────────────────

export interface StockItem {
  id: number;
  productId: number;
  warehouseId: number;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  updatedAt: string;
}

export interface StockMovement {
  id: number;
  stockItemId: number;
  quantityDelta: number;
  movementType: StockMovementType;
  referenceType: string | null;
  referenceId: number | null;
  createdAt: string;
}

export interface LowStockAlert {
  id: number;
  stockItemId: number;
  triggeredAt: string;
  acknowledgedAt: string | null;
  acknowledgedByUserId: number | null;
}

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  createdAt: string;
}

// ─── Order ────────────────────────────────────────────────────────────────

export interface OrderLine {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customer: Customer;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  confirmedAt: string | null;
  fulfilledAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
  lines: OrderLine[];
}

// ─── Customer ─────────────────────────────────────────────────────────────

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  createdAt: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────

export interface Pagination {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
