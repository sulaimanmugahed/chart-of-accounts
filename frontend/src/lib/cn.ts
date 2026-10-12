export type ClassValue = string | number | null | false | undefined

/** دمج أسماء الأصناف مع تجاهل القيم الفارغة */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
