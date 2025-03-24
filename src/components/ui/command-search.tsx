
import * as React from "react";
import { useNavigate } from "react-router-dom";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { 
  Droplets, 
  Zap, 
  Factory, 
  Wind, 
  FileText, 
  AirVent, 
  Shield, 
  FolderKanban,
  Clock,
  Search,
  Home
} from 'lucide-react';

export interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem onSelect={() => handleNavigation("/")}>
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigation("/water-system")}>
            <Droplets className="mr-2 h-4 w-4 text-blue-500" />
            <span>Water System</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigation("/electricity-system")}>
            <Zap className="mr-2 h-4 w-4 text-amber-500" />
            <span>Electricity System</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Facilities">
          <CommandItem onSelect={() => handleNavigation("/stp")}>
            <Factory className="mr-2 h-4 w-4 text-green-500" />
            <span>STP Plant</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigation("/pumping-stations")}>
            <Wind className="mr-2 h-4 w-4 text-blue-500" />
            <span>Pumping Stations</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigation("/hvac")}>
            <AirVent className="mr-2 h-4 w-4 text-orange-500" />
            <span>HVAC/BMS</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Management">
          <CommandItem onSelect={() => handleNavigation("/contracts")}>
            <FileText className="mr-2 h-4 w-4 text-purple-500" />
            <span>Contracts</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigation("/projects")}>
            <FolderKanban className="mr-2 h-4 w-4 text-indigo-500" />
            <span>Projects</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigation("/alm")}>
            <Clock className="mr-2 h-4 w-4 text-sky-500" />
            <span>Asset Lifecycle</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigation("/admin")}>
            <Shield className="mr-2 h-4 w-4" />
            <span>Admin</span>
            <CommandShortcut>⌘A</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// Export the CommandSearch component as before
export function CommandSearch() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative w-full max-w-sm md:w-64 flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Search className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className="text-muted-foreground">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandMenu open={open} onOpenChange={setOpen} />
    </>
  );
}
