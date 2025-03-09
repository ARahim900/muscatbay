
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Droplet, 
  Zap, 
  Factory, 
  PumpingStation, 
  FileContract, 
  Thermometer, 
  FolderKanban, 
  Shield, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Create a custom PumpingStation icon since it doesn't exist in lucide
const PumpingStation = (props: React.SVGProps<SVGSVGElement>) => (
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

// Create a FileContract icon since it doesn't exist in lucide
const FileContract = (props: React.SVGProps<SVGSVGElement>) => (
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
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon: Icon, label, collapsed }) => {
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
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, setCollapsed }) => {
  const toggleSidebar = () => {
    if (setCollapsed) {
      setCollapsed(!collapsed);
    }
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
            <SidebarLink to="/water" icon={Droplet} label="Water Management" collapsed={collapsed} />
            <SidebarLink to="/electricity" icon={Zap} label="Electricity" collapsed={collapsed} />
          </div>
          
          <div className="mb-2">
            <h3 className={`text-xs font-semibold uppercase text-white/50 ${collapsed ? 'text-center' : 'px-4'}`}>
              {collapsed ? '—' : 'Facilities'}
            </h3>
          </div>
          <div className="space-y-1 mb-6">
            <SidebarLink to="/stp-plant" icon={Factory} label="STP Plant" collapsed={collapsed} />
            <SidebarLink to="/pumping-station" icon={PumpingStation} label="Pumping Stations" collapsed={collapsed} />
            <SidebarLink to="/hvac" icon={Thermometer} label="HVAC/BMS" collapsed={collapsed} />
          </div>
          
          <div className="mb-2">
            <h3 className={`text-xs font-semibold uppercase text-white/50 ${collapsed ? 'text-center' : 'px-4'}`}>
              {collapsed ? '—' : 'Management'}
            </h3>
          </div>
          <div className="space-y-1">
            <SidebarLink to="/contracts" icon={FileContract} label="Contracts" collapsed={collapsed} />
            <SidebarLink to="/projects" icon={FolderKanban} label="Projects" collapsed={collapsed} />
            <SidebarLink to="/security" icon={Shield} label="Security" collapsed={collapsed} />
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
