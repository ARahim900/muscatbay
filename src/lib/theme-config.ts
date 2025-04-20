
// Primary color and derived shades
export const primaryColor = "#4E4456"
export const primaryLight = "#6A5D73"
export const primaryLighter = "#8A7B94"
export const primaryDark = "#3D3543"
export const primaryDarker = "#2C2631"

// Theme configuration object
export const themeConfig = {
  primary: '#0088FE',
  secondary: '#00C49F',
  accent: '#FFBB28',
  danger: '#FF8042',
  success: '#82CA9D',
  warning: '#FFBB28',
  info: '#6A7FDB',
  
  text: '#1A1A1A',
  textSecondary: '#666666',
  
  border: 'border-gray-200',
  cardBg: 'bg-white',
  panelBg: 'bg-gray-100',
  
  // Dark mode values can be added as well
  dark: {
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    border: 'border-gray-700',
    cardBg: 'bg-gray-800',
    panelBg: 'bg-gray-900',
  }
};

// Export themes for compatibility with existing code
export const themes = {
  light: {
    bg: "bg-gray-50",
    cardBg: "bg-white",
    panelBg: "bg-gray-100",
    border: "border-gray-200",
    text: "text-gray-900",
    textSecondary: "text-gray-600",
    shadow: "shadow-md",
    primary: primaryColor,
    primaryLight: primaryLight,
    primaryLighter: primaryLighter,
    primaryDark: primaryDark,
    primaryDarker: primaryDarker,
    secondary: "#6b7280",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#3b82f6",
    chartColors: {
      l1Color: primaryColor,
      l2Color: "#10b981",
      l3Color: "#8b5cf6",
      dcColor: "#f59e0b",
      lossColor: "#ef4444",
      l2dcColor: "#059669",
      l3dcColor: "#7c3aed",
      bgGrid: "#e5e7eb",
    },
    zoneColors: [
      "#2563eb", // Blue
      "#10b981", // Green
      "#f59e0b", // Amber
      "#ef4444", // Red
      "#8b5cf6", // Purple
      "#ec4899", // Pink
    ],
    typeColors: [
      "#2563eb", // Blue
      "#10b981", // Green
      "#f59e0b", // Amber
      "#8b5cf6", // Purple
      "#ec4899", // Pink
      "#14b8a6", // Teal
      "#ef4444", // Red
    ],
  },
  dark: {
    // Enhanced dark theme
    bg: "bg-slate-900",
    cardBg: "bg-slate-800",
    panelBg: "bg-slate-700",
    border: "border-slate-600",
    text: "text-slate-100", 
    textSecondary: "text-slate-300", 
    shadow: "shadow-lg shadow-slate-950/30",
    primary: primaryColor,
    primaryLight: primaryLight,
    primaryLighter: primaryLighter,
    primaryDark: primaryDark,
    primaryDarker: primaryDarker,
    secondary: "#a5b4cb", 
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#60a5fa", 
    chartColors: {
      l1Color: primaryColor,
      l2Color: "#10b981",
      l3Color: "#a78bfa", 
      dcColor: "#fbbf24", 
      lossColor: "#f87171", 
      l2dcColor: "#34d399", 
      l3dcColor: "#a78bfa", 
      bgGrid: "#475569",
    },
    zoneColors: [
      "#60a5fa", 
      "#34d399", 
      "#fbbf24", 
      "#f87171", 
      "#a78bfa", 
      "#f472b6", 
    ],
    typeColors: [
      "#60a5fa", 
      "#34d399", 
      "#fbbf24", 
      "#a78bfa", 
      "#f472b6", 
      "#2dd4bf", 
      "#f87171", 
    ],
  },
};
