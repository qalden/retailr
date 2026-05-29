# ADR 002: Frontend State Management — Redux Toolkit + createAsyncThunk

**Date:** 2026-05-29  
**Status:** Accepted

## Context

We are building a data-dense retail operations frontend in React 18. The frontend must manage:
- Multiple entity types (Products, Orders, Customers, Stock, etc.)
- Pagination, filtering, sorting across list views
- Real-time updates (WebSocket stock and order changes)
- Loading, error, and empty states for async operations

The question: Redux Toolkit (with createAsyncThunk) or RTK Query?

## Options Considered

### Option 1: Redux Toolkit + createAsyncThunk (Chosen)
- **Pros:** 
  - Explicit, straightforward async flow (pending → fulfilled → rejected)
  - Normalized entity selectors with `createSelector` are proven patterns
  - Less boilerplate for simple CRUD
  - Easier to debug (plain Redux state transitions)
  - Better for WebSocket integration (dispatch actions directly to Redux state)
- **Cons:** 
  - Manual cache invalidation and pagination state
  - More code for advanced patterns (conditional fetches, polling)

### Option 2: RTK Query
- **Pros:** 
  - Automatic cache management with tags
  - Built-in cache invalidation
  - Handles refetching, polling, deduplication
  - Good for complex entity graphs with shared references
- **Cons:** 
  - Significant learning curve
  - More boilerplate for simple operations
  - Harder to integrate with WebSocket (RTK Query expects HTTP as source of truth)
  - Overkill for mostly read-heavy, tabular data

### Option 3: REST API Queries Only (No Redux)
- **Pros:** 
  - Minimal state management
  - Can use React Query (TanStack Query) for lightweight caching
- **Cons:** 
  - Loses benefits of normalized selectors
  - Harder to sync WebSocket updates with component state
  - Prop drilling for shared data across routes

## Decision

**Redux Toolkit + createAsyncThunk** for all server-cache state.

**Context API** for session (auth) and theme (smaller, transient state).

## Rationale

This domain is **mostly tabular CRUD + read-heavy dashboards**. RTK Query's automatic cache management and tag-based invalidation are overkill for:
- Simple product list (fetch all → filter/search client-side or server-side)
- Order list (fetch paginated list → no complex entity references)
- Stock levels (fetch list → update via WebSocket)

RTK Query shines when you have **complex entity graphs with shared references** (e.g., a note-taking app where each note has tags, comments, contributors — all nested and cross-referenced). That's not us.

**Why createAsyncThunk over RTK Query's createApi:**
1. **Simplicity:** `fetchProducts` → dispatch thunk → state updates. Easy to trace.
2. **WebSocket integration:** When stock updates arrive via WebSocket, we dispatch a Redux action directly (`dispatch(updateStockItem(update))`). With RTK Query, we'd fight the cache invalidation semantics.
3. **Normalized selectors:** `createSelector` gives us efficient derived state without extra libraries.
4. **Familiar pattern:** TDD on reducers and selectors is straightforward.

## Consequences

**Positive:**
- Clean separation: Redux for server data, Context for session
- WebSocket updates flow naturally into Redux
- Easy to test reducers and selectors in isolation
- Explicit state transitions (easier debugging)

**Negative:**
- Manual pagination state tracking (not a burden)
- Need to manage cache invalidation ourselves (reload list after POST, for example)
- More code than RTK Query for advanced patterns

## Migration Path

If we later discover heavy multi-entity mutations (e.g., collaborative editing), we can:
1. Run RTK Query alongside Redux (both can coexist)
2. Migrate high-traffic endpoints to RTK Query gradually
3. Keep Redux for session and UI state

But the default is **Redux Toolkit as primary state manager**.
