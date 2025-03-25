
import React from 'react';
import SidebarSection from './SidebarSection';
import SidebarLink from './SidebarLink';
import { Calendar, FileBarChart } from 'lucide-react';
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
        iconColor="amber-500"
        bgColor="amber-100"
      />
      <SidebarLink 
        to={externalApps.projects || "/projects"} 
        icon={FolderKanbanIcon} 
        label="Projects" 
        collapsed={collapsed} 
        external={!!externalApps.projects && externalApps.projects !== "/projects"}
        openEmbedded={openEmbeddedApp}
        isMobile={isMobile}
        iconColor="teal-500"
        bgColor="teal-100"
      />
      <SidebarLink 
        to="/alm" 
        icon={Calendar} 
        label="Asset Lifecycle" 
        collapsed={collapsed}
        isMobile={isMobile}
        iconColor="cyan-500"
        bgColor="cyan-100"
      />
      <SidebarLink 
        to={externalApps.reports || "/reports"} 
        icon={FileBarChart} 
        label="Reports Management" 
        collapsed={collapsed} 
        external={!!externalApps.reports}
        openEmbedded={openEmbeddedApp}
        isMobile={isMobile}
        iconColor="red-500"
        bgColor="red-100"
      />
    </SidebarSection>
  );
};

export default ManagementSection;
