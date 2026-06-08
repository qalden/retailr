import { describe, it, expect } from 'vitest';
import { tokenizeSearch, matchesSearch } from './searchUtils';

describe('searchUtils', () => {
  describe('tokenizeSearch', () => {
    it('should convert empty string to empty array', () => {
      const result = tokenizeSearch('');
      expect(result).toEqual([]);
    });

    it('should convert single word to array with one token', () => {
      const result = tokenizeSearch('iphone');
      expect(result).toEqual(['iphone']);
    });

    it('should convert multiple words to array of tokens', () => {
      const result = tokenizeSearch('iphone 12 pro');
      expect(result).toEqual(['iphone', '12', 'pro']);
    });

    it('should convert to lowercase', () => {
      const result = tokenizeSearch('iPhone 12 PRO');
      expect(result).toEqual(['iphone', '12', 'pro']);
    });

    it('should handle multiple spaces', () => {
      const result = tokenizeSearch('iphone    12');
      expect(result).toEqual(['iphone', '12']);
    });

    it('should trim leading and trailing whitespace', () => {
      const result = tokenizeSearch('  iphone 12  ');
      expect(result).toEqual(['iphone', '12']);
    });

    it('should handle tabs and newlines', () => {
      const result = tokenizeSearch('iphone\t12\npro');
      expect(result).toEqual(['iphone', '12', 'pro']);
    });

    it('should handle special characters in tokens', () => {
      const result = tokenizeSearch('iphone-12 pro+max');
      expect(result).toEqual(['iphone-12', 'pro+max']);
    });
  });

  describe('matchesSearch', () => {
    it('should return true when no search tokens provided', () => {
      const obj = { name: 'iPhone' };
      const result = matchesSearch(obj, [], ['name']);
      expect(result).toBe(true);
    });

    it('should match single token in single field', () => {
      const obj = { name: 'iPhone 12' };
      const result = matchesSearch(obj, ['iphone'], ['name']);
      expect(result).toBe(true);
    });

    it('should match single token case-insensitively', () => {
      const obj = { name: 'iPhone 12' };
      const result = matchesSearch(obj, ['IPHONE'], ['name']);
      expect(result).toBe(true);
    });

    it('should not match missing token', () => {
      const obj = { name: 'iPhone 12' };
      const result = matchesSearch(obj, ['samsung'], ['name']);
      expect(result).toBe(false);
    });

    it('should match multiple tokens (ALL must be present)', () => {
      const obj = { name: 'iPhone 12 Pro' };
      const result = matchesSearch(obj, ['iphone', '12'], ['name']);
      expect(result).toBe(true);
    });

    it('should require all tokens to match', () => {
      const obj = { name: 'iPhone 12' };
      const result = matchesSearch(obj, ['iphone', 'pro'], ['name']);
      expect(result).toBe(false);
    });

    it('should search across multiple fields with OR logic', () => {
      const obj = { name: 'iPhone', description: 'Apple Pro device' };
      const result = matchesSearch(obj, ['pro'], ['name', 'description']);
      expect(result).toBe(true);
    });

    it('should handle multiple fields with multiple tokens (AND token, OR fields)', () => {
      const obj = {
        name: 'iPhone',
        description: 'Apple Pro device',
        sku: '12345',
      };
      const tokens = ['apple', 'pro'];
      const result = matchesSearch(obj, tokens, ['name', 'description', 'sku']);
      // Both 'apple' and 'pro' are in description, so should match
      expect(result).toBe(true);
    });

    it('should handle numeric fields by converting to string', () => {
      const obj = { name: 'iPhone', id: 12345 };
      const result = matchesSearch(obj, ['12345'], ['name', 'id']);
      expect(result).toBe(true);
    });

    it('should handle undefined fields gracefully', () => {
      const obj = { name: 'iPhone' } as Record<string, unknown>;
      const result = matchesSearch(obj, ['test'], ['name', 'missing']);
      expect(result).toBe(false);
    });

    it('should handle null fields gracefully', () => {
      const obj = { name: 'iPhone', description: null };
      const result = matchesSearch(obj, ['test'], ['name', 'description']);
      expect(result).toBe(false);
    });

    it('should match partial tokens', () => {
      const obj = { name: 'iPhone 12 Pro' };
      const result = matchesSearch(obj, ['hon'], ['name']);
      expect(result).toBe(true);
    });

    it('should work with empty fields array', () => {
      const obj = { name: 'iPhone' };
      const result = matchesSearch(obj, ['iphone'], []);
      expect(result).toBe(false);
    });

    it('should handle complex search across domain models', () => {
      const product = {
        sku: 'SKU-001',
        name: 'iPhone 12 Pro',
        categoryName: 'Electronics',
        description: 'Latest Apple smartphone',
      };
      const searchTokens = ['iphone', 'apple'];
      const searchFields = ['sku', 'name', 'categoryName', 'description'];
      const result = matchesSearch(product, searchTokens, searchFields);
      expect(result).toBe(true);
    });
  });
});
