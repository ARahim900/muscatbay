
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "muscat-bay-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement
    
    root.classList.remove("light", "dark")
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      
      root.classList.add(systemTheme)
      
      // Apply chart styles based on system theme
      applyChartStyles(systemTheme)
      return
    }
    
    root.classList.add(theme)
    
    // Apply chart styles based on selected theme
    applyChartStyles(theme)
  }, [theme])
  
  // Function to apply styles to charts based on theme
  const applyChartStyles = (activeTheme: string) => {
    // Add CSS for chart text color in dark mode
    const styleId = "chart-theme-styles";
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    if (activeTheme === 'dark') {
      styleElement.textContent = `
        .recharts-text {
          fill: #ffffff !important;
        }
        .recharts-cartesian-axis-line, .recharts-cartesian-axis-tick-line {
          stroke: #555555 !important;
        }
        .recharts-legend-item-text {
          color: #ffffff !important;
        }
        .recharts-tooltip-item-name, .recharts-tooltip-item-value {
          color: #f0f0f0 !important;
        }
        .recharts-default-tooltip {
          background-color: rgba(50, 50, 50, 0.9) !important;
          border-color: #555555 !important;
        }
        .recharts-tooltip-wrapper {
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3)) !important;
        }
        .recharts-reference-line line {
          stroke: #777777 !important;
        }
        .recharts-cartesian-grid line {
          stroke: #444444 !important;
        }
        .recharts-tooltip-cursor {
          stroke: #666666 !important;
        }
        .recharts-brush-texts {
          fill: #ffffff !important;
        }
        .recharts-sector {
          stroke: #333333 !important;
        }
      `;
    } else {
      styleElement.textContent = '';
    }
  };

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")
    
  return context
}
