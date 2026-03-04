/**
 * Resolve a dot-separated i18n key like 'nav.reservations' against
 * the translation object.  Returns the string value or the key itself
 * as fallback.
 */
export function resolveI18nKey(t: Record<string, unknown>, key: string): string {
  const parts = key.split('.')
  let current: unknown = t
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return key // fallback to the key itself
    }
  }
  return typeof current === 'string' ? current : key
}
