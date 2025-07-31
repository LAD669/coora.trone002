/**
 * Generates a safe unique key for React list rendering
 * @param item - The item object that may contain id or user_id
 * @param index - The array index as fallback
 * @param prefix - Optional prefix for the fallback key
 * @returns A unique string key
 */
export const getSafeKey = (
  item: { id?: string; user_id?: string; email?: string } | null | undefined,
  index: number,
  prefix: string = 'item'
): string => {
  if (!item) {
    return `${prefix}-index-${index}`;
  }

  // Try item.id first
  if (item.id) {
    return item.id;
  }

  // Try item.user_id second
  if (item.user_id) {
    return item.user_id;
  }

  // Try item.email as fallback
  if (item.email) {
    return `${prefix}-${item.email}`;
  }

  // Final fallback with index
  return `${prefix}-index-${index}`;
}; 