/**
 * Conditional class merge — same helper, same libraries and same semantics as
 * the web app's `lib/utils.ts`. Not imported from there because that module
 * also re-exports web-only formatting helpers.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
