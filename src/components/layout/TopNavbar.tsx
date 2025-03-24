import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useIsMobile } from '@/hooks/use-mobile';
import { CommandSearch } from '@/components/ui/command-search';
import { 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  Menu,
  X,
  ChevronDown,
  Droplets,
  Zap,
  Factory,
  AirVent,
  FileText,
  Calendar,
  FolderKanban,
  Shield,
  Clock,
  Star
} from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopNavbarProps {
  toggleMobileMenu?: () => void;
  openEmbeddedApp?: (url: string, title: string) => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ toggleMobileMenu, openEmbeddedApp }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // External app URLs
  const externalApps = {
    electricity: "/electricity-system", // Changed to internal route
    stpPlant: "https://stp.lovable.app/", 
    pumpingStation: "https://muscat-bay-pumping-stations.lovable.app/", 
    hvac: "https://hvac0.lovable.app/", 
    contracts: "https://contracts-tracker.lovable.app/", 
    projects: "/projects", // Internal route
    security: "https://security-manager.lovable.app/", 
  };

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  const handleEmbeddedAppClick = (url: string, title: string) => {
    // If it's an internal route (starts with /), use navigate instead of embedded app
    if (url.startsWith('/')) {
      navigate(url);
    } else if (openEmbeddedApp) {
      openEmbeddedApp(url, title);
    }
  };

  const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a">
  >(({ className, title, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
              {children}
            </p>
          </a>
        </NavigationMenuLink>
      </li>
    );
  });
  ListItem.displayName = "ListItem";

  return (
    <header 
      className={cn(
        "fixed top-0 right-0 left-0 z-50 border-b bg-card/90 border-border backdrop-blur-md shadow-sm transition-all duration-300",
        scrolled ? "h-14 shadow-md" : "h-16"
      )}
    >
      <div className="container mx-auto flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-2">
          {isMobile && (
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-full hover:bg-accent transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5 text-primary" />
            </button>
          )}
          
          <Link to="/" className="flex items-center">
            <motion.img 
              alt="Muscat Bay Logo" 
              className="h-8 w-auto mr-2" 
              src="/lovable-uploads/a4c6f994-ae31-40c5-a0c0-0314f091a04d.jpg" 
              style={{ objectFit: 'contain' }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <div className={cn(
              "font-semibold text-primary whitespace-nowrap transition-all duration-300",
              scrolled ? "text-base md:text-lg" : "text-lg md:text-xl"
            )}>
              Muscat Bay <span className="hidden sm:inline ml-1 text-primary">Asset Manager</span>
            </div>
          </Link>
        </div>

        {!isMobile && (
          <div className="flex-1 mx-12">
            <NavigationMenu className="mx-auto">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-accent/50">
                    <Droplets className="w-4 h-4 mr-2 text-blue-500" />
                    Utilities
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 w-[400px] md:w-[500px] lg:w-[600px] grid-cols-2">
                      <ListItem
                        href="/water-system"
                        title="Water System"
                      >
                        <div className="flex items-center">
                          <Droplets className="w-4 h-4 mr-2 text-blue-500" />
                          Monitor water usage and distribution
                        </div>
                      </ListItem>
                      <ListItem
                        href="/electricity-system"
                        title="Electricity System"
                      >
                        <div className="flex items-center">
                          <Zap className="w-4 h-4 mr-2 text-amber-500" />
                          View electricity consumption data
                        </div>
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-accent/50">
                    <Factory className="w-4 h-4 mr-2 text-green-500" />
                    Facilities
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 w-[400px] md:w-[500px] lg:w-[600px] grid-cols-2">
                      <ListItem
                        onClick={() => handleEmbeddedAppClick(externalApps.stpPlant, "STP Plant")}
                        title="STP Plant"
                        className="cursor-pointer"
                      >
                        <div className="flex items-center">
                          <Factory className="w-4 h-4 mr-2 text-green-500" />
                          Sewage treatment plant monitoring
                        </div>
                      </ListItem>
                      <ListItem
                        onClick={() => handleEmbeddedAppClick(externalApps.pumpingStation, "Pumping Stations")}
                        title="Pumping Stations"
                        className="cursor-pointer"
                      >
                        <div className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4 mr-2 text-blue-500"
                          >
                            <path d="M3 17h4v-6H3v6z" />
                            <path d="M7 17h4V7H7v10z" />
                            <path d="M11 17h4v-6h-4v6z" />
                            <path d="M15 17h4V7h-4v10z" />
                            <path d="M5 11V9c0-1 1-2 3-2s3 1 3 2v2" />
                            <path d="M13 11V9c0-1 1-2 3-2s3 1 3 2v2" />
                          </svg>
                          Monitor performance and operational status
                        </div>
                      </ListItem>
                      <ListItem
                        onClick={() => handleEmbeddedAppClick(externalApps.hvac, "HVAC/BMS")}
                        title="HVAC/BMS"
                        className="cursor-pointer"
                      >
                        <div className="flex items-center">
                          <AirVent className="w-4 h-4 mr-2 text-orange-500" />
                          Building management systems
                        </div>
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-accent/50">
                    <FileText className="w-4 h-4 mr-2 text-muscat-primary" />
                    Management
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 w-[400px] md:w-[500px] lg:w-[600px] grid-cols-2">
                      <ListItem
                        onClick={() => handleEmbeddedAppClick(externalApps.contracts, "Contracts")}
                        title="Contracts"
                        className="cursor-pointer"
                      >
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-purple-500" />
                          Contract management and tracking
                        </div>
                      </ListItem>
                      <ListItem
                        href="/projects"
                        title="Projects"
                      >
                        <div className="flex items-center">
                          <FolderKanban className="w-4 h-4 mr-2 text-indigo-500" />
                          Project management and tracking
                        </div>
                      </ListItem>
                      <ListItem
                        href="/alm"
                        title="Asset Lifecycle"
                      >
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-sky-500" />
                          Manage asset lifecycle and maintenance
                        </div>
                      </ListItem>
                      <ListItem
                        onClick={() => handleEmbeddedAppClick(externalApps.security, "Security")}
                        title="Security"
                        className="cursor-pointer"
                      >
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 mr-2 text-red-500" />
                          Security monitoring and management
                        </div>
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/admin">
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        )}
        
        <div className="flex items-center gap-2 md:gap-3">
          {searchOpen ? (
            <div className="fixed inset-0 pt-16 pb-4 px-4 bg-background/95 backdrop-blur-sm z-50 flex items-start justify-center md:relative md:inset-auto md:pt-0 md:pb-0 md:bg-transparent md:backdrop-blur-none md:z-auto md:block">
              <div className="w-full max-w-md relative md:w-auto">
                <CommandSearch />
                <button 
                  onClick={() => setSearchOpen(false)} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-accent transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close search"
                >
                  <X className="w-4 h-4 text-primary/80" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative hidden md:block">
                <CommandSearch />
              </div>
            </>
          )}
          
          {!searchOpen && (
            <>
              <ThemeToggle />
              
              <button 
                className="relative p-2 transition-all rounded-full hover:bg-accent touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-primary/80" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-muscat-teal rounded-full"></span>
              </button>
              
              <div className="flex items-center pl-1 md:pl-2 border-l border-border">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 rounded-full p-1 transition-all hover:bg-accent/50 outline-none">
                        <Avatar className="h-8 w-8 border border-border">
                          <AvatarImage src={user.user_metadata?.avatar_url} />
                          <AvatarFallback className="bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden md:block text-left">
                          <p className="text-sm font-medium text-foreground">
                            {user.user_metadata?.full_name || 'Muscat Bay User'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {user.email}
                          </p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link 
                    to="/auth" 
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors touch-manipulation min-h-[44px] flex items-center"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
