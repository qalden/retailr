/**
 * Pure utility functions for URL parameter serialization and deserialization.
 * Zero external dependencies.
 */

import type { Filter } from './filterUtils';

export interface SortOption {
  field: string;
  order: 'asc' | 'desc';
}

export interface QueryParams {
  search: string;
  filters: Filter[];
  page: number;
  size: number;
  sort?: SortOption;
}

/**
 * Serialize QueryParams to a URL query string.
 * Pure function with no side effects.
 */
export function serializeParams(params: QueryParams): string {
  const searchParams = new URLSearchParams();

  // Serialize search
  searchParams.set('search', params.search);

  // Serialize filters as JSON array
  if (params.filters.length > 0) {
    searchParams.set('filters', JSON.stringify(params.filters));
  } else {
    searchParams.set('filters', '');
  }

  // Serialize pagination
  searchParams.set('page', String(params.page));
  searchParams.set('size', String(params.size));

  // Serialize sort if present
  if (params.sort) {
    searchParams.set('sort', JSON.stringify(params.sort));
  }

  return searchParams.toString();
}

/**
 * Deserialize a URL query string to QueryParams.
 * Pure function with no side effects.
 */
export function deserializeParams(queryString: string): QueryParams {
  const searchParams = new URLSearchParams(queryString);

  const search = searchParams.get('search') || '';

  // Parse filters
  let filters: Filter[] = [];
  const filtersStr = searchParams.get('filters');
  if (filtersStr && filtersStr.trim() !== '') {
    try {
      filters = JSON.parse(filtersStr) as Filter[];
    } catch {
      filters = [];
    }
  }

  // Parse pagination
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const size = Math.max(1, parseInt(searchParams.get('size') || '20', 10));

  // Parse sort
  let sort: SortOption | undefined;
  const sortStr = searchParams.get('sort');
  if (sortStr) {
    try {
      sort = JSON.parse(sortStr) as SortOption;
    } catch {
      sort = undefined;
    }
  }

  return {
    search,
    filters,
    page,
    size,
    ...(sort && { sort }),
  };
}
