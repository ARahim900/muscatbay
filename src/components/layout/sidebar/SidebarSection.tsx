
import React from 'react';

interface SidebarSectionProps {
  title: string;
  collapsed?: boolean;
  isMobile?: boolean;
  children: React.ReactNode;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ 
  title, 
  collapsed, 
  isMobile,
  children 
}) => {
  return (
    <div>
      <div className="mb-2">
        <h3 className={`text-xs font-semibold uppercase text-white/50 ${collapsed && !isMobile ? 'text-center' : 'px-4'}`}>
          {collapsed && !isMobile ? '—' : title}
        </h3>
      </div>
      <div className="space-y-1 mb-6">
        {children}
      </div>
    </div>
  );
};

export default SidebarSection;
