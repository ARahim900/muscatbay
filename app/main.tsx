
import React from 'react'
import ReactDOM from 'react-dom/client'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import RootLayout from './layout'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="theme">
      <RootLayout />
    </ThemeProvider>
  </React.StrictMode>,
)
