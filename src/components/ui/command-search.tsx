
import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";

interface SearchItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  url: string;
  icon?: React.ReactNode;
}

// These are the main navigation items you can search for
const navigationItems: SearchItem[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Main overview of all systems",
    category: "pages",
    url: "/",
  },
  {
    id: "electricity",
    name: "Electricity System",
    description: "Electricity usage and distribution",
    category: "utilities",
    url: "/electricity-system",
  },
  {
    id: "water",
    name: "Water System",
    description: "Water consumption and distribution",
    category: "utilities",
    url: "/water-system",
  },
  {
    id: "stp",
    name: "STP Plant",
    description: "Sewage treatment plant monitoring",
    category: "facilities",
    url: "/stp",
  },
  {
    id: "pumping",
    name: "Pumping Stations",
    description: "Water pumping facilities",
    category: "facilities",
    url: "/pumping-stations",
  },
  {
    id: "hvac",
    name: "HVAC/BMS",
    description: "Building management systems",
    category: "facilities",
    url: "/hvac",
  },
  {
    id: "alm",
    name: "Asset Lifecycle",
    description: "Asset lifecycle management",
    category: "management",
    url: "/alm",
  },
  {
    id: "contracts",
    name: "Contracts",
    description: "Contract management",
    category: "management",
    url: "/contracts",
  },
  {
    id: "projects",
    name: "Projects",
    description: "Project management",
    category: "management",
    url: "/projects",
  },
  {
    id: "admin",
    name: "Admin Panel",
    description: "Administrative controls",
    category: "management",
    url: "/admin",
  },
];

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative w-full flex items-center text-sm p-2 px-3 rounded-md border border-input bg-background hover:bg-accent transition-colors md:w-56 lg:w-64"
      >
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <span className="text-muted-foreground">Search... </span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-50">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput 
            placeholder="Search for pages, reports, charts..." 
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50" 
          />
          <button 
            onClick={() => setOpen(false)}
            className="ml-2 rounded-full p-1 hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Pages">
            {navigationItems
              .filter(item => item.category === "pages")
              .map(item => (
                <CommandItem
                  key={item.id}
                  onSelect={() => runCommand(() => navigate(item.url))}
                >
                  {item.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </CommandItem>
              ))}
          </CommandGroup>
          
          <CommandGroup heading="Utilities">
            {navigationItems
              .filter(item => item.category === "utilities")
              .map(item => (
                <CommandItem
                  key={item.id}
                  onSelect={() => runCommand(() => navigate(item.url))}
                >
                  {item.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </CommandItem>
              ))}
          </CommandGroup>
          
          <CommandGroup heading="Facilities">
            {navigationItems
              .filter(item => item.category === "facilities")
              .map(item => (
                <CommandItem
                  key={item.id}
                  onSelect={() => runCommand(() => navigate(item.url))}
                >
                  {item.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </CommandItem>
              ))}
          </CommandGroup>
          
          <CommandGroup heading="Management">
            {navigationItems
              .filter(item => item.category === "management")
              .map(item => (
                <CommandItem
                  key={item.id}
                  onSelect={() => runCommand(() => navigate(item.url))}
                >
                  {item.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
