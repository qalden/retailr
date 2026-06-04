// ─── Auth ──────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDTO;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserDTO {
  id: number;
  email: string;
  name: string;
  roles: string[];
}

export interface UserDTO {
  id: number;
  email: string;
  name: string;
  roles: string[];
  createdAt: string;
}

// ─── Products ──────────────────────────────────────────────────────────────

export interface ProductDTO {
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

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  categoryId: number;
  unitPrice: number;
  lowStockThreshold: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  categoryId?: number;
  unitPrice?: number;
  lowStockThreshold?: number;
}

// ─── Categories ───────────────────────────────────────────────────────────

export interface CategoryDTO {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
}

// ─── Suppliers ────────────────────────────────────────────────────────────

export interface SupplierDTO {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

export interface UpdateSupplierRequest {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// ─── Stock ────────────────────────────────────────────────────────────────

export interface StockItemDTO {
  id: number;
  productId: number;
  warehouseId: number;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  updatedAt: string;
}

export interface StockMovementDTO {
  id: number;
  stockItemId: number;
  quantityDelta: number;
  movementType: StockMovementType;
  referenceType: string | null;
  referenceId: number | null;
  createdAt: string;
}

export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVATION' | 'RELEASE';

export interface CreateStockMovementRequest {
  stockItemId: number;
  quantityDelta: number;
  movementType: StockMovementType;
  referenceType?: string;
  referenceId?: number;
}

export interface LowStockAlertDTO {
  id: number;
  stockItemId: number;
  triggeredAt: string;
  acknowledgedAt: string | null;
  acknowledgedByUserId: number | null;
}

export interface WarehouseDTO {
  id: number;
  name: string;
  location: string;
  createdAt: string;
}

// ─── Orders ───────────────────────────────────────────────────────────────

export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'FULFILLED' | 'CANCELLED';

export interface OrderLineDTO {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CreateOrderLineRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface OrderDTO {
  id: number;
  orderNumber: string;
  customer: CustomerDTO;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  confirmedAt: string | null;
  fulfilledAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
  lines: OrderLineDTO[];
}

export interface CreateOrderRequest {
  customerId: number;
  lines: CreateOrderLineRequest[];
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

// ─── Customers ────────────────────────────────────────────────────────────

export interface CustomerDTO {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  createdAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
}

// ─── Error ────────────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  status: number;
  error: string;
  message: string;
  timestamp: string;
  path?: string;
  validationErrors?: Record<string, string>;
}
