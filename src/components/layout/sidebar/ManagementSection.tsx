
import React from 'react';
import SidebarSection from './SidebarSection';
import SidebarLink from './SidebarLink';
import { Shield, Calendar } from 'lucide-react';
import { ContractIcon, FolderKanbanIcon } from './CustomIcons';

interface ManagementSectionProps {
  collapsed?: boolean;
  isMobile?: boolean;
  openEmbeddedApp?: (url: string, title: string) => void;
  externalApps?: Record<string, string>;
}

const ManagementSection: React.FC<ManagementSectionProps> = ({
  collapsed = false,
  isMobile = false,
  openEmbeddedApp,
  externalApps = {}
}) => {
  return (
    <SidebarSection 
      title="Management" 
      collapsed={collapsed} 
      isMobile={isMobile}
    >
      <SidebarLink 
        to={externalApps.contracts || "/"} 
        icon={ContractIcon} 
        label="Contracts" 
        collapsed={collapsed} 
        external={!!externalApps.contracts}
        openEmbedded={openEmbeddedApp}
        isMobile={isMobile}
      />
      <SidebarLink 
        to={externalApps.projects || "/projects"} 
        icon={FolderKanbanIcon} 
        label="Projects" 
        collapsed={collapsed} 
        external={!!externalApps.projects && externalApps.projects !== "/projects"}
        openEmbedded={openEmbeddedApp}
        isMobile={isMobile}
      />
      <SidebarLink 
        to="/alm" 
        icon={Calendar} 
        label="Asset Lifecycle" 
        collapsed={collapsed}
        isMobile={isMobile}
      />
      <SidebarLink 
        to="/admin" 
        icon={Shield} 
        label="Admin Panel" 
        collapsed={collapsed}
        isMobile={isMobile}
      />
      <SidebarLink 
        to={externalApps.security || "/"} 
        icon={Shield} 
        label="Security" 
        collapsed={collapsed} 
        external={!!externalApps.security}
        openEmbedded={openEmbeddedApp}
        isMobile={isMobile}
      />
    </SidebarSection>
  );
};

export default ManagementSection;
