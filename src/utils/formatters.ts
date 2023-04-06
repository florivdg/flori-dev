/**
 * Format a date to a string.
 * @param date The date to format.
 * @param locale The locale to use. Defaults to 'en-US'.
 * @returns A nicely formatted date string.
 */
export function formatDate(date: Date, locale: string = 'en-US'): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }
  return new Intl.DateTimeFormat(locale, options).format(date)
}
