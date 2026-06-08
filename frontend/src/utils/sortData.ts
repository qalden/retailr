/**
 * Pure utility function for sorting data arrays.
 * Zero external dependencies.
 */

/**
 * Sort an array of objects by a specified field and order.
 * Handles null/undefined values by placing them at the end.
 * Pure function with no side effects.
 *
 * @param data - The array to sort
 * @param field - The field name to sort by
 * @param order - Sort direction: 'asc' for ascending, 'desc' for descending
 * @returns A new sorted array (original is not modified)
 */
export function sortData<T>(
  data: T[],
  field: string,
  order: 'asc' | 'desc'
): T[] {
  const sorted = [...data];
  sorted.sort((a, b) => {
    const aVal = (a as any)[field];
    const bVal = (b as any)[field];

    // Handle null/undefined: place them at the end
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    // Handle string comparison (case-insensitive)
    if (typeof aVal === 'string') {
      const aStr = aVal.toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return order === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    }

    // Handle numeric comparison
    return order === 'asc' ? aVal - bVal : bVal - aVal;
  });

  return sorted;
}

export default sortData;
