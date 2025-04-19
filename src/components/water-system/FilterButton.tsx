
import React from 'react';

interface FilterButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export function FilterButton({ children, onClick }: FilterButtonProps) {
  return (
    <button
      className="px-4 py-2 rounded-md text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
