
import { ThemeProvider } from '@/components/theme-provider'
import Dashboard from '@/components/dashboard'

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="muscat-bay-theme">
      <Dashboard />
    </ThemeProvider>
  )
}

export default App
