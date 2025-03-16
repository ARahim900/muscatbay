import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface SidebarLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  collapsed?: boolean;
  external?: boolean;
  openEmbedded?: (url: string, title: string) => void;
  options?: {
    label: string;
    url: string;
    isGitHub?: boolean;
  }[];
  isMobile?: boolean;
  className?: string;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  to,
  icon: Icon,
  label,
  collapsed,
  external,
  openEmbedded,
  options,
  isMobile,
  className
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const handleEmbeddedClick = (e: React.MouseEvent, url: string = to, title: string = label) => {
    if (external && openEmbedded) {
      e.preventDefault();
      openEmbedded(url, title);
      if (options) {
        setShowOptions(false);
      }
    }
  };

  const handleOptionClick = (e: React.MouseEvent, option: {
    url: string;
    label: string;
    isGitHub?: boolean;
  }) => {
    e.preventDefault();
    e.stopPropagation();
    if (option.isGitHub) {
      window.open(option.url, '_blank');
    } else if (external && openEmbedded) {
      openEmbedded(option.url, option.label);
    }
    setShowOptions(false);
  };

  const toggleOptions = (e: React.MouseEvent) => {
    if (options && options.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      setShowOptions(!showOptions);
    }
  };

  if (external) {
    return <div className="relative">
        <a href={to} className={`sidebar-link ${collapsed && !isMobile ? 'justify-center px-0' : ''} ${className || ''}`} onClick={options && options.length > 0 ? toggleOptions : e => handleEmbeddedClick(e)} aria-expanded={showOptions}>
          <Icon className="flex-shrink-0 w-5 h-5" />
          {(!collapsed || isMobile) && <>
              <span className="flex-1">{label}</span>
              {options && options.length > 0 && <ChevronRight className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-90' : ''}`} />}
            </>}
        </a>
        
        {(!collapsed || isMobile) && showOptions && options && options.length > 0 && <div className="pl-10 mt-1 space-y-1">
            {options.map((option, index) => <a key={index} href={option.url} className="flex items-center py-2 px-4 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors" onClick={e => handleOptionClick(e, option)}>
                <span>{option.label}</span>
              </a>)}
          </div>}
      </div>;
  }

  return <NavLink to={to} className={({
    isActive
  }) => `sidebar-link ${isActive ? 'active' : ''} ${collapsed && !isMobile ? 'justify-center px-0' : ''} ${className || ''}`}>
      <Icon className="flex-shrink-0 w-5 h-5" />
      {(!collapsed || isMobile) && <span className="font-normal text-base text-center text-stone-200">{label}</span>}
    </NavLink>;
};

export default SidebarLink;
