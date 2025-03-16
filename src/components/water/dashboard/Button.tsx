
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  onClick: () => void;
  theme: any;
  primary?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  icon: Icon, 
  onClick, 
  theme, 
  primary = false, 
  className = '' 
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 
      ${primary 
        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
        : `${theme.panelBg} ${theme.text} hover:bg-opacity-80 border ${theme.border}`
      } ${className}`}
    >
      {Icon && <Icon size={16} />}
      <span>{children}</span>
    </button>
  );
};

export default Button;
