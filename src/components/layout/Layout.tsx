
import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

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

  // Function to open an embedded application
  const openEmbeddedApp = (url: string, title: string) => {
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
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-white border-b shadow-sm">
              <h2 className="text-base sm:text-lg font-medium text-muscat-primary truncate">{embeddedApp.title}</h2>
              <button 
                onClick={closeEmbeddedApp}
                className="px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium text-white transition-all rounded-md bg-muscat-primary hover:bg-opacity-90 whitespace-nowrap ml-2"
              >
                Back to Dashboard
              </button>
            </div>
            <iframe 
              src={embeddedApp.url} 
              className="w-full h-full pt-12 border-none" 
              title={embeddedApp.title}
              style={{ width: '100%', height: 'calc(100% - 3rem)', border: 'none', marginTop: '3rem' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
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
