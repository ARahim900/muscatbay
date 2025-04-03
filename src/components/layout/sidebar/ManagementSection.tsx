
import React from 'react';
import { FileCog, FileSpreadsheet, Calculator, CreditCard, Database } from 'lucide-react';
import SidebarSection from './SidebarSection';
import SidebarLink, { SidebarLinkProps } from './SidebarLink';

interface ManagementSectionProps {
  collapsed?: boolean;
  isMobile?: boolean;
  openEmbeddedApp?: (url: string, title: string) => void;
  externalApps?: {
    [key: string]: string;
  };
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
    >
      <SidebarLink 
        to="/contracts" 
        icon={FileCog} 
        label="Contracts" 
        collapsed={collapsed} 
        isMobile={isMobile} 
      />
      <SidebarLink 
        to="/operating-expenses" 
        icon={FileSpreadsheet} 
        label="Operating Expenses" 
        collapsed={collapsed} 
        isMobile={isMobile} 
      />
      <SidebarLink 
        to="/service-charges" 
        icon={Calculator} 
        label="Service Charges" 
        collapsed={collapsed} 
        isMobile={isMobile} 
      />
      <SidebarLink 
        to="/asset-reserve-fund" 
        icon={Database} 
        label="Asset Reserve Fund" 
        collapsed={collapsed} 
        isMobile={isMobile} 
      />
      <SidebarLink 
        to="/reports" 
        icon={CreditCard} 
        label="Financial Reports" 
        collapsed={collapsed} 
        isMobile={isMobile} 
      />
    </SidebarSection>
  );
};

export default ManagementSection;
