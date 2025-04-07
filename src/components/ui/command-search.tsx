
import * as React from "react";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  File,
  Zap,
  Droplets,
  Factory,
  Search,
  BarChart3,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";

export function CommandMenu({ open, onOpenChange }: { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const navigate = useNavigate();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (onOpenChange) {
          onOpenChange(true);
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onOpenChange]);

  if (!mounted) {
    return null;
  }

  const handleNavigate = (path: string) => {
    navigate(path);
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Utilities">
          <CommandItem onSelect={() => handleNavigate('/electricity-system')}>
            <Zap className="mr-2 h-4 w-4 text-amber-500" />
            <span>Electricity System</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/electricity-analytics')}>
            <BarChart3 className="mr-2 h-4 w-4 text-blue-500" />
            <span>Electricity Analytics</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/water-system')}>
            <Droplets className="mr-2 h-4 w-4 text-blue-500" />
            <span>Water System</span>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Facilities">
          <CommandItem onSelect={() => handleNavigate('/stp')}>
            <Factory className="mr-2 h-4 w-4 text-emerald-500" />
            <span>STP Plant</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/pumping-stations')}>
            <Droplets className="mr-2 h-4 w-4 text-blue-500" />
            <span>Pumping Stations</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/hvac')}>
            <Settings className="mr-2 h-4 w-4 text-orange-500" />
            <span>HVAC/BMS</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Management">
          <CommandItem onSelect={() => handleNavigate('/contracts')}>
            <File className="mr-2 h-4 w-4 text-gray-500" />
            <span>Contracts</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/projects')}>
            <CreditCard className="mr-2 h-4 w-4 text-purple-500" />
            <span>Projects</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/alm')}>
            <Calendar className="mr-2 h-4 w-4 text-indigo-500" />
            <span>Asset Lifecycle</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// Also export as CommandSearch for compatibility with other components
export { CommandMenu as CommandSearch };
