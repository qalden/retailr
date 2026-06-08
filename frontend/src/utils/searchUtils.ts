/**
 * Pure utility functions for searching and tokenizing strings.
 * Zero external dependencies.
 */

/**
 * Convert a search string into lowercase tokens.
 * Handles multiple spaces, tabs, newlines.
 * Pure function with no side effects.
 */
export function tokenizeSearch(searchString: string): string[] {
  if (!searchString) {
    return [];
  }

  return searchString
    .trim()
    .toLowerCase()
    .split(/\s+/) // Split on any whitespace sequence
    .filter((token) => token.length > 0); // Remove empty strings
}

/**
 * Check if an object matches all search tokens across specified fields.
 * Implements AND logic for tokens and OR logic for fields.
 *
 * @param obj - The object to search in
 * @param tokens - Array of lowercase search tokens (all must match)
 * @param searchFields - Array of field names to search in (any can match per token)
 * @returns true if all tokens found in at least one field, false otherwise
 */
export function matchesSearch(
  obj: Record<string, unknown>,
  tokens: string[],
  searchFields: string[]
): boolean {
  // No tokens means match all
  if (tokens.length === 0) {
    return true;
  }

  // No fields to search means no match
  if (searchFields.length === 0) {
    return false;
  }

  // ALL tokens must match (AND logic)
  return tokens.every((token) => {
    // Normalize token to lowercase
    const normalizedToken = token.toLowerCase();

    // Token must be found in AT LEAST ONE field (OR logic)
    return searchFields.some((field) => {
      const fieldValue = obj[field];

      // Handle undefined or null
      if (fieldValue === undefined || fieldValue === null) {
        return false;
      }

      // Convert to string and check if it contains the token
      const fieldString = String(fieldValue).toLowerCase();
      return fieldString.includes(normalizedToken);
    });
  });
}
