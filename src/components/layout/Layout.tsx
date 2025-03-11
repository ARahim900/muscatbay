
import React, { useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { ArrowLeft, X } from 'lucide-react';
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
  const [embeddedApp, setEmbeddedApp] = useState<EmbeddedAppState>({
    url: '',
    title: '',
    isOpen: false
  });
  const [isMobile, setIsMobile] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup listener
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Function to open an embedded application
  const openEmbeddedApp = (url: string, title: string) => {
    setIframeLoading(true);
    setEmbeddedApp({
      url,
      title,
      isOpen: true
    });
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
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        openEmbeddedApp={openEmbeddedApp} 
      />
      
      <main 
        className={`pt-16 min-h-screen transition-all duration-300 ${
          collapsed ? 'pl-16 sm:pl-20' : 'pl-16 sm:pl-64'
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
          <div className="p-3 sm:p-6">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};

export default Layout;
