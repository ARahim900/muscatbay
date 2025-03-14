
import React from "react";
import { Moon, Sun } from "lucide-react";
import { Toggle } from "./toggle";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "icon-label";
}

export function ThemeToggle({ 
  className, 
  size = "md", 
  variant = "icon" 
}: ThemeToggleProps) {
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>("darkMode", false);
  
  React.useEffect(() => {
    // Update the document class when dark mode changes
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const sizes = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-10 w-10",
  };

  return (
    <Toggle
      aria-label="Toggle dark mode"
      pressed={isDarkMode}
      onPressedChange={toggleDarkMode}
      className={cn(
        "rounded-full bg-transparent border-none hover:bg-white/10 hover:text-white", 
        sizes[size], 
        className
      )}
    >
      {isDarkMode ? (
        <div className="flex items-center">
          <Moon className="h-4 w-4" />
          {variant === "icon-label" && (
            <span className="ml-2 text-sm">Dark</span>
          )}
        </div>
      ) : (
        <div className="flex items-center">
          <Sun className="h-4 w-4" />
          {variant === "icon-label" && (
            <span className="ml-2 text-sm">Light</span>
          )}
        </div>
      )}
    </Toggle>
  );
}
