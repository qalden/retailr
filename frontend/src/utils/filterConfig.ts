/**
 * Filter definitions and configurations for different domains.
 * Zero external dependencies.
 */

export interface FilterDefinition {
  field: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'range';
  operators: string[];
  options?: Array<{ label: string; value: unknown }>;
}

export interface DomainFilters {
  [domain: string]: FilterDefinition[];
}

/**
 * Product filter definitions
 */
export const PRODUCT_FILTERS: FilterDefinition[] = [
  {
    field: 'sku',
    label: 'SKU',
    type: 'text',
    operators: ['equals', 'contains'],
  },
  {
    field: 'name',
    label: 'Product Name',
    type: 'text',
    operators: ['equals', 'contains'],
  },
  {
    field: 'categoryName',
    label: 'Category',
    type: 'select',
    operators: ['equals', 'in'],
    options: [
      { label: 'Electronics', value: 'Electronics' },
      { label: 'Accessories', value: 'Accessories' },
      { label: 'Software', value: 'Software' },
    ],
  },
  {
    field: 'unitPrice',
    label: 'Unit Price',
    type: 'range',
    operators: ['gte', 'lte', 'gt', 'lt'],
  },
  {
    field: 'lowStockThreshold',
    label: 'Low Stock Threshold',
    type: 'number',
    operators: ['gte', 'lte', 'gt', 'lt'],
  },
];

/**
 * Order filter definitions
 */
export const ORDER_FILTERS: FilterDefinition[] = [
  {
    field: 'orderNumber',
    label: 'Order Number',
    type: 'text',
    operators: ['equals', 'contains'],
  },
  {
    field: 'status',
    label: 'Status',
    type: 'select',
    operators: ['equals', 'in'],
    options: [
      { label: 'PENDING', value: 'PENDING' },
      { label: 'CONFIRMED', value: 'CONFIRMED' },
      { label: 'FULFILLED', value: 'FULFILLED' },
      { label: 'CANCELLED', value: 'CANCELLED' },
    ],
  },
  {
    field: 'totalAmount',
    label: 'Total Amount',
    type: 'range',
    operators: ['gte', 'lte', 'gt', 'lt'],
  },
  {
    field: 'createdAt',
    label: 'Created Date',
    type: 'date',
    operators: ['gte', 'lte'],
  },
];

/**
 * Stock filter definitions
 */
export const STOCK_FILTERS: FilterDefinition[] = [
  {
    field: 'sku',
    label: 'SKU',
    type: 'text',
    operators: ['equals', 'contains'],
  },
  {
    field: 'quantity',
    label: 'Quantity',
    type: 'number',
    operators: ['equals', 'gte', 'lte', 'gt', 'lt'],
  },
  {
    field: 'availableQuantity',
    label: 'Available Quantity',
    type: 'number',
    operators: ['gte', 'lte', 'gt', 'lt'],
  },
  {
    field: 'reservedQuantity',
    label: 'Reserved Quantity',
    type: 'number',
    operators: ['gte', 'lte', 'gt', 'lt'],
  },
];

/**
 * Get filter definitions for a specific domain
 */
export function getFiltersByDomain(
  domain: 'product' | 'order' | 'stock'
): FilterDefinition[] {
  switch (domain) {
    case 'product':
      return PRODUCT_FILTERS;
    case 'order':
      return ORDER_FILTERS;
    case 'stock':
      return STOCK_FILTERS;
    default:
      return [];
  }
}

/**
 * Check if a field is valid for a domain
 */
export function isValidField(domain: 'product' | 'order' | 'stock', field: string): boolean {
  const filters = getFiltersByDomain(domain);
  return filters.some((f) => f.field === field);
}

/**
 * Get a filter definition by domain and field
 */
export function getFilterDefinition(
  domain: 'product' | 'order' | 'stock',
  field: string
): FilterDefinition | undefined {
  const filters = getFiltersByDomain(domain);
  return filters.find((f) => f.field === field);
}
