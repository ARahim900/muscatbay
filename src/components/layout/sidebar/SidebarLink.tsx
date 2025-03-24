
import React, { ElementType } from 'react';
import { NavLink } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface SidebarLinkProps {
  to: string;
  icon: ElementType;
  label: string;
  collapsed?: boolean;
  external?: boolean;
  isMobile?: boolean;
  iconColor?: string;
  bgColor?: string;
  onClick?: () => void; // Add onClick prop to the interface
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  to,
  icon: Icon,
  label,
  collapsed,
  external = false,
  isMobile = false,
  iconColor = 'primary',
  bgColor = 'primary-foreground',
  onClick, // Add onClick to function parameters
}) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
  
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const content = (
    <div
      className={cn(
        "w-full flex items-center px-4 py-2.5 my-1 rounded-lg transition-colors duration-200",
        isActive
          ? "bg-accent dark:bg-accent/80 text-primary font-medium"
          : "hover:bg-muted/80 dark:hover:bg-muted/50 text-foreground/90",
        collapsed && !isMobile ? "justify-center px-0" : ""
      )}
    >
      {Icon && (
        <div
          className={cn(
            `flex-shrink-0 rounded-md w-8 h-8 flex items-center justify-center`,
            `text-${iconColor}`,
            `bg-${bgColor}/10`,
            iconColor && bgColor
              ? `text-${iconColor} bg-${bgColor}/10`
              : "text-primary/80 bg-primary/5"
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
      )}
      
      {(!collapsed || isMobile) && (
        <span className="ml-3 text-[15px] whitespace-nowrap">{label}</span>
      )}
    </div>
  );

  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full block"
        onClick={handleClick}
      >
        {content}
      </a>
    );
  }

  return (
    <NavLink to={to} className="w-full block" onClick={handleClick}>
      {content}
    </NavLink>
  );
};

export default SidebarLink;
