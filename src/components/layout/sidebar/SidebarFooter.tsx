
import React from 'react';

interface SidebarFooterProps {
  collapsed?: boolean;
  isMobile?: boolean;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({ collapsed, isMobile }) => {
  return (
    <div className={`p-4 border-t border-white/20 ${collapsed && !isMobile ? 'text-center' : ''}`}>
      <p className={`text-white/70 font-medium ${collapsed && !isMobile ? 'text-xs' : 'text-sm'}`}>
        {collapsed && !isMobile ? 'v1.0' : 'Muscat Bay Asset Manager v1.0'}
      </p>
      {!collapsed && !isMobile && (
        <p className="text-xs text-white/50 mt-1">
          Monitoring and managing utilities across the property
        </p>
      )}
    </div>
  );
};

export default SidebarFooter;
