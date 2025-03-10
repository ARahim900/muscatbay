import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Droplet, 
  Zap, 
  Factory, 
  Wind, 
  FileText, 
  Thermometer, 
  FolderKanban, 
  Shield, 
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react';

const PumpStationIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 17h4v-6H3v6z" />
    <path d="M7 17h4V7H7v10z" />
    <path d="M11 17h4v-6h-4v6z" />
    <path d="M15 17h4V7h-4v10z" />
    <path d="M5 11V9c0-1 1-2 3-2s3 1 3 2v2" />
    <path d="M13 11V9c0-1 1-2 3-2s3 1 3 2v2" />
  </svg>
);

const ContractIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
    <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
    <path d="M9 17h6" />
    <path d="M9 13h6" />
    <path d="M13 9H9" />
  </svg>
);

interface SidebarLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  collapsed?: boolean;
  external?: boolean;
  openEmbedded?: (url: string, title: string) => void;
  options?: { label: string; url: string; isGitHub?: boolean }[];
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ 
  to, 
  icon: Icon, 
  label, 
  collapsed, 
  external, 
  openEmbedded,
  options
}) => {
  const [showOptions, setShowOptions] = useState(false);
  
  const handleEmbeddedClick = (e: React.MouseEvent, url: string = to, title: string = label) => {
    if (external && openEmbedded) {
      e.preventDefault();
      openEmbedded(url, title);
      if (options) {
        setShowOptions(false);
      }
    }
  };

  const handleOptionClick = (e: React.MouseEvent, option: { url: string; label: string; isGitHub?: boolean }) => {
    e.preventDefault();
    e.stopPropagation();
    if (option.isGitHub) {
      window.open(option.url, '_blank');
    } else if (external && openEmbedded) {
      openEmbedded(option.url, option.label);
    }
    setShowOptions(false);
  };
  
  const toggleOptions = (e: React.MouseEvent) => {
    if (options && options.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      setShowOptions(!showOptions);
    }
  };

  if (external) {
    return (
      <div className="relative">
        <a
          href={to}
          className={`sidebar-link ${collapsed ? 'justify-center px-0' : ''}`}
          onClick={options && options.length > 0 ? toggleOptions : (e) => handleEmbeddedClick(e)}
        >
          <Icon className="flex-shrink-0 w-5 h-5" />
          {!collapsed && (
            <>
              <span className="flex-1">{label}</span>
              {options && options.length > 0 && (
                <ChevronRight className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-90' : ''}`} />
              )}
            </>
          )}
        </a>
        
        {!collapsed && showOptions && options && options.length > 0 && (
          <div className="pl-10 mt-1 space-y-1">
            {options.map((option, index) => (
              <a
                key={index}
                href={option.url}
                className="flex items-center py-2 px-4 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                onClick={(e) => handleOptionClick(e, option)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                <span>{option.label}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) => 
        `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
      }
    >
      <Icon className="flex-shrink-0 w-5 h-5" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
};

interface SidebarProps {
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  openEmbeddedApp?: (url: string, title: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed = false, 
  setCollapsed,
  openEmbeddedApp
}) => {
  const toggleSidebar = () => {
    if (setCollapsed) {
      setCollapsed(!collapsed);
    }
  };
  
  const externalApps = {
    water: {
      main: "https://water-dashboard-24.lovable.app/",
      options: [
        { label: "Water Dashboard 2024", url: "https://water-dashboard-24.lovable.app/", isGitHub: false },
        { label: "Water Dashboard 2025", url: "https://water-dashboard-25.lovable.app/", isGitHub: false }
      ]
    },
    electricity: "https://electrical-muscatbay.lovable.app/",
    stpPlant: "https://stp.lovable.app/",
    pumpingStation: "https://muscat-bay-pumping-stations.lovable.app/", 
    hvac: "https://hvac0.lovable.app/", 
    contracts: "https://contracts-tracker.lovable.app/", 
    projects: "https://projects-manager.lovable.app/", 
    security: "https://security-manager.lovable.app/", 
  };
  
  return (
    <aside 
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-muscat-primary 
        ${collapsed ? 'w-20' : 'w-64'} pt-16`}
    >
      <div className="relative flex flex-col h-full">
        <button 
          onClick={toggleSidebar}
          className="absolute top-2 -right-3 flex items-center justify-center w-6 h-6 text-white bg-muscat-primary rounded-full shadow-md"
        >
          {collapsed ? 
            <ChevronRight className="w-4 h-4" /> : 
            <ChevronLeft className="w-4 h-4" />
          }
        </button>
        
        <div className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="mb-6">
            <SidebarLink to="/" icon={Home} label="Dashboard" collapsed={collapsed} />
          </div>
          
          <div className="mb-2">
            <h3 className={`text-xs font-semibold uppercase text-white/50 ${collapsed ? 'text-center' : 'px-4'}`}>
              {collapsed ? '—' : 'Utilities'}
            </h3>
          </div>
          <div className="space-y-1 mb-6">
            <SidebarLink 
              to={externalApps.water.main} 
              icon={Droplet} 
              label="Water Management" 
              collapsed={collapsed} 
              external={true}
              openEmbedded={openEmbeddedApp}
              options={externalApps.water.options}
            />
            <SidebarLink 
              to={externalApps.electricity} 
              icon={Zap} 
              label="Electricity" 
              collapsed={collapsed} 
              external={true}
              openEmbedded={openEmbeddedApp}
            />
          </div>
          
          <div className="mb-2">
            <h3 className={`text-xs font-semibold uppercase text-white/50 ${collapsed ? 'text-center' : 'px-4'}`}>
              {collapsed ? '—' : 'Facilities'}
            </h3>
          </div>
          <div className="space-y-1 mb-6">
            <SidebarLink 
              to={externalApps.stpPlant} 
              icon={Factory} 
              label="STP Plant" 
              collapsed={collapsed} 
              external={true}
              openEmbedded={openEmbeddedApp}
            />
            <SidebarLink 
              to={externalApps.pumpingStation} 
              icon={Wind} 
              label="Pumping Stations" 
              collapsed={collapsed} 
              external={true}
              openEmbedded={openEmbeddedApp}
            />
            <SidebarLink 
              to={externalApps.hvac} 
              icon={Thermometer} 
              label="HVAC/BMS" 
              collapsed={collapsed} 
              external={true}
              openEmbedded={openEmbeddedApp}
            />
          </div>
          
          <div className="mb-2">
            <h3 className={`text-xs font-semibold uppercase text-white/50 ${collapsed ? 'text-center' : 'px-4'}`}>
              {collapsed ? '—' : 'Management'}
            </h3>
          </div>
          <div className="space-y-1">
            <SidebarLink 
              to={externalApps.contracts} 
              icon={FileText} 
              label="Contracts" 
              collapsed={collapsed} 
              external={true}
              openEmbedded={openEmbeddedApp}
            />
            <SidebarLink 
              to={externalApps.projects} 
              icon={FolderKanban} 
              label="Projects" 
              collapsed={collapsed} 
              external={true}
              openEmbedded={openEmbeddedApp}
            />
            <SidebarLink 
              to={externalApps.security} 
              icon={Shield} 
              label="Security" 
              collapsed={collapsed} 
              external={true}
              openEmbedded={openEmbeddedApp}
            />
          </div>
        </div>
        
        <div className={`p-4 border-t border-white/10 ${collapsed ? 'text-center' : ''}`}>
          <p className="text-xs text-white/60">
            {collapsed ? 'v1.0' : 'Muscat Bay Asset Manager v1.0'}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
