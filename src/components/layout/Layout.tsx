
import React, { useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { ArrowLeft, X, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmbeddedAppState {
  url: string;
  title: string;
  isOpen: boolean;
}

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [embeddedApp, setEmbeddedApp] = useState<EmbeddedAppState>({
    url: '',
    title: '',
    isOpen: false
  });
  const [isMobile, setIsMobile] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      if (isMobileView) {
        setCollapsed(true);
      } else {
        setMobileOpen(false);
      }
    };
    
    // Initial check
    checkIfMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup listener
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileOpen]);

  // Function to open an embedded application
  const openEmbeddedApp = (url: string, title: string) => {
    setIframeLoading(true);
    setEmbeddedApp({
      url,
      title,
      isOpen: true
    });
    
    // Close mobile sidebar when opening an app
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Function to close the embedded application
  const closeEmbeddedApp = () => {
    setEmbeddedApp({
      ...embeddedApp,
      isOpen: false
    });
  };

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIframeLoading(false);
  };

  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar toggleSidebar={toggleMobileSidebar} />
      
      <div ref={sidebarRef} className={`${isMobile ? 'fixed z-50' : ''}`}>
        <Sidebar 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
          openEmbeddedApp={openEmbeddedApp}
          mobileOpen={mobileOpen}
          isMobile={isMobile}
        />
      </div>
      
      {/* Mobile sidebar overlay */}
      {mobileOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      {/* Mobile menu toggle button (visible only when sidebar is collapsed) */}
      {isMobile && !mobileOpen && !embeddedApp.isOpen && (
        <button
          onClick={toggleMobileSidebar}
          className="fixed bottom-4 right-4 bg-muscat-primary text-white p-3 rounded-full shadow-lg z-40 animate-scale-in"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}
      
      <main 
        className={`pt-16 min-h-screen transition-all duration-300 ${
          (collapsed && !mobileOpen) ? 'pl-16 sm:pl-20' : !isMobile ? 'pl-16 sm:pl-64' : 'pl-0'
        }`}
      >
        {embeddedApp.isOpen ? (
          <div className="relative w-full h-[calc(100vh-4rem)]">
            {/* Enhanced header for embedded apps */}
            <div className="fixed top-16 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-white border-b shadow-sm">
              <div className="flex items-center">
                <Button 
                  onClick={closeEmbeddedApp}
                  variant="ghost"
                  size="icon"
                  className="mr-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-base sm:text-lg font-medium text-muscat-primary truncate">{embeddedApp.title}</h2>
              </div>
              <div className="flex items-center">
                <Button 
                  onClick={closeEmbeddedApp}
                  className="px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium text-white transition-all rounded-md bg-muscat-primary hover:bg-opacity-90 whitespace-nowrap"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
            
            {/* Loading indicator */}
            {iframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-20" style={{ top: '3rem' }}>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-muscat-primary"></div>
              </div>
            )}
            
            {/* Improved iframe container */}
            <div className="w-full h-full pt-12">
              <iframe 
                ref={iframeRef}
                src={embeddedApp.url} 
                className="w-full h-full border-none bg-white"
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
          <div className="px-3 sm:px-6 md:px-8 mx-auto max-w-7xl w-full">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};

export default Layout;
