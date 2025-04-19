
import React from 'react';

interface TabButtonProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export function TabButton({ children, active = false, onClick }: TabButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded-md text-sm ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-transparent hover:bg-muted"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
