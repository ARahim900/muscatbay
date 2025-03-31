
import React from 'react';
import { Calculator } from 'lucide-react';
import SidebarSection from './SidebarSection';
import SidebarLink, { SidebarLinkProps } from './SidebarLink';

interface CalculatorSectionProps {
  collapsed?: boolean;
  isMobile?: boolean;
  openEmbeddedApp?: (url: string, title: string) => void;
  externalApps?: {
    [key: string]: string;
  };
}

const CalculatorSection: React.FC<CalculatorSectionProps> = ({ 
  collapsed = false, 
  isMobile = false,
  openEmbeddedApp,
  externalApps = {}
}) => {
  return (
    <SidebarSection
      title="Calculator"
      collapsed={collapsed}
    >
      <SidebarLink 
        to="/reserve-fund-calculator" 
        icon={Calculator} 
        label="Reserve Fund Calculator" 
        collapsed={collapsed} 
        isMobile={isMobile} 
        iconColor="green" 
        bgColor="green" 
      />
    </SidebarSection>
  );
};

export default CalculatorSection;
