/**
 * Formats a date into the 'MMM-YY' format used in the application
 * @param date The date to format
 * @returns Formatted date string (e.g., 'Jan-25')
 */
export function formatDateToMonthYear(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const month = months[date.getMonth()]
  const year = date.getFullYear().toString().slice(-2)
  return `${month}-${year}`
}

/**
 * Gets the current month and year in the 'MMM-YY' format
 * @returns Current month-year string (e.g., 'Jan-25')
 */
export function getCurrentMonthYear(): string {
  return formatDateToMonthYear(new Date())
}

/**
 * Gets the previous month and year in the 'MMM-YY' format
 * @returns Previous month-year string (e.g., 'Dec-24')
 */
export function getPreviousMonthYear(): string {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  return formatDateToMonthYear(date)
}

/**
 * Converts a month name to its number (1-12)
 * @param month Month name (e.g., 'January', 'Jan')
 * @returns Month number (1-12)
 */
export function getMonthNumber(month: string): number {
  const months = {
    january: 1,
    jan: 1,
    february: 2,
    feb: 2,
    march: 3,
    mar: 3,
    april: 4,
    apr: 4,
    may: 5,
    june: 6,
    jun: 6,
    july: 7,
    jul: 7,
    august: 8,
    aug: 8,
    september: 9,
    sep: 9,
    october: 10,
    oct: 10,
    november: 11,
    nov: 11,
    december: 12,
    dec: 12,
  }

  return months[month.toLowerCase() as keyof typeof months] || 0
}

/**
 * Converts a month number to its name
 * @param monthNumber Month number (1-12)
 * @param format 'short' for 3-letter abbreviation, 'long' for full name
 * @returns Month name
 */
export function getMonthName(monthNumber: number, format: "short" | "long" = "short"): string {
  const months = {
    short: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    long: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
  }

  if (monthNumber < 1 || monthNumber > 12) {
    return ""
  }

  return months[format][monthNumber - 1]
}
