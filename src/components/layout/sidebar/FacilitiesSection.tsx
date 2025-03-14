
import React from 'react';
import { Thermometer, Droplets } from 'lucide-react';
import SidebarLink from './SidebarLink';
import SidebarSection from './SidebarSection';
import { PumpStationIcon } from './CustomIcons';

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
  return (
    <SidebarSection title="Facilities" collapsed={collapsed} isMobile={isMobile}>
      <SidebarLink 
        to="/stp" 
        icon={Droplets} 
        label="STP Plant" 
        collapsed={collapsed} 
        external={false}
        isMobile={isMobile}
      />
      <SidebarLink 
        to={externalApps.pumpingStation} 
        icon={PumpStationIcon} 
        label="Pumping Stations" 
        collapsed={collapsed} 
        external={true}
        openEmbedded={openEmbeddedApp}
        isMobile={isMobile}
      />
      <SidebarLink 
        to={externalApps.hvac} 
        icon={Thermometer} 
        label="HVAC/BMS" 
        collapsed={collapsed} 
        external={true}
        openEmbedded={openEmbeddedApp}
        isMobile={isMobile}
      />
    </SidebarSection>
  );
};

export default FacilitiesSection;
