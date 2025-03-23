
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
      forcedTheme="light" // Force light mode only
      enableSystem={false} // Disable system theme detection
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

// Export a custom useTheme hook that wraps the hook from next-themes
export function useTheme() {
  // Use the hook directly from next-themes instead of trying to access context
  const { setTheme } = useNextTheme();
  // Always return light as the theme
  return { theme: "light", setTheme };
}
