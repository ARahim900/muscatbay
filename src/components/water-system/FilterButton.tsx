
import React from 'react';

interface FilterButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export function FilterButton({ children, onClick }: FilterButtonProps) {
  return (
    <button
      className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
