import { Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme/theme-provider"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  // This component is now simplified to just show the light mode icon
  // We keep it to avoid breaking any layouts, but it doesn't actually toggle themes
  return (
    <Button variant="ghost" size="icon" className="rounded-full" aria-label="Light mode" disabled>
      <Sun className="h-5 w-5" />
      <span className="sr-only">Light mode</span>
    </Button>
  )
}
