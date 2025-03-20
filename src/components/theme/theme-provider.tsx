
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light" // Changed from "system" to "light" to ensure light mode is default
      enableSystem
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

// Fix the useTheme hook export
export function useTheme() {
  // Import the hook directly from next-themes to avoid context issues
  const { theme, setTheme } = React.useContext(NextThemesProvider.Context);
  return { theme, setTheme };
}
