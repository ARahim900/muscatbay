
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { useTheme as useNextTheme } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light" // Light mode is default
      enableSystem
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

// Export a custom useTheme hook that wraps the hook from next-themes
export function useTheme() {
  // Use the hook directly from next-themes instead of trying to access context
  const { theme, setTheme } = useNextTheme();
  return { theme, setTheme };
}
