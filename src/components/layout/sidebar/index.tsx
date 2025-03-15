
import React from 'react';
import { Home, ChevronLeft, ChevronRight, X } from 'lucide-react';
import SidebarLink from './SidebarLink';
import SidebarFooter from './SidebarFooter';
import UtilitiesSection from './UtilitiesSection';
import FacilitiesSection from './FacilitiesSection';
import ManagementSection from './ManagementSection';

interface SidebarProps {
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  openEmbeddedApp?: (url: string, title: string) => void;
  mobileOpen?: boolean;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed = false, 
  setCollapsed,
  openEmbeddedApp,
  mobileOpen = false,
  isMobile = false
}) => {
  const toggleSidebar = () => {
    if (setCollapsed) {
      setCollapsed(!collapsed);
    }
  };
  
  const externalApps = {
    electricity: "https://electrical-muscatbay.lovable.app/",
    stpPlant: "https://stp.lovable.app/", 
    pumpingStation: "https://muscat-bay-pumping-stations.lovable.app/", 
    hvac: "https://hvac0.lovable.app/", 
    contracts: "https://contracts-tracker.lovable.app/", 
    projects: "/projects", // Internal route
    security: "https://security-manager.lovable.app/", 
  };
  
  const sidebarWidth = isMobile 
    ? 'w-72' 
    : collapsed 
      ? 'w-16 md:w-20'
      : 'w-64';
  
  if (isMobile && !mobileOpen) {
    return null; // Don't render sidebar on mobile when closed
  }
  
  return (
    <aside 
      className={`${isMobile ? 'fixed' : 'fixed'} top-0 left-0 z-40 h-screen transition-all duration-300 bg-muscat-primary 
        ${sidebarWidth} pt-16 ${isMobile ? 'animate-slide-in shadow-lg' : ''}`}
    >
      <div className="relative flex flex-col h-full">
        {isMobile ? (
          <button 
            onClick={() => setCollapsed && setCollapsed(true)}
            className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 text-white bg-muscat-primary/50 rounded-full"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={toggleSidebar}
            className="absolute top-2 -right-3 flex items-center justify-center w-6 h-6 text-white bg-muscat-primary rounded-full shadow-md"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? 
              <ChevronRight className="w-4 h-4" /> : 
              <ChevronLeft className="w-4 h-4" />
            }
          </button>
        )}
        
        <div className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
          <div className="mb-6">
            <SidebarLink to="/" icon={Home} label="Dashboard" collapsed={collapsed} isMobile={isMobile} />
          </div>
          
          <UtilitiesSection 
            collapsed={collapsed} 
            isMobile={isMobile} 
            openEmbeddedApp={openEmbeddedApp} 
          />
          
          <FacilitiesSection 
            collapsed={collapsed} 
            isMobile={isMobile} 
            openEmbeddedApp={openEmbeddedApp} 
            externalApps={externalApps} 
          />
          
          <ManagementSection 
            collapsed={collapsed} 
            isMobile={isMobile} 
            openEmbeddedApp={openEmbeddedApp} 
            externalApps={externalApps} 
          />
        </div>
        
        <SidebarFooter collapsed={collapsed} isMobile={isMobile} />
      </div>
    </aside>
  );
};

export default Sidebar;
