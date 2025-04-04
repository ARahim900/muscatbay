
import React from 'react';
import SidebarLink from './SidebarLink';
import { Calculator, Calculator as CalculatorIcon, Coins } from 'lucide-react';

interface CalculatorSectionProps {
  collapsed?: boolean;
  isMobile?: boolean;
  openEmbeddedApp?: (url: string, title: string) => void;
  externalApps?: Record<string, string>;
}

const CalculatorSection: React.FC<CalculatorSectionProps> = ({
  collapsed = false,
  isMobile = false,
  openEmbeddedApp,
  externalApps = {}
}) => {
  return (
    <>
      <div className="mb-2">
        <h3 className={`text-xs font-semibold uppercase text-white/50 ${collapsed && !isMobile ? 'text-center' : 'px-4'}`}>
          {collapsed && !isMobile ? '—' : 'Calculators'}
        </h3>
      </div>
      <div className="space-y-1 mb-6">
        <SidebarLink 
          to="/service-charges"
          icon={CalculatorIcon}
          label="Service Charges"
          collapsed={collapsed}
          isMobile={isMobile}
        />
        <SidebarLink 
          to="/reserve-fund-calculator"
          icon={Coins}
          label="Reserve Fund"
          collapsed={collapsed}
          isMobile={isMobile}
        />
      </div>
    </>
  );
};

export default CalculatorSection;
