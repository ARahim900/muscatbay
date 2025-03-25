
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light" // Light mode is default
      forcedTheme="light" // Force light mode only
      enableSystem={false} // Disable system theme detection
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

// Custom hook for theme that doesn't use next-themes internally
// This avoids the hook usage error since we're forcing light mode anyway
export function useTheme() {
  // Return a fixed object without calling useTheme from next-themes
  return { 
    theme: "light", 
    setTheme: (theme: string) => {
      console.log(`Theme set to ${theme}, but we're in forced light mode`);
    } 
  };
}
