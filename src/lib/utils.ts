
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Add the formatNumber function that was missing
export function formatNumber(num: number | string | undefined, decimals = 0) {
  if (num === undefined || num === null || num === "") return "";
  const numericValue = Number(num);
  if (isNaN(numericValue)) return "";
  return numericValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Add formatCurrency function
export function formatCurrency(amount: number | string, currency = "USD", decimals = 2) {
  if (amount === undefined || amount === null || amount === "") return "";
  const numericValue = Number(amount);
  if (isNaN(numericValue)) return "";
  
  // Format the currency based on the provided code
  if (currency === "OMR") {
    return `${formatNumber(numericValue, decimals)} ${currency}`;
  } else {
    return numericValue.toLocaleString(undefined, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
