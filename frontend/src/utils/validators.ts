import { z } from 'zod';

// ─── Auth ─────────────────────────────────────────────────────────────────

export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

export type LoginFormSchema = z.infer<typeof loginFormSchema>;

// ─── Product ──────────────────────────────────────────────────────────────

export const productFormSchema = z.object({
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU must be 50 characters or less')
    .regex(/^[A-Z0-9_-]+$/i, 'SKU can only contain letters, numbers, hyphens, and underscores'),
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(255, 'Name must be 255 characters or less'),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional(),
  categoryId: z
    .number({ required_error: 'Category is required' })
    .int()
    .positive('Category is required'),
  unitPrice: z
    .number({ required_error: 'Price is required' })
    .positive('Price must be greater than 0')
    .multipleOf(0.01, 'Price must have at most 2 decimal places'),
  lowStockThreshold: z
    .number({ required_error: 'Low stock threshold is required' })
    .int('Threshold must be a whole number')
    .positive('Threshold must be greater than 0'),
});

export type ProductFormSchema = z.infer<typeof productFormSchema>;

// ─── Category ─────────────────────────────────────────────────────────────

export const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
});

export type CategoryFormSchema = z.infer<typeof categoryFormSchema>;

// ─── Order ────────────────────────────────────────────────────────────────

const orderLineSchema = z.object({
  productId: z.number().int().positive('Product is required'),
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0'),
  unitPrice: z
    .number({ required_error: 'Unit price is required' })
    .positive('Unit price must be greater than 0'),
});

export const orderFormSchema = z.object({
  customerId: z
    .number({ required_error: 'Customer is required' })
    .int()
    .positive('Customer is required'),
  lines: z
    .array(orderLineSchema)
    .min(1, 'Order must contain at least one item'),
});

export type OrderFormSchema = z.infer<typeof orderFormSchema>;
export type OrderLineFormSchema = z.infer<typeof orderLineSchema>;

// ─── Customer ─────────────────────────────────────────────────────────────

export const customerFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Customer name is required')
    .max(255, 'Name must be 255 characters or less'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .max(20, 'Phone must be 20 characters or less')
    .optional()
    .or(z.literal('')),
  address: z.string().max(500, 'Address must be 500 characters or less').optional().or(z.literal('')),
  city: z.string().max(100, 'City must be 100 characters or less').optional().or(z.literal('')),
  postalCode: z
    .string()
    .max(20, 'Postal code must be 20 characters or less')
    .optional()
    .or(z.literal('')),
});

export type CustomerFormSchema = z.infer<typeof customerFormSchema>;

// ─── Supplier ─────────────────────────────────────────────────────────────

export const supplierFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Supplier name is required')
    .max(255, 'Name must be 255 characters or less'),
  contactPerson: z
    .string()
    .min(1, 'Contact person is required')
    .max(255, 'Contact person must be 255 characters or less'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .max(20, 'Phone must be 20 characters or less'),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(500, 'Address must be 500 characters or less'),
});

export type SupplierFormSchema = z.infer<typeof supplierFormSchema>;

// ─── Stock Adjustment ─────────────────────────────────────────────────────

export const stockAdjustmentSchema = z.object({
  stockItemId: z.number().int().positive('Stock item is required'),
  quantityDelta: z.number().int().refine((n) => n !== 0, {
    message: 'Quantity delta cannot be zero',
  }),
  movementType: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RESERVATION', 'RELEASE']),
  referenceType: z.string().optional(),
  referenceId: z.number().int().positive().optional(),
});

export type StockAdjustmentSchema = z.infer<typeof stockAdjustmentSchema>;
