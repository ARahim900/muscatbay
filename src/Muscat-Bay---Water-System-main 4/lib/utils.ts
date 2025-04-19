import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const formatNumber = (num: number | string | undefined, decimals = 0) => {
  if (num === undefined || num === null || num === "") return ""
  const numericValue = Number(num)
  if (isNaN(numericValue)) return ""
  return numericValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
