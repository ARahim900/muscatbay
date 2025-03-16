
import React from 'react';

interface FilterButtonProps {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
  theme: any;
}

const FilterButton: React.FC<FilterButtonProps> = ({ label, active, color, onClick, theme }) => {
  return (
    <button
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
        active ? 'bg-opacity-20 shadow-sm' : 'bg-transparent'
      }`}
      style={{ backgroundColor: active ? `${color}30` : '', color: active ? color : theme.text }}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div 
          className="w-2 h-2 rounded-full mr-2" 
          style={{ backgroundColor: color }}
        ></div>
        {label}
      </div>
    </button>
  );
};

export default FilterButton;
