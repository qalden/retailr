# Design System: Retailr Platform

**Version:** 1.0  
**Date:** 2026-05-29  
**Status:** Specification

## Visual Identity

**Name:** Retailr  
**Tagline:** Enterprise Retail Operations, Refined.

### Design Philosophy

Calm, data-dense, confident. The UI is the operational backbone for retail staff and managers — it prioritizes clarity, scannability, and efficiency over decorative aesthetics. Every pixel serves the user's task.

**Core principles:**
1. **Clarity over cleverness** — readers should immediately understand data and actions.
2. **Density without chaos** — pack information efficiently while maintaining visual hierarchy.
3. **Consistency** — every screen belongs to the same product.
4. **Responsiveness** — desktop-first (operations staff), functional on tablet.
5. **Accessibility** — WCAG AA compliance in every component.

## Color System

### Semantic Colors

**Light Mode (default):**

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-brand-primary` | `#0F5FDB` | Buttons, links, highlights |
| `--color-brand-secondary` | `#4D7EB0` | Muted interactions, secondary actions |
| `--color-semantic-success` | `#2A8F3A` | Positive states (confirmed orders, available stock) |
| `--color-semantic-warning` | `#D97F0A` | Caution states (low stock, pending) |
| `--color-semantic-error` | `#C6262E` | Errors, failures, cancellations |
| `--color-semantic-info` | `#0F5FDB` | Informational messages |
| `--color-neutral-50` | `#FAFAFA` | Lightest background, hover states |
| `--color-neutral-100` | `#F3F3F3` | Card backgrounds, subtle separation |
| `--color-neutral-200` | `#E8E8E8` | Borders, dividers |
| `--color-neutral-400` | `#999999` | Disabled text, secondary text |
| `--color-neutral-600` | `#666666` | Secondary text (on white) |
| `--color-neutral-700` | `#444444` | Primary text |
| `--color-neutral-900` | `#121212` | Darkest text, high contrast |

**Dark Mode:**

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-brand-primary` | `#5B9FFF` | Buttons, links, highlights |
| `--color-brand-secondary` | `#8DB3E6` | Muted interactions |
| `--color-semantic-success` | `#5AC96F` | Positive states |
| `--color-semantic-warning` | `#FFB84D` | Caution states |
| `--color-semantic-error` | `#FF6B6B` | Errors |
| `--color-semantic-info` | `#5B9FFF` | Informational |
| `--color-neutral-50` | `#1A1A1A` | Darkest background |
| `--color-neutral-100` | `#2A2A2A` | Card backgrounds |
| `--color-neutral-200` | `#3A3A3A` | Borders |
| `--color-neutral-400` | `#999999` | Disabled text |
| `--color-neutral-600` | `#CCCCCC` | Secondary text |
| `--color-neutral-700` | `#E8E8E8` | Primary text |
| `--color-neutral-900` | `#F8F8F8` | Highest contrast text |

### Usage Rules

- **Primary brand actions** (submit, confirm, primary CTA) → `--color-brand-primary`
- **Secondary actions** (cancel, back, less important actions) → `--color-neutral-600`
- **Success states** → `--color-semantic-success`
- **Warnings** (low stock, need attention) → `--color-semantic-warning`
- **Errors** (validation, failures, cancellations) → `--color-semantic-error`
- **Text on light backgrounds** → `--color-neutral-700` or darker
- **Text on dark backgrounds** → `--color-neutral-700` (light mode) or `--color-neutral-900` (dark mode)
- **Disabled states** → `--color-neutral-400` with reduced opacity

## Typography

**Font Family:** Inter (primary), Courier New (monospace)

### Type Scale

| Role | Font Size | Line Height | Weight | Usage |
|------|-----------|-------------|--------|-------|
| `H1` | 32px | 40px | 600 | Page titles |
| `H2` | 24px | 32px | 600 | Section headings |
| `H3` | 20px | 28px | 600 | Subsection headings |
| `Body` | 14px | 20px | 400 | Paragraph text, table cells |
| `Body Small` | 12px | 18px | 400 | Secondary text, labels, metadata |
| `Label` | 12px | 16px | 500 | Form labels, badges |
| `Mono` | 13px | 19px | 400 | Code, SKU, IDs |

### Usage Rules

- Page titles → H1
- Section headings (e.g., "Products", "Orders") → H2
- Card headings → H3
- Body text, descriptions → Body
- Metadata, hints, secondary text → Body Small
- Form labels, tags → Label
- Product SKUs, order numbers, technical IDs → Mono

## Spacing

**Base unit:** 4px

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-xs` | 4px | Tight spacing (icon padding) |
| `--spacing-sm` | 8px | Compact spacing (button padding) |
| `--spacing-md` | 12px | Standard spacing |
| `--spacing-lg` | 16px | Card padding, section margins |
| `--spacing-xl` | 24px | Page margins, major sections |
| `--spacing-2xl` | 32px | Page-level spacing |

### Usage Rules

- **Button padding:** 8px (horizontal) × 6px (vertical)
- **Card padding:** 16px
- **Table cell padding:** 12px
- **Form field spacing:** 8px between fields
- **Section margin:** 24px or 32px
- **Page margin (desktop):** 32px
- **Modal/drawer padding:** 24px

## Elevation (Shadows)

| Token | Box Shadow | Usage |
|-------|-----------|-------|
| `--shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) | Subtle separation, hover states |
| `--shadow-md` | 0 4px 6px rgba(0,0,0,0.1) | Cards, default state |
| `--shadow-lg` | 0 10px 15px rgba(0,0,0,0.15) | Dropdowns, popovers |
| `--shadow-xl` | 0 20px 25px rgba(0,0,0,0.2) | Modals, overlays |

### Usage Rules

- **Cards:** `--shadow-md`
- **Hoverable elements:** `--shadow-md` → `--shadow-lg` on hover
- **Dropdowns/popover:** `--shadow-lg`
- **Modals:** `--shadow-xl` (with semi-transparent overlay)
- **Default surfaces:** No shadow (elevation 0)

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 2px | Subtle rounding (form inputs) |
| `--radius-md` | 4px | Standard (buttons, cards) |
| `--radius-lg` | 8px | Large (dialogs, modals) |

### Usage Rules

- **Form inputs, buttons:** 2-4px
- **Cards, containers:** 4px
- **Modals, drawers:** 8px

## Motion & Animation

| Token | Duration | Timing Function | Usage |
|-------|----------|-----------------|-------|
| `--motion-fast` | 150ms | ease-in-out | Hover states, quick feedback |
| `--motion-normal` | 300ms | ease-in-out | Page transitions, modal open |
| `--motion-slow` | 500ms | ease-in-out | Large content changes |

### Principles

- **Purposeful:** Every animation supports task completion.
- **Efficient:** Fast feedback (< 200ms) for user interactions.
- **Subtle:** Avoid distracting motion; focus on clarity.
- **Accessible:** Respect `prefers-reduced-motion` media query.

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

## Component Catalog

### Button

**Variants:** Primary, Secondary, Danger, Disabled

**States:** Default, Hover, Active, Disabled

**Sizes:** Small (compact forms), Medium (default), Large (hero actions)

**Usage:**
- Primary → Main action (submit, confirm)
- Secondary → Alternative action (cancel, back)
- Danger → Destructive action (delete, cancel order)
- Disabled → Action unavailable (pending, permission required)

**HTML:**
```html
<button class="btn btn--primary">Save</button>
<button class="btn btn--secondary">Cancel</button>
<button class="btn btn--danger">Delete</button>
<button class="btn btn--primary" disabled>Loading...</button>
```

### Form Input

**Variants:** Text, Email, Number, Select, Checkbox, Radio, Textarea

**States:** Default, Focused, Filled, Error, Disabled

**Spacing:** 8px between fields

**Labels:** Above field (left-aligned)

**Validation:**
- Real-time feedback (as user types)
- Error message below field (color-semantic-error)
- Disabled if missing required fields

**HTML:**
```html
<div class="form-field">
  <label for="email">Email</label>
  <input 
    id="email" 
    type="email" 
    placeholder="user@example.com" 
    required
  />
  <span class="form-error" id="email-error"></span>
</div>
```

### Data Table

**Features:**
- Sortable columns (click header to sort)
- Filterable via header
- Pagination controls below table
- Virtualized for 1000+ rows
- Alternating row colors (subtle, no-distraction)
- Hover row highlighting

**Column alignment:**
- Text (names, descriptions) → Left
- Numbers (prices, quantities) → Right
- Dates → Center
- Status badges → Center

**HTML structure:**
```html
<table class="data-table">
  <thead>
    <tr>
      <th class="sortable">Name <span class="sort-icon"></span></th>
      <th class="numeric">Price</th>
      <th class="center">Status</th>
      <th class="actions">Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Blue T-Shirt</td>
      <td class="numeric">$19.99</td>
      <td class="center"><span class="badge badge--success">In Stock</span></td>
      <td class="actions">
        <a href="#edit">Edit</a>
        <a href="#delete">Delete</a>
      </td>
    </tr>
  </tbody>
</table>
<nav class="pagination">
  <!-- Page controls -->
</nav>
```

### Modal / Drawer

**Modal:**
- Overlay (semi-transparent dark)
- Centered card (max 600px)
- Header with title + close button
- Body (scrollable if tall)
- Footer with action buttons

**Drawer:**
- Slide in from right (desktop) or bottom (mobile)
- Full viewport height/width
- Same header/body/footer structure
- Close button, swipe-to-dismiss (mobile)

### Toast / Notification

**Variants:** Success, Error, Warning, Info

**Position:** Bottom-right (desktop), bottom (mobile)

**Auto-dismiss:** Success/Info (3s), Error/Warning (5s)

**Stack:** Multiple toasts stack vertically

**HTML:**
```html
<div class="toast toast--success" role="status" aria-live="polite">
  <span class="toast-icon">✓</span>
  <span class="toast-message">Order created successfully</span>
  <button class="toast-close" aria-label="Close">×</button>
</div>
```

### Skeleton / Loading Placeholder

**Usage:** While data is loading (replace content, not overlay)

**Pattern:** Gray placeholder with subtle animation

**HTML:**
```html
<div class="skeleton skeleton--text"></div>
<div class="skeleton skeleton--card"></div>
<div class="skeleton skeleton--table-row"></div>
```

### Empty State

**Components:**
- Large icon (128px)
- Heading ("No products found")
- Description ("Try adjusting your filters or create a new product")
- Primary action button (if applicable)

**Usage:** When a list is empty after filtering or on initial load

### Status Badge / Indicator

**Variants:** Primary, Success, Warning, Error, Neutral

**Usage:** Order status, stock level, alert state

**HTML:**
```html
<span class="badge badge--success">Confirmed</span>
<span class="badge badge--warning">Low Stock</span>
<span class="badge badge--error">Cancelled</span>
```

## Responsive Breakpoints

| Token | Breakpoint | Usage |
|-------|-----------|-------|
| `--bp-mobile` | 480px | Small phones |
| `--bp-tablet` | 768px | Tablets, portrait |
| `--bp-desktop` | 1024px | Desktop, default |
| `--bp-wide` | 1280px | Wide desktop |

### Responsive Rules

- **Desktop-first design** (operations staff primary).
- **Tablet:** Narrow sidebars, smaller modals.
- **Mobile:** Drawer navigation, bottom-aligned modals, single-column layouts.
- **Always readable:** Minimum 16px font, sufficient contrast.

## Accessibility Requirements

- **Color contrast:** 4.5:1 for normal text, 3:1 for large (WCAG AA)
- **Focus indicators:** Visible outline (2px, brand-primary color)
- **Keyboard navigation:** All interactive elements reachable via Tab
- **ARIA labels:** Forms, icons, dynamic content
- **Semantic HTML:** `<button>`, `<form>`, `<label>`, `<nav>`, `<main>`, etc.
- **Reduced motion:** Respect `prefers-reduced-motion` media query
- **Error messages:** Linked to form fields via `aria-describedby`

## Component Implementation

Use **CSS Variables** for all theming. Implement components as:
1. Base CSS (variables, typography, layout)
2. React component (props, composition, accessibility)
3. Tests (rendering, interaction, a11y audit)

**Example Button Component:**

```typescript
// src/components/shared/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  disabled,
  ...props
}) => {
  return (
    <button
      className={`btn btn--${variant} btn--${size}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
};
```

**CSS:**

```css
.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 14px;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all var(--motion-fast);
  font-weight: 500;
}

.btn--primary {
  background-color: var(--color-brand-primary);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background-color: #0D4BB8;
  box-shadow: var(--shadow-md);
}

.btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Usage Guidelines

### When to Use Each Component

- **Button:** Discrete actions (save, delete, confirm)
- **Link:** Navigation, less prominent actions
- **Badge:** Status indicators, tags
- **Modal:** Critical decisions, form data entry
- **Toast:** Async feedback (API response, background task)
- **Skeleton:** Content loading
- **Empty state:** No results, guides user to next action

### Composition

Components compose: DataTable + Button + Badge + Modal. Build pages from smaller, well-tested pieces.

**Example Order List with Filtering & Actions:**

```jsx
<OrderListPage>
  <FilterBar
    filters={filters}
    onFilterChange={handleFilterChange}
  />
  
  <DataTable
    columns={columns}
    rows={orders}
    onSort={handleSort}
    isLoading={loading}
  >
    {orders.map(order => (
      <tr key={order.id}>
        <td>{order.orderNumber}</td>
        <td>{order.customerName}</td>
        <td>
          <Badge variant={statusColor[order.status]}>
            {order.status}
          </Badge>
        </td>
        <td className="actions">
          <Button variant="secondary" onClick={() => viewOrder(order.id)}>
            View
          </Button>
          {order.status === 'DRAFT' && (
            <Button variant="primary" onClick={() => openConfirmModal(order.id)}>
              Confirm
            </Button>
          )}
        </td>
      </tr>
    ))}
  </DataTable>

  <Modal isOpen={confirmModalOpen} onClose={closeConfirmModal}>
    <h2>Confirm Order?</h2>
    <p>This will reserve stock. Proceed?</p>
    <Button variant="primary" onClick={handleConfirm}>
      Confirm
    </Button>
    <Button variant="secondary" onClick={closeConfirmModal}>
      Cancel
    </Button>
  </Modal>
</OrderListPage>
```

## Theme Implementation

**Light mode (default):**
```css
:root {
  --color-brand-primary: #0F5FDB;
  --color-neutral-700: #444444;
  /* ... all tokens ... */
}
```

**Dark mode:**
```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-brand-primary: #5B9FFF;
    --color-neutral-700: #E8E8E8;
    /* ... all tokens ... */
  }
}
```

**Via React Context (for manual toggle):**
```typescript
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light') }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

## Next Steps

1. Implement design tokens (CSS variables)
2. Build component library (shared components)
3. Create Storybook for component documentation
4. Audit all pages against accessibility checklist
5. Test dark mode across all pages
