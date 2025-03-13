
import React from 'react';

interface SidebarFooterProps {
  collapsed?: boolean;
  isMobile?: boolean;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({ collapsed, isMobile }) => {
  return (
    <div className={`p-4 border-t border-white/10 ${collapsed && !isMobile ? 'text-center' : ''}`}>
      <p className="text-xs text-white/60">
        {collapsed && !isMobile ? 'v1.0' : 'Muscat Bay Asset Manager v1.0'}
      </p>
    </div>
  );
};

export default SidebarFooter;
