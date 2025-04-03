
import React from 'react';
import SidebarSection from './SidebarSection';

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
  // Return an empty section since we're removing the calculator functionality
  return null;
};

export default CalculatorSection;
