import React, { useState, useEffect } from 'react';
import { ModeToggle } from '@/components/theme/theme-toggle';
import { Menu, Search, Bell, User, Zap, Droplets, CalendarRange, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandMenu } from '@/components/ui/command-search';
import { useIsMobile, useTouchDevice } from '@/hooks/use-mobile';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface TopNavbarProps {
  toggleMobileMenu: () => void;
  openEmbeddedApp?: (url: string, title: string) => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ toggleMobileMenu, openEmbeddedApp }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'System Update', message: 'STP monitoring system updated', read: false, time: '1h ago' },
    { id: 2, title: 'Maintenance Alert', message: 'Scheduled maintenance in 3 days', read: false, time: '3h ago' },
    { id: 3, title: 'High Water Usage', message: 'Unusual water consumption detected', read: true, time: '1d ago' },
  ]);
  
  const isMobile = useIsMobile();
  const isTouch = useTouchDevice();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };
  
  const handleNotificationClick = (id: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleLogoClick = () => {
    navigate('/');
  };
  
  const handleUtilityClick = (path: string) => {
    navigate(path);
  };
  
  const touchButtonClasses = isTouch ? "touch-manipulation min-h-[44px] min-w-[44px]" : "";

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 h-16 z-50 transition-all duration-200 ${
          isScrolled ? 'bg-background/90 backdrop-blur-sm border-b' : 'bg-background border-b'
        }`}
      >
        <div className="container flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMobileMenu}
              className={`lg:hidden ${touchButtonClasses}`}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div 
              className="flex items-center cursor-pointer" 
              onClick={handleLogoClick}
            >
              <img 
                src="/muscat-bay-logo.png" 
                alt="Muscat Bay Logo" 
                className="h-8 mr-3"
              />
              <span className="font-bold text-lg hidden md:inline-block">
                Asset Manager
              </span>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
              className="text-foreground/70 hover:text-foreground"
            >
              <Home className="w-4 h-4 mr-1.5" />
              Dashboard
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-foreground/70 hover:text-foreground"
                >
                  <Zap className="w-4 h-4 mr-1.5 text-amber-500" />
                  Utilities
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={() => handleUtilityClick('/electricity-system')}>
                  <Zap className="w-4 h-4 mr-2 text-amber-500" />
                  Electricity System
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUtilityClick('/water-system')}>
                  <Droplets className="w-4 h-4 mr-2 text-blue-500" />
                  Water System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="text-foreground/70 hover:text-foreground"
            >
              <CalendarRange className="w-4 h-4 mr-1.5" />
              Schedule
            </Button>
          </nav>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSearchOpen(true)}
              className={touchButtonClasses}
            >
              <Search className="h-[1.2rem] w-[1.2rem]" />
            </Button>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={`relative ${touchButtonClasses}`}>
                  <Bell className="h-[1.2rem] w-[1.2rem]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader className="pb-4">
                  <SheetTitle className="text-lg">Notifications</SheetTitle>
                  {notifications.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleMarkAllAsRead}
                      className="absolute right-8 top-4 text-xs"
                    >
                      Mark all as read
                    </Button>
                  )}
                </SheetHeader>
                
                <div className="space-y-4 mt-2">
                  {notifications.length > 0 ? (
                    notifications.map((note) => (
                      <div 
                        key={note.id}
                        className={`p-3 rounded-lg border ${note.read ? 'bg-background' : 'bg-primary/5'} cursor-pointer transition-colors hover:bg-muted/50`}
                        onClick={() => handleNotificationClick(note.id)}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className={`text-sm font-medium ${!note.read ? 'text-primary' : ''}`}>{note.title}</h4>
                          <span className="text-xs text-muted-foreground">{note.time}</span>
                        </div>
                        <p className="text-sm text-foreground/70 mt-1">{note.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p>No notifications</p>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={touchButtonClasses}>
                  <User className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <ModeToggle />
          </div>
        </div>
      </header>
      <CommandMenu open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
};

export default TopNavbar;
