export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function transformKeys<T>(obj: unknown, transformer: (key: string) => string): T {
  if (obj === null || obj === undefined) {
    return obj as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => transformKeys<T>(item, transformer)) as T;
  }
  
  if (isPlainObject(obj)) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const newKey = transformer(key);
      acc[newKey] = transformKeys(value, transformer);
      return acc;
    }, {} as Record<string, unknown>) as T;
  }
  
  return obj as T;
}

export function toCamelCase<T>(obj: unknown): T {
  return transformKeys<T>(obj, snakeToCamel);
}

export function toSnakeCase<T>(obj: unknown): T {
  return transformKeys<T>(obj, camelToSnake);
}
