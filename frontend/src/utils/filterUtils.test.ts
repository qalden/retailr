import { describe, it, expect } from 'vitest';
import { matchesFilter, applyFilters, type Filter } from './filterUtils';

describe('filterUtils', () => {
  describe('matchesFilter', () => {
    it('should match "equals" operator', () => {
      const filter: Filter = { field: 'status', operator: 'equals', value: 'ACTIVE' };
      const obj1 = { status: 'ACTIVE' };
      const obj2 = { status: 'INACTIVE' };

      expect(matchesFilter(obj1, filter)).toBe(true);
      expect(matchesFilter(obj2, filter)).toBe(false);
    });

    it('should match "contains" operator (case-insensitive)', () => {
      const filter: Filter = { field: 'name', operator: 'contains', value: 'phone' };
      const obj1 = { name: 'iPhone 12' };
      const obj2 = { name: 'Samsung Galaxy' };

      expect(matchesFilter(obj1, filter)).toBe(true);
      expect(matchesFilter(obj2, filter)).toBe(false);
    });

    it('should match "gte" operator', () => {
      const filter: Filter = { field: 'price', operator: 'gte', value: 100 };
      const obj1 = { price: 150 };
      const obj2 = { price: 100 };
      const obj3 = { price: 50 };

      expect(matchesFilter(obj1, filter)).toBe(true);
      expect(matchesFilter(obj2, filter)).toBe(true);
      expect(matchesFilter(obj3, filter)).toBe(false);
    });

    it('should match "lte" operator', () => {
      const filter: Filter = { field: 'price', operator: 'lte', value: 100 };
      const obj1 = { price: 50 };
      const obj2 = { price: 100 };
      const obj3 = { price: 150 };

      expect(matchesFilter(obj1, filter)).toBe(true);
      expect(matchesFilter(obj2, filter)).toBe(true);
      expect(matchesFilter(obj3, filter)).toBe(false);
    });

    it('should match "gt" operator', () => {
      const filter: Filter = { field: 'quantity', operator: 'gt', value: 10 };
      const obj1 = { quantity: 11 };
      const obj2 = { quantity: 10 };
      const obj3 = { quantity: 9 };

      expect(matchesFilter(obj1, filter)).toBe(true);
      expect(matchesFilter(obj2, filter)).toBe(false);
      expect(matchesFilter(obj3, filter)).toBe(false);
    });

    it('should match "lt" operator', () => {
      const filter: Filter = { field: 'quantity', operator: 'lt', value: 10 };
      const obj1 = { quantity: 9 };
      const obj2 = { quantity: 10 };
      const obj3 = { quantity: 11 };

      expect(matchesFilter(obj1, filter)).toBe(true);
      expect(matchesFilter(obj2, filter)).toBe(false);
      expect(matchesFilter(obj3, filter)).toBe(false);
    });

    it('should match "in" operator', () => {
      const filter: Filter = { field: 'status', operator: 'in', value: ['ACTIVE', 'PENDING'] };
      const obj1 = { status: 'ACTIVE' };
      const obj2 = { status: 'PENDING' };
      const obj3 = { status: 'INACTIVE' };

      expect(matchesFilter(obj1, filter)).toBe(true);
      expect(matchesFilter(obj2, filter)).toBe(true);
      expect(matchesFilter(obj3, filter)).toBe(false);
    });

    it('should return false for missing field', () => {
      const filter: Filter = { field: 'missing', operator: 'equals', value: 'value' };
      const obj = { status: 'ACTIVE' };

      expect(matchesFilter(obj, filter)).toBe(false);
    });

    it('should handle undefined values correctly', () => {
      const filter: Filter = { field: 'optional', operator: 'equals', value: 'value' };
      const obj = { optional: undefined };

      expect(matchesFilter(obj, filter)).toBe(false);
    });

    it('should handle null values correctly', () => {
      const filter: Filter = { field: 'nullable', operator: 'equals', value: null };
      const obj = { nullable: null };

      expect(matchesFilter(obj, filter)).toBe(true);
    });

    it('should handle numeric string comparisons', () => {
      const filter: Filter = { field: 'price', operator: 'gte', value: 100 };
      const obj = { price: '150' }; // string instead of number

      expect(matchesFilter(obj, filter)).toBe(true);
    });
  });

  describe('applyFilters', () => {
    const items = [
      { id: 1, name: 'iPhone', price: 999, status: 'ACTIVE' },
      { id: 2, name: 'Samsung', price: 799, status: 'ACTIVE' },
      { id: 3, name: 'Nokia', price: 199, status: 'INACTIVE' },
    ];

    it('should return all items when filters array is empty', () => {
      const result = applyFilters(items, []);
      expect(result).toEqual(items);
    });

    it('should apply single filter', () => {
      const filters: Filter[] = [{ field: 'status', operator: 'equals', value: 'ACTIVE' }];
      const result = applyFilters(items, filters);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it('should apply multiple filters with AND logic', () => {
      const filters: Filter[] = [
        { field: 'status', operator: 'equals', value: 'ACTIVE' },
        { field: 'price', operator: 'gte', value: 750 },
      ];
      const result = applyFilters(items, filters);

      expect(result).toHaveLength(2); // iPhone (999) and Samsung (799)
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it('should return empty array when no items match all filters', () => {
      const filters: Filter[] = [
        { field: 'status', operator: 'equals', value: 'ACTIVE' },
        { field: 'price', operator: 'lt', value: 100 },
      ];
      const result = applyFilters(items, filters);

      expect(result).toHaveLength(0);
    });

    it('should handle "contains" filter across multiple items', () => {
      const filters: Filter[] = [
        { field: 'name', operator: 'contains', value: 'phone' },
      ];
      const result = applyFilters(items, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should handle "in" filter across multiple items', () => {
      const filters: Filter[] = [
        { field: 'id', operator: 'in', value: [1, 3] },
      ];
      const result = applyFilters(items, filters);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(3);
    });

    it('should work with empty items array', () => {
      const filters: Filter[] = [{ field: 'status', operator: 'equals', value: 'ACTIVE' }];
      const result = applyFilters([], filters);

      expect(result).toHaveLength(0);
    });
  });
});
