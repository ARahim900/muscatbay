import React, { useState, useEffect, useRef } from 'react';
import AppNavbar from './AppNavbar';
import MobileMenu from './MobileMenu';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useIsMobile, useTouchDevice } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { ArrowLeft, X, Menu, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import NewHeader from './NewHeader';

interface EmbeddedAppState {
  url: string;
  title: string;
  isOpen: boolean;
}

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isSidebarOpen } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [embeddedApp, setEmbeddedApp] = useState<EmbeddedAppState>({
    url: '',
    title: '',
    isOpen: false
  });
  const isMobile = useIsMobile();
  const isTouch = useTouchDevice();
  const [iframeLoading, setIframeLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMobileMenuOpen(false);
    
    if (location.pathname.startsWith('/') && embeddedApp.isOpen) {
      setEmbeddedApp({
        url: '',
        title: '',
        isOpen: false
      });
    }
  }, [location.pathname]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const openEmbeddedApp = (url: string, title: string) => {
    if (url.startsWith('/')) {
      navigate(url);
      return;
    }
    
    setIframeLoading(true);
    setEmbeddedApp({
      url,
      title,
      isOpen: true
    });
    
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const closeEmbeddedApp = () => {
    setEmbeddedApp({
      ...embeddedApp,
      isOpen: false
    });
    
    toast.success("Returned to dashboard");
  };

  const goToHome = () => {
    closeEmbeddedApp();
    navigate('/');
  };

  const handleIframeLoad = () => {
    setIframeLoading(false);
  };

  const touchButtonClasses = isTouch ? "touch-manipulation min-h-[44px] min-w-[44px]" : "";

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden transition-colors duration-150">
      <NewHeader />
      
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <MobileMenu 
              isOpen={mobileMenuOpen} 
              onClose={() => setMobileMenuOpen(false)} 
              openEmbeddedApp={openEmbeddedApp}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className={`pt-16 min-h-screen w-full max-w-[1800px] mx-auto transition-all duration-300 ${
        isSidebarOpen ? 'md:ml-64' : ''
      }`}>
        {embeddedApp.isOpen ? (
          <div className="relative w-full h-[calc(100vh-4rem)]">
            <div className="fixed top-16 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-card dark:bg-card/80 backdrop-blur-sm border-b shadow-sm border-border">
              <div className="flex items-center">
                <Button 
                  onClick={closeEmbeddedApp}
                  variant="ghost"
                  size="icon"
                  className={`mr-2 ${touchButtonClasses}`}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-sm md:text-base font-medium text-primary truncate">{embeddedApp.title}</h2>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={goToHome}
                  variant="outline"
                  size="sm"
                  className={`text-xs sm:text-sm whitespace-nowrap flex items-center ${isTouch ? "min-h-[44px]" : ""}`}
                >
                  <Home className="h-3.5 w-3.5 mr-1.5" />
                  Home
                </Button>
                <Button 
                  onClick={toggleMobileMenu}
                  variant="default"
                  size="sm"
                  className={`text-xs sm:text-sm whitespace-nowrap ${isTouch ? "min-h-[44px]" : ""}`}
                >
                  <Menu className="h-3.5 w-3.5 mr-1.5" />
                  Menu
                </Button>
              </div>
            </div>
            
            {iframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 dark:bg-background/70 z-20" style={{ top: '3rem' }}>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            )}
            
            <div className="w-full h-full pt-12">
              <iframe 
                ref={iframeRef}
                src={embeddedApp.url} 
                className="w-full h-full border-none bg-white dark:bg-gray-900"
                title={embeddedApp.title}
                onLoad={handleIframeLoad}
                style={{ 
                  width: '100%', 
                  height: 'calc(100vh - 7rem)',
                  border: 'none',
                  display: 'block'
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals"
              />
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="px-2 sm:px-6 md:px-8 mx-auto w-full max-w-full"
          >
            {children}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Layout;
