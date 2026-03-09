// Converts camelCase keys to snake_case for database operations
export function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

// Converts snake_case keys to camelCase for frontend use
export function toCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

export function rowsToFrontend<T>(rows: Record<string, any>[]): T[] {
  return rows.map(r => toCamelCase(r) as T);
}

export function frontendToRow(obj: Record<string, any>): Record<string, any> {
  return toSnakeCase(obj);
}
