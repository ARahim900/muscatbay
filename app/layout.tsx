
import React from 'react'
import { ThemeProvider } from '@/components/theme-provider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Muscat Bay Asset Manager</title>
      </head>
      <body>
        <ThemeProvider defaultTheme="light" storageKey="theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
