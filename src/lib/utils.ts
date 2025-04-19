
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatNumber = (num: string | number | undefined, decimals = 0) => {
  if (num === undefined || num === null || num === "") return ""
  const numericValue = Number(num)
  if (isNaN(numericValue)) return ""
  return numericValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export const formatCurrency = (amount: string | number | undefined, currency = "OMR", decimals = 2) => {
  if (amount === undefined || amount === null || amount === "") return ""
  const numericValue = Number(amount)
  if (isNaN(numericValue)) return ""
  return `${formatNumber(numericValue, decimals)} ${currency}`
}
