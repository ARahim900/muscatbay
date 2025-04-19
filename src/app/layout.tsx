
import type { ReactNode } from 'react'
import './globals.css'

export const metadata = {
  title: 'Muscat Bay Asset Manager',
  description: 'Asset Management System for Muscat Bay',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
