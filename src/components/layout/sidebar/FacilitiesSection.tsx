
import React from 'react';
import { Droplets, AirVent } from 'lucide-react';
import SidebarLink from './SidebarLink';
import SidebarSection from './SidebarSection';
import { PumpStationIcon } from './CustomIcons';
import { useTouchDevice } from '@/hooks/use-mobile';

interface FacilitiesSectionProps {
  collapsed?: boolean;
  isMobile?: boolean;
  openEmbeddedApp?: (url: string, title: string) => void;
  externalApps: {
    stpPlant: string;
    pumpingStation: string;
    hvac: string;
    [key: string]: string;
  };
}

const FacilitiesSection: React.FC<FacilitiesSectionProps> = ({ 
  collapsed,
  isMobile,
  openEmbeddedApp,
  externalApps
}) => {
  const isTouch = useTouchDevice();
  
  const linkClasses = isTouch ? "touch-manipulation min-h-[44px]" : "";
  
  return (
    <SidebarSection title="Facilities" collapsed={collapsed} isMobile={isMobile}>
      <SidebarLink 
        to="/stp" 
        icon={Droplets} 
        label="STP Plant" 
        collapsed={collapsed} 
        external={false}
        isMobile={isMobile}
        className={linkClasses}
        iconColor="green-500"
        bgColor="green-100"
      />
      <SidebarLink 
        to="/pumping-stations" 
        icon={PumpStationIcon} 
        label="Pumping Stations" 
        collapsed={collapsed} 
        external={false}
        isMobile={isMobile}
        className={linkClasses}
        iconColor="blue-600"
        bgColor="blue-100"
      />
      <SidebarLink 
        to="/hvac" 
        icon={AirVent} 
        label="HVAC/BMS" 
        collapsed={collapsed} 
        external={false}
        isMobile={isMobile}
        className={linkClasses}
        iconColor="orange-500"
        bgColor="orange-100"
      />
    </SidebarSection>
  );
};

export default FacilitiesSection;
