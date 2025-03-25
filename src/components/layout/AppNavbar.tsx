
import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Search, 
  Bell, 
  User, 
  Settings, 
  Menu, 
  Zap, 
  Droplets, 
  Factory, 
  ThermometerSun, 
  FileText, 
  Briefcase, 
  Calendar, 
  ChevronDown, 
  LogOut,
  FileBarChart
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { CommandMenu } from '@/components/ui/command-search';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useIsMobile, useTouchDevice } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface NavbarProps {
  toggleSidebar?: () => void;
  toggleMobileMenu?: () => void;
}

const AppNavbar: React.FC<NavbarProps> = ({ toggleSidebar, toggleMobileMenu }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const isTouch = useTouchDevice();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes('electricity') || location.pathname.includes('water')) {
      setActiveSection('utilities');
    } else if (location.pathname.includes('stp') || location.pathname.includes('pump') || location.pathname.includes('hvac')) {
      setActiveSection('facilities');
    } else if (location.pathname.includes('contracts') || location.pathname.includes('projects') || 
               location.pathname.includes('alm') || location.pathname.includes('admin')) {
      setActiveSection('management');
    } else {
      setActiveSection('dashboard');
    }
  }, [location.pathname]);

  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDropdownToggle = (dropdown: string) => {
    if (activeDropdown === dropdown) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(dropdown);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  const closeDropdowns = () => {
    setActiveDropdown(null);
  };

  const navigateTo = (path: string) => {
    navigate(path);
    closeDropdowns();
  };

  const touchButtonClasses = isTouch ? "touch-manipulation min-h-[44px] min-w-[44px]" : "";

  const utilityItems = [
    { name: 'Electricity System', icon: <Zap className="w-4 h-4 text-amber-500" />, path: '/electricity-system' },
    { name: 'Water System', icon: <Droplets className="w-4 h-4 text-blue-500" />, path: '/water-system' }
  ];

  const facilityItems = [
    { name: 'STP Plant', icon: <Factory className="w-4 h-4 text-emerald-500" />, path: '/stp' },
    { name: 'Pumping Stations', icon: <Droplets className="w-4 h-4 text-blue-500" />, path: '/pumping-stations' },
    { name: 'HVAC/BMS', icon: <ThermometerSun className="w-4 h-4 text-orange-500" />, path: '/hvac' }
  ];

  const managementItems = [
    { name: 'Contracts', icon: <FileText className="w-4 h-4 text-gray-500" />, path: '/contracts' },
    { name: 'Projects', icon: <Briefcase className="w-4 h-4 text-purple-500" />, path: '/projects' },
    { name: 'Asset Lifecycle', icon: <Calendar className="w-4 h-4 text-indigo-500" />, path: '/alm' },
    { name: 'Reports Management', icon: <FileBarChart className="w-4 h-4 text-red-500" />, path: '/reports' }
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 h-16 z-40 ${isScrolled ? 'bg-background/90 backdrop-blur-sm' : 'bg-background'} border-b transition-all duration-200`}>
      <div className="container flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {toggleMobileMenu && (
            <button
              onClick={toggleMobileMenu}
              className={`p-2 lg:hidden rounded-full hover:bg-accent transition-colors ${touchButtonClasses}`}
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          
          <Link to="/" className="flex items-center">
            <img 
              alt="Muscat Bay Logo" 
              className="h-8 w-auto mr-2" 
              src="/lovable-uploads/a4c6f994-ae31-40c5-a0c0-0314f091a04d.jpg" 
            />
            <span className="font-bold text-lg hidden sm:inline-block">Asset Manager</span>
          </Link>
        </div>
        
        <nav className="hidden lg:flex items-center space-x-1">
          <Link 
            to="/" 
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              activeSection === 'dashboard' 
                ? 'bg-accent text-accent-foreground' 
                : 'text-foreground/70 hover:text-foreground hover:bg-accent/50'
            }`}
          >
            <Home className="w-4 h-4 mr-1.5" />
            Dashboard
          </Link>
          
          <div className="relative">
            <button 
              onClick={() => handleDropdownToggle('utilities')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeSection === 'utilities' 
                  ? 'bg-accent text-accent-foreground' 
                  : 'text-foreground/70 hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Zap className="w-4 h-4 mr-1.5 text-amber-500" />
              Utilities
              <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${activeDropdown === 'utilities' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'utilities' && (
              <div className="absolute top-full left-0 w-56 mt-1 bg-background border rounded-md shadow-lg z-50">
                {utilityItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigateTo(item.path)}
                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-accent/50 text-left"
                  >
                    {item.icon}
                    <span className="ml-2">{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="relative">
            <button 
              onClick={() => handleDropdownToggle('facilities')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeSection === 'facilities' 
                  ? 'bg-accent text-accent-foreground' 
                  : 'text-foreground/70 hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Factory className="w-4 h-4 mr-1.5 text-emerald-500" />
              Facilities
              <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${activeDropdown === 'facilities' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'facilities' && (
              <div className="absolute top-full left-0 w-56 mt-1 bg-background border rounded-md shadow-lg z-50">
                {facilityItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigateTo(item.path)}
                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-accent/50 text-left"
                  >
                    {item.icon}
                    <span className="ml-2">{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="relative">
            <button 
              onClick={() => handleDropdownToggle('management')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeSection === 'management' 
                  ? 'bg-accent text-accent-foreground' 
                  : 'text-foreground/70 hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Briefcase className="w-4 h-4 mr-1.5 text-muscat-primary" />
              Management
              <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${activeDropdown === 'management' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'management' && (
              <div className="absolute top-full left-0 w-56 mt-1 bg-background border rounded-md shadow-lg z-50">
                {managementItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigateTo(item.path)}
                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-accent/50 text-left"
                  >
                    {item.icon}
                    <span className="ml-2">{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
        </nav>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={() => setIsSearchOpen(true)} 
            className={`p-2 transition-all rounded-full hover:bg-accent ${touchButtonClasses}`}
            aria-label="Search"
          >
            <Search className="h-[1.2rem] w-[1.2rem]" />
          </button>
          
          <button 
            className={`relative p-2 transition-all rounded-full hover:bg-accent ${touchButtonClasses}`}
            aria-label="Notifications"
          >
            <Bell className="h-[1.2rem] w-[1.2rem]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <ThemeToggle />
          
          <div className="relative group">
            <button 
              className={`flex items-center justify-center w-8 h-8 overflow-hidden transition-all bg-primary/10 rounded-full hover:ring-2 hover:ring-primary/20 ${touchButtonClasses}`}
              aria-label="User menu"
            >
              <User className="w-4 h-4 text-primary/80" />
            </button>
            <div className="absolute right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 bg-card rounded-md shadow-lg border z-50">
              <div className="py-2">
                {user && (
                  <>
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium text-foreground">
                        {user.user_metadata?.full_name || 'Muscat Bay User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent/50 touch-manipulation min-h-[44px]"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </button>
                  </>
                )}
                {!user && (
                  <Link 
                    to="/auth" 
                    className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent/50"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <CommandMenu open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  );
};

export default AppNavbar;
