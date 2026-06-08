import { describe, it, expect } from 'vitest';
import { sortData } from './sortData';

describe('sortData', () => {
  describe('numeric sorting', () => {
    const data = [{ id: 1, price: 100 }, { id: 2, price: 50 }, { id: 3, price: 75 }];

    it('should sort numbers ascending', () => {
      const result = sortData(data, 'price', 'asc');
      expect(result).toEqual([
        { id: 2, price: 50 },
        { id: 3, price: 75 },
        { id: 1, price: 100 },
      ]);
    });

    it('should sort numbers descending', () => {
      const result = sortData(data, 'price', 'desc');
      expect(result).toEqual([
        { id: 1, price: 100 },
        { id: 3, price: 75 },
        { id: 2, price: 50 },
      ]);
    });
  });

  describe('string sorting', () => {
    const data = [
      { id: 1, name: 'Zebra' },
      { id: 2, name: 'apple' },
      { id: 3, name: 'Banana' },
    ];

    it('should sort strings ascending (case-insensitive)', () => {
      const result = sortData(data, 'name', 'asc');
      expect(result).toEqual([
        { id: 2, name: 'apple' },
        { id: 3, name: 'Banana' },
        { id: 1, name: 'Zebra' },
      ]);
    });

    it('should sort strings descending (case-insensitive)', () => {
      const result = sortData(data, 'name', 'desc');
      expect(result).toEqual([
        { id: 1, name: 'Zebra' },
        { id: 3, name: 'Banana' },
        { id: 2, name: 'apple' },
      ]);
    });
  });

  describe('null/undefined handling', () => {
    const data = [
      { id: 1, value: 100 },
      { id: 2, value: null },
      { id: 3, value: 50 },
      { id: 4, value: undefined },
    ];

    it('should place null/undefined at the end when ascending', () => {
      const result = sortData(data, 'value', 'asc');
      expect(result[0]).toEqual({ id: 3, value: 50 });
      expect(result[1]).toEqual({ id: 1, value: 100 });
      expect(result[2]).toEqual({ id: 2, value: null });
      expect(result[3]).toEqual({ id: 4, value: undefined });
    });

    it('should place null/undefined at the end when descending', () => {
      const result = sortData(data, 'value', 'desc');
      expect(result[0]).toEqual({ id: 1, value: 100 });
      expect(result[1]).toEqual({ id: 3, value: 50 });
      expect(result[2]).toEqual({ id: 2, value: null });
      expect(result[3]).toEqual({ id: 4, value: undefined });
    });
  });

  describe('immutability', () => {
    it('should not modify the original array', () => {
      const original = [{ id: 1, price: 100 }, { id: 2, price: 50 }];
      const originalCopy = JSON.parse(JSON.stringify(original));

      sortData(original, 'price', 'asc');

      expect(original).toEqual(originalCopy);
    });
  });

  describe('empty and single-element arrays', () => {
    it('should handle empty arrays', () => {
      const result = sortData([], 'price', 'asc');
      expect(result).toEqual([]);
    });

    it('should handle single-element arrays', () => {
      const data = [{ id: 1, price: 100 }];
      const result = sortData(data, 'price', 'asc');
      expect(result).toEqual([{ id: 1, price: 100 }]);
    });
  });
});
