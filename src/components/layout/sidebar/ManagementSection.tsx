
import React from 'react';
import { FolderKanban, Shield, Calendar } from 'lucide-react';
import SidebarLink from './SidebarLink';
import SidebarSection from './SidebarSection';
import { ContractIcon } from './CustomIcons';

interface ManagementSectionProps {
  collapsed?: boolean;
  isMobile?: boolean;
  openEmbeddedApp?: (url: string, title: string) => void;
  externalApps: {
    contracts: string;
    projects: string;
    security: string;
    [key: string]: string;
  };
}

const ManagementSection: React.FC<ManagementSectionProps> = ({ 
  collapsed,
  isMobile,
  openEmbeddedApp,
  externalApps
}) => {
  return (
    <SidebarSection title="Management" collapsed={collapsed} isMobile={isMobile}>
      <SidebarLink 
        to={externalApps.contracts} 
        icon={ContractIcon} 
        label="Contracts" 
        collapsed={collapsed} 
        external={true}
        openEmbedded={openEmbeddedApp}
        isMobile={isMobile}
      />
      <SidebarLink 
        to={externalApps.projects} 
        icon={FolderKanban} 
        label="Projects" 
        collapsed={collapsed} 
        external={false} 
        openEmbedded={openEmbeddedApp}
        isMobile={isMobile}
      />
      <SidebarLink 
        to="/alm" 
        icon={Calendar} 
        label="Asset Lifecycle" 
        collapsed={collapsed} 
        external={false}
        openEmbedded={openEmbeddedApp}
        isMobile={isMobile}
      />
      <SidebarLink 
        to={externalApps.security} 
        icon={Shield} 
        label="Security" 
        collapsed={collapsed} 
        external={true}
        openEmbedded={openEmbeddedApp}
        isMobile={isMobile}
      />
    </SidebarSection>
  );
};

export default ManagementSection;
