import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { WaterDataProvider } from "@/context/water-data-context"
import { ElectricityDataProvider } from "@/context/electricity-data-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Muscat Bay Operations",
  description: "Muscat Bay Assets and Operations Management System",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <WaterDataProvider>
            <ElectricityDataProvider>{children}</ElectricityDataProvider>
          </WaterDataProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
