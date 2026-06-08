import { describe, it, expect } from 'vitest';
import { serializeParams, deserializeParams, type QueryParams } from './queryParams';

describe('queryParams', () => {
  describe('serializeParams', () => {
    it('should serialize empty query params', () => {
      const params: QueryParams = {
        search: '',
        filters: [],
        page: 1,
        size: 20,
      };
      const result = serializeParams(params);
      expect(result).toBe('search=&filters=&page=1&size=20');
    });

    it('should serialize search term', () => {
      const params: QueryParams = {
        search: 'iphone',
        filters: [],
        page: 1,
        size: 20,
      };
      const result = serializeParams(params);
      expect(result).toContain('search=iphone');
    });

    it('should encode special characters in search', () => {
      const params: QueryParams = {
        search: 'iphone & samsung',
        filters: [],
        page: 1,
        size: 20,
      };
      const result = serializeParams(params);
      expect(result).toContain('search=iphone');
      // Should be URL encoded
      expect(result).toBeTruthy();
    });

    it('should serialize single filter', () => {
      const params: QueryParams = {
        search: '',
        filters: [
          {
            field: 'status',
            operator: 'equals',
            value: 'ACTIVE',
          },
        ],
        page: 1,
        size: 20,
      };
      const result = serializeParams(params);
      expect(result).toContain('filters=');
      expect(result).toContain('status');
      expect(result).toContain('equals');
      expect(result).toContain('ACTIVE');
    });

    it('should serialize multiple filters', () => {
      const params: QueryParams = {
        search: '',
        filters: [
          { field: 'status', operator: 'equals', value: 'ACTIVE' },
          { field: 'price', operator: 'gte', value: 100 },
        ],
        page: 1,
        size: 20,
      };
      const result = serializeParams(params);
      const filters = new URLSearchParams(result).get('filters');
      expect(filters).toBeTruthy();
    });

    it('should serialize pagination', () => {
      const params: QueryParams = {
        search: '',
        filters: [],
        page: 5,
        size: 50,
      };
      const result = serializeParams(params);
      expect(result).toContain('page=5');
      expect(result).toContain('size=50');
    });

    it('should serialize sort options', () => {
      const params: QueryParams = {
        search: '',
        filters: [],
        page: 1,
        size: 20,
        sort: { field: 'name', order: 'asc' },
      };
      const result = serializeParams(params);
      expect(result).toContain('sort');
    });
  });

  describe('deserializeParams', () => {
    it('should deserialize empty query string', () => {
      const result = deserializeParams('');
      expect(result.search).toBe('');
      expect(result.filters).toEqual([]);
      expect(result.page).toBe(1);
      expect(result.size).toBe(20);
    });

    it('should deserialize search term', () => {
      const result = deserializeParams('search=iphone&filters=&page=1&size=20');
      expect(result.search).toBe('iphone');
    });

    it('should deserialize encoded search term', () => {
      const encoded = serializeParams({
        search: 'iphone & samsung',
        filters: [],
        page: 1,
        size: 20,
      });
      const result = deserializeParams(encoded);
      expect(result.search).toBe('iphone & samsung');
    });

    it('should deserialize single filter', () => {
      const original: QueryParams = {
        search: '',
        filters: [{ field: 'status', operator: 'equals', value: 'ACTIVE' }],
        page: 1,
        size: 20,
      };
      const serialized = serializeParams(original);
      const result = deserializeParams(serialized);

      expect(result.filters).toHaveLength(1);
      expect(result.filters[0].field).toBe('status');
      expect(result.filters[0].operator).toBe('equals');
      expect(result.filters[0].value).toBe('ACTIVE');
    });

    it('should deserialize multiple filters', () => {
      const original: QueryParams = {
        search: '',
        filters: [
          { field: 'status', operator: 'equals', value: 'ACTIVE' },
          { field: 'price', operator: 'gte', value: 100 },
        ],
        page: 1,
        size: 20,
      };
      const serialized = serializeParams(original);
      const result = deserializeParams(serialized);

      expect(result.filters).toHaveLength(2);
      expect(result.filters[0].field).toBe('status');
      expect(result.filters[1].field).toBe('price');
    });

    it('should deserialize pagination', () => {
      const result = deserializeParams('page=5&size=50');
      expect(result.page).toBe(5);
      expect(result.size).toBe(50);
    });

    it('should use defaults for missing values', () => {
      const result = deserializeParams('search=test');
      expect(result.search).toBe('test');
      expect(result.filters).toEqual([]);
      expect(result.page).toBe(1);
      expect(result.size).toBe(20);
    });

    it('should deserialize sort options', () => {
      const original: QueryParams = {
        search: '',
        filters: [],
        page: 1,
        size: 20,
        sort: { field: 'name', order: 'desc' },
      };
      const serialized = serializeParams(original);
      const result = deserializeParams(serialized);

      expect(result.sort).toBeDefined();
      if (result.sort) {
        expect(result.sort.field).toBe('name');
        expect(result.sort.order).toBe('desc');
      }
    });

    it('should handle roundtrip serialization', () => {
      const original: QueryParams = {
        search: 'iphone',
        filters: [
          { field: 'status', operator: 'equals', value: 'ACTIVE' },
          { field: 'price', operator: 'gte', value: 500 },
        ],
        page: 2,
        size: 50,
        sort: { field: 'price', order: 'asc' },
      };

      const serialized = serializeParams(original);
      const deserialized = deserializeParams(serialized);

      expect(deserialized.search).toBe(original.search);
      expect(deserialized.page).toBe(original.page);
      expect(deserialized.size).toBe(original.size);
      expect(deserialized.filters).toHaveLength(original.filters.length);
      expect(deserialized.sort?.field).toBe(original.sort?.field);
      expect(deserialized.sort?.order).toBe(original.sort?.order);
    });
  });
});
