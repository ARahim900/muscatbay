
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme/theme-provider"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  // We only support light mode for this application
  return (
    <Button 
      variant="outline" 
      size="icon" 
      className="rounded-full w-10 h-10 transition-all duration-300 hover:bg-accent" 
      aria-label="Light mode"
      onClick={() => setTheme("light")}
    >
      <Sun className="h-5 w-5 text-amber-500" />
      <span className="sr-only">Light mode</span>
    </Button>
  )
}
