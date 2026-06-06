# Retailr Frontend

Modern React frontend for the Retailr retail operations platform. Built with React 18, TypeScript, Vite, Redux Toolkit, and real-time WebSocket updates.

## Features

- **Real-Time Updates:** Live stock and order updates via WebSocket
- **Modern UI:** React 18 with TypeScript strict mode
- **State Management:** Redux Toolkit with slices
- **Styling:** CSS Modules with design tokens
- **Routing:** React Router v6
- **Forms:** Zod validation and error handling
- **Authentication:** JWT-based with secure token storage

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Backend services running (see main README)

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Server starts at `http://localhost:5173`

### Build

```bash
npm run build
```

Output: `frontend/dist/`

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## Environment Variables

Create `.env` or `.env.local`:

```
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

**Optional:**
- `VITE_API_TIMEOUT=30000` - Request timeout in ms (default: 30000)
- `VITE_LOG_LEVEL=info` - Log level (default: info)

## Project Structure

```
frontend/
├── src/
│   ├── api/              # Axios client and HTTP utilities
│   ├── components/       # Reusable UI components
│   │   ├── shared/       # Layout, DataTable, Forms
│   │   ├── products/     # Product-specific components
│   │   ├── orders/       # Order-specific components
│   │   └── stock/        # Stock-specific components
│   ├── hooks/            # Custom React hooks
│   │   ├── useWebSocketConnection.ts    # WebSocket lifecycle
│   │   ├── useStockSubscription.ts      # Stock real-time updates
│   │   ├── useOrderSubscription.ts      # Order real-time updates
│   │   └── usePagination.ts             # Pagination state
│   ├── pages/            # Page components (route handlers)
│   ├── routes/           # Route definitions
│   ├── store/            # Redux configuration
│   │   └── slices/       # Redux slices (auth, products, orders, etc.)
│   ├── styles/           # Global styles and design tokens
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   │   ├── websocketClient.ts    # WebSocket client wrapper
│   │   └── websocketTypes.ts     # WebSocket message types
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## Architecture

### State Management

Redux Toolkit slices manage application state:

- **authSlice:** User authentication and authorization
- **productsSlice:** Product catalog with real-time updates
- **ordersSlice:** Order data with real-time updates
- **stockSlice:** Inventory levels with real-time updates
- **rtSlice:** WebSocket connection state

### Real-Time Updates

WebSocket integration enables live updates:

1. **Connection:** `useWebSocketConnection()` hook manages global WebSocket lifecycle
2. **Subscription:** Domain hooks (`useStockSubscription`, `useOrderSubscription`) subscribe to STOMP topics
3. **Dispatch:** Redux actions merge incoming updates into store
4. **Rendering:** Components react to store changes via selectors

See [WebSocket Integration Guide](../docs/WEBSOCKET.md) for detailed documentation.

### API Integration

Axios client handles HTTP requests with:
- JWT authentication headers
- Request/response interceptors
- Error handling and retry logic
- CORS support

## WebSocket Real-Time Updates

### Quick Start

Enable real-time updates in any page component:

```typescript
import { useWebSocketConnection } from '@/hooks/useWebSocketConnection';
import { useStockSubscription } from '@/hooks/useStockSubscription';

export function StockListPage() {
  const { connected, error } = useWebSocketConnection();
  const { subscribed } = useStockSubscription();
  const stocks = useAppSelector(selectAllStockItems);

  return (
    <div>
      {connected && <span className="live">Live</span>}
      {subscribed && <span>Real-time updates active</span>}
      {error && <span className="error">{error}</span>}
      {/* Display stock data */}
    </div>
  );
}
```

### Connection Status

Check WebSocket status via hook:

```typescript
const { connected, connecting, error } = useWebSocketConnection();

// connected: boolean - WebSocket is ready
// connecting: boolean - Connection in progress
// error: string | null - Connection error message
```

Status indicator in header shows:
- **Green / "Live"** - Connected and receiving updates
- **Yellow / "Connecting..."** - Connection attempt in progress
- **Red / "Error"** - Connection failed or lost

### Automatic Reconnection

WebSocket client automatically reconnects with exponential backoff:

- Initial delay: 1 second
- Max delay: 30 seconds
- No user action required

### Messages Subscribed

**Stock Updates** (`/topic/stock-updates`):
```json
{
  "sku": "PROD-123",
  "warehouse": "WH-001",
  "quantity": 50,
  "reserved": 10,
  "timestamp": "2026-06-06T10:30:00Z"
}
```

**Order Updates** (`/topic/order-updates`):
```json
{
  "orderNumber": "ORD-12345",
  "status": "CONFIRMED",
  "customer": "John Doe",
  "total": 299.99,
  "timestamp": "2026-06-06T10:30:00Z"
}
```

### Troubleshooting

**Updates not appearing?**
1. Check header status indicator (should show "Live")
2. Open DevTools Network → WS filter to verify WebSocket connection
3. Check browser console for errors
4. Verify backend services are running

**Connection keeps dropping?**
1. Check network stability
2. Verify JWT token is valid
3. Check backend logs for errors
4. Try refreshing browser

See [WebSocket Troubleshooting](../docs/WEBSOCKET.md#troubleshooting) for detailed help.

## Design System

### Theme Tokens

CSS custom properties defined in `src/styles/theme/styles.css`:

```css
/* Colors */
--color-primary: #3b82f6;
--color-success: #10b981;
--color-warning: #f59e0b;
--color-error: #ef4444;

/* Spacing */
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;

/* Typography */
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
--font-size-lg: 1.125rem;
```

### Component Library

Shared components in `src/components/shared/`:

- **DataTable** - Paginated data display with sorting and actions
- **Modal** - Dialog container with backdrop
- **FormInput** - Text input with validation and error display
- **Skeleton** - Loading placeholder
- **Pagination** - Page navigation controls
- **SearchInput** - Debounced search field
- **Badge** - Status badges (OrderStatusBadge, etc.)

## Performance

### Code Splitting

Pages are lazy-loaded via React Router to reduce initial bundle size.

### Memoization

Components wrapped with `React.memo()` to prevent unnecessary re-renders where applicable.

### Redux Selectors

Selectors use `reselect` for memoization to optimize derived state.

### WebSocket Efficiency

- Messages debounced on client where applicable
- Only changed fields sent from server
- Payloads < 1KB per message
- Connection pooled across all components

## Testing

### Unit Tests

```bash
npm run test:watch
```

Tests in `src/**/*.test.ts(x)` use Vitest + React Testing Library.

### Type Checking

```bash
npm run typecheck
```

Ensures TypeScript strict mode compliance (no `any` types).

### Build Verification

```bash
npm run build
```

Verifies production build with zero errors.

## Deployment

### Build for Production

```bash
npm run build
```

### Environment Configuration

Set environment variables before deployment:

```bash
export VITE_API_URL=https://api.example.com
export VITE_WS_URL=wss://api.example.com
npm run build
```

### Serving

```bash
npm run preview
```

Or serve `dist/` directory with any static server.

### HTTPS/WSS

For production:
- Use `https://` for API URLs
- Use `wss://` for WebSocket (secure WebSocket)
- Ensure SSL certificates valid

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: Chrome, Safari (iOS 12+)

## Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite` | Start dev server |
| `build` | `tsc --noEmit && vite build` | Production build |
| `preview` | `vite preview` | Preview production build |
| `test:watch` | `vitest` | Run tests in watch mode |
| `typecheck` | `tsc --noEmit` | Type check without emitting |
| `lint` | `eslint src` | Lint TypeScript/React code |

## Related Documentation

- [WebSocket Integration](../docs/WEBSOCKET.md) - Real-time updates guide
- [Architecture](../docs/architecture.md) - System design
- [API Contract](../docs/api-contract.md) - REST API endpoints
- [Frontend Architecture](../docs/frontend-architecture.md) - React patterns and best practices

## Development Workflow

1. **Create feature branch:** `git checkout -b feature/my-feature`
2. **Start dev server:** `npm run dev`
3. **Develop with HMR:** Changes reflect instantly
4. **Run type check:** `npm run typecheck`
5. **Run lint:** `npm run lint`
6. **Commit changes:** `git commit -m "feat: description"`
7. **Push and open PR:** For code review

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
npm run typecheck
```

Check output for type errors and fix before committing.

### WebSocket Connection Issues

See [WebSocket Troubleshooting](../docs/WEBSOCKET.md#troubleshooting)

## Support

For questions or issues:
1. Check documentation links above
2. Review error messages in browser console
3. Check backend logs
4. Contact platform team
