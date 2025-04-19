// Primary color and derived shades
export const primaryColor = "#4E4456"
export const primaryLight = "#6A5D73"
export const primaryLighter = "#8A7B94"
export const primaryDark = "#3D3543"
export const primaryDarker = "#2C2631"

// Theme configuration with modern styling
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
    text: "text-slate-100", // Brightened from text-slate-100
    textSecondary: "text-slate-300", // Brightened from text-slate-400
    shadow: "shadow-lg shadow-slate-950/30",
    primary: primaryColor,
    primaryLight: primaryLight,
    primaryLighter: primaryLighter,
    primaryDark: primaryDark,
    primaryDarker: primaryDarker,
    secondary: "#a5b4cb", // Brightened
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#60a5fa", // Brightened
    chartColors: {
      l1Color: primaryColor,
      l2Color: "#10b981",
      l3Color: "#a78bfa", // Brightened
      dcColor: "#fbbf24", // Brightened
      lossColor: "#f87171", // Brightened
      l2dcColor: "#34d399", // Brightened
      l3dcColor: "#a78bfa", // Brightened
      bgGrid: "#475569",
    },
    zoneColors: [
      "#60a5fa", // Blue - Brightened
      "#34d399", // Green - Brightened
      "#fbbf24", // Amber - Brightened
      "#f87171", // Red - Brightened
      "#a78bfa", // Purple - Brightened
      "#f472b6", // Pink - Brightened
    ],
    typeColors: [
      "#60a5fa", // Blue - Brightened
      "#34d399", // Green - Brightened
      "#fbbf24", // Amber - Brightened
      "#a78bfa", // Purple - Brightened
      "#f472b6", // Pink - Brightened
      "#2dd4bf", // Teal - Brightened
      "#f87171", // Red - Brightened
    ],
  },
}
