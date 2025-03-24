import React, { useState } from 'react';
import { Bell, Settings, User, Menu, X, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useIsMobile } from '@/hooks/use-mobile';
import { CommandMenu } from '@/components/ui/command-search';

interface NavbarProps {
  toggleSidebar?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b bg-card dark:bg-card border-border backdrop-blur-md animate-fade-in shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center gap-2">
          {toggleSidebar && (
            <button
              onClick={toggleSidebar}
              className="p-2 mr-1 md:hidden rounded-full hover:bg-accent transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5 text-primary" />
            </button>
          )}
          <Link to="/" className="flex items-center">
            <img 
              alt="Muscat Bay Logo" 
              className="h-8 w-auto mr-2" 
              src="/lovable-uploads/a4c6f994-ae31-40c5-a0c0-0314f091a04d.jpg" 
              style={{ objectFit: 'contain' }}
            />
            <div className="text-lg md:text-xl font-semibold text-primary whitespace-nowrap">
              Muscat Bay <span className="hidden sm:inline ml-1 text-primary">Asset Manager</span>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          {searchOpen ? (
            <div className="fixed inset-0 pt-16 pb-4 px-4 bg-background/95 backdrop-blur-sm z-50 flex items-start justify-center md:relative md:inset-auto md:pt-0 md:pb-0 md:bg-transparent md:backdrop-blur-none md:z-auto md:block">
              <div className="w-full max-w-md relative md:w-auto">
                <CommandMenu />
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
              <button 
                onClick={() => setSearchOpen(true)} 
                className="p-2 transition-all rounded-full hover:bg-accent md:hidden touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Open search"
              >
                <User className="w-5 h-5 text-primary/80" />
              </button>
              <div className="relative hidden md:block">
                <CommandMenu />
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
              
              <button 
                className="p-2 transition-all rounded-full hover:bg-accent touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5 text-primary/80" />
              </button>
              
              <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-border">
                {user ? (
                  <>
                    <div className="hidden text-right md:block">
                      <p className="text-sm font-medium text-foreground">
                        {user.user_metadata.full_name || 'Muscat Bay User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <div className="relative group">
                      <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 overflow-hidden transition-all bg-primary/10 dark:bg-primary/20 rounded-full hover:ring-2 hover:ring-primary/20 touch-manipulation min-h-[44px] min-w-[44px]">
                        <User className="w-4 h-4 md:w-5 md:h-5 text-primary/80" />
                      </div>
                      <div className="absolute right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 bg-card rounded-md shadow-lg border border-border z-50">
                        <div className="py-2">
                          <button 
                            onClick={handleSignOut}
                            className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent/50 touch-manipulation min-h-[44px]"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
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

export default Navbar;
