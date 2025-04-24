
/**
 * Theme configuration for Muscat Bay operations web application
 */

export const themeConfig = {
  colors: {
    // Primary palette
    primary: "#4285F4", // Blue
    secondary: "#34A853", // Green
    accent: "#FBBC05", // Yellow
    destructive: "#EA4335", // Red
    
    // Entity-specific colors
    water: {
      primary: "#4285F4", // Blue
      accent: "#0F9D58" // Dark Green
    },
    electricity: {
      primary: "#F4B400", // Amber
      accent: "#DB4437" // Red
    },
    stp: {
      primary: "#0F9D58", // Green
      accent: "#4285F4" // Blue
    },
    property: {
      primary: "#744DA9", // Purple
      accent: "#F24822" // Orange
    },
    
    // Chart colors
    chart: [
      "#4285F4", // Blue
      "#34A853", // Green
      "#FBBC05", // Yellow
      "#EA4335", // Red
      "#8884d8", // Purple
      "#82ca9d", // Teal
      "#ff7300", // Orange
      "#a05195", // Magenta
      "#003f5c" // Navy
    ]
  },
  
  // Border radiuses
  radius: {
    sm: "0.125rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    full: "9999px"
  },
  
  // Shadows
  shadow: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
  },
  
  // Typography
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    headings: {
      fontWeight: "600",
      lineHeight: "1.2"
    },
    body: {
      fontWeight: "400",
      lineHeight: "1.5"
    }
  },
  
  // Transitions
  transition: {
    default: "all 0.2s ease",
    slow: "all 0.3s ease",
    fast: "all 0.1s ease"
  }
};

// Additional themes (dark, light, etc.)
export const themes = {
  light: {
    ...themeConfig,
    background: "#ffffff",
    text: "#333333",
    border: "#e5e7eb",
    muted: "#f3f4f6"
  },
  dark: {
    ...themeConfig,
    background: "#1f2937",
    text: "#f3f4f6",
    border: "#374151",
    muted: "#374151"
  }
};
