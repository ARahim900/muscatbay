
import React from 'react';
import { Zap, Droplets } from 'lucide-react';
import SidebarLink from './SidebarLink';
import SidebarSection from './SidebarSection';

interface UtilitiesSectionProps {
  collapsed?: boolean;
  isMobile?: boolean;
  openEmbeddedApp?: (url: string, title: string) => void;
}

const UtilitiesSection: React.FC<UtilitiesSectionProps> = ({ 
  collapsed,
  isMobile,
  openEmbeddedApp
}) => {
  return (
    <SidebarSection title="Utilities" collapsed={collapsed} isMobile={isMobile}>
      <SidebarLink 
        to="/electricity-system" 
        icon={Zap} 
        label="Electricity System" 
        collapsed={collapsed} 
        external={false}
        isMobile={isMobile}
        iconColor="amber-500"
        bgColor="amber-100"
      />
      <SidebarLink 
        to="/water-system" 
        icon={Droplets} 
        label="Water System" 
        collapsed={collapsed} 
        external={false}
        isMobile={isMobile}
        iconColor="blue-500"
        bgColor="blue-100"
      />
    </SidebarSection>
  );
};

export default UtilitiesSection;
