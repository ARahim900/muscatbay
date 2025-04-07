
import React from 'react';
import { Zap } from 'lucide-react';
import SidebarLink from './SidebarLink';
import SidebarSection from './SidebarSection';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  
  // Handle clicks for internal routes
  const handleClick = (path: string) => {
    if (typeof openEmbeddedApp === 'function' && path.startsWith('http')) {
      openEmbeddedApp(path, 'Electricity System');
    } else {
      // For internal routes, use navigation
      navigate(path);
    }
  };
  
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
        onClick={() => handleClick('/electricity-system')}
      />
    </SidebarSection>
  );
};

export default UtilitiesSection;
