
import React, { useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';
import Sidebar from './sidebar';
import { ArrowLeft, X, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface EmbeddedAppState {
  url: string;
  title: string;
  isOpen: boolean;
}

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(true); // Default to collapsed 
  const [mobileOpen, setMobileOpen] = useState(false);
  const [embeddedApp, setEmbeddedApp] = useState<EmbeddedAppState>({
    url: '',
    title: '',
    isOpen: false
  });
  const isMobileView = useIsMobile();
  const [iframeLoading, setIframeLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Auto-collapse sidebar on route change
  useEffect(() => {
    if (isMobileView) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobileView]);

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

  const openEmbeddedApp = (url: string, title: string) => {
    setIframeLoading(true);
    setEmbeddedApp({
      url,
      title,
      isOpen: true
    });
    
    if (isMobileView) {
      setMobileOpen(false);
    }
  };

  const closeEmbeddedApp = () => {
    setEmbeddedApp({
      ...embeddedApp,
      isOpen: false
    });
  };

  const handleIframeLoad = () => {
    setIframeLoading(false);
  };

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  // Calculate the left padding for the main content area
  const mainPadding = () => {
    if (isMobileView) return 'pl-0'; 
    if (collapsed) return 'pl-16 sm:pl-20';  
    return 'pl-16 sm:pl-64';
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar toggleSidebar={toggleMobileSidebar} />
      
      {/* Only render sidebar if it's visible */}
      {(mobileOpen || !isMobileView) && (
        <div ref={sidebarRef} className={`${isMobileView ? 'fixed z-50' : ''}`}>
          <Sidebar 
            collapsed={collapsed} 
            setCollapsed={setCollapsed} 
            openEmbeddedApp={openEmbeddedApp}
            mobileOpen={mobileOpen}
            isMobile={isMobileView}
          />
        </div>
      )}
      
      {/* Mobile backdrop overlay */}
      {mobileOpen && isMobileView && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      {/* Mobile toggle button */}
      {isMobileView && !mobileOpen && !embeddedApp.isOpen && (
        <button
          onClick={toggleMobileSidebar}
          className="fixed bottom-4 right-4 bg-muscat-primary text-white p-3 rounded-full shadow-lg z-40 animate-scale-in"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}
      
      <main 
        className={`pt-16 min-h-screen transition-all duration-300 ${mainPadding()}`}
      >
        {embeddedApp.isOpen ? (
          <div className="relative w-full h-[calc(100vh-4rem)]">
            {/* Hide the embedded app header on mobile to maximize space */}
            <div className="fixed top-16 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-white/80 backdrop-blur-sm border-b shadow-sm">
              <div className="flex items-center">
                <Button 
                  onClick={closeEmbeddedApp}
                  variant="ghost"
                  size="icon"
                  className="mr-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-sm md:text-base font-medium text-muscat-primary truncate">{embeddedApp.title}</h2>
              </div>
              <div className="flex items-center">
                <Button 
                  onClick={closeEmbeddedApp}
                  variant="default"
                  size="sm"
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
            
            {iframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-20" style={{ top: '3rem' }}>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-muscat-primary"></div>
              </div>
            )}
            
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
          <div className="px-2 sm:px-4 md:px-6 mx-auto w-full max-w-full overflow-x-hidden">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};

export default Layout;
