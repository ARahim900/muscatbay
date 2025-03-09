
import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main 
        className={`pt-16 min-h-screen transition-all duration-300 ${
          collapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
