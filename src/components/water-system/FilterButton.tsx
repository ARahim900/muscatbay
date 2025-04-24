
import React from 'react';

interface FilterButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function FilterButton({ children, onClick = () => {}, className = "" }: FilterButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
