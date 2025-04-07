
import { createContext, useContext, ReactNode } from 'react';

// Water system color palette
export const waterColors = {
  primary: '#2563eb', // Main blue
  secondary: '#0ea5e9', // Light blue
  accent: '#38bdf8', // Sky blue
  warning: '#f59e0b', // Amber
  danger: '#ef4444', // Red
  success: '#10b981', // Green
  
  // Neutral colors
  background: '#f8fafc',
  card: '#ffffff',
  text: {
    primary: '#0f172a',
    secondary: '#64748b',
    muted: '#94a3b8',
  },
  
  // Chart colors
  chart: {
    blue: '#2563eb',
    lightBlue: '#60a5fa',
    green: '#10b981',
    amber: '#f59e0b',
    red: '#ef4444',
    purple: '#8b5cf6',
    teal: '#14b8a6',
    indigo: '#4f46e5',
  }
};

// Theme context for potential future theming support
const WaterThemeContext = createContext(waterColors);

export const useWaterTheme = () => useContext(WaterThemeContext);

export const WaterThemeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <WaterThemeContext.Provider value={waterColors}>
      {children}
    </WaterThemeContext.Provider>
  );
};
