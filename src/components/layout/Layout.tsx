
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
          collapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        {embeddedApp.isOpen ? (
          <div className="relative w-full h-[calc(100vh-4rem)]">
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
              <h2 className="text-lg font-medium text-muscat-primary">{embeddedApp.title}</h2>
              <button 
                onClick={closeEmbeddedApp}
                className="px-4 py-1 text-sm font-medium text-white transition-all rounded-md bg-muscat-primary hover:bg-opacity-90"
              >
                Return to Dashboard
              </button>
            </div>
            <iframe 
              src={embeddedApp.url} 
              className="w-full h-full pt-12 border-none" 
              title={embeddedApp.title}
            />
          </div>
        ) : (
          <div className="p-6">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};

export default Layout;
