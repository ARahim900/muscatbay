
import React from 'react';

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  theme: any;
}

const TabButton: React.FC<TabButtonProps> = ({ label, active, onClick, theme }) => {
  return (
    <button
      className={`px-4 py-2 font-medium text-sm rounded-t-md ${
        active 
          ? `${theme.cardBg} text-blue-600 border-b-2 border-blue-600` 
          : `${theme.textSecondary} hover:text-blue-500`
      } transition-colors duration-200`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default TabButton;
