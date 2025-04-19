
import React from 'react';
import { Button } from "@/components/ui/button";

interface TabButtonProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export function TabButton({ children, active = false, onClick }: TabButtonProps) {
  return (
    <Button 
      variant={active ? "default" : "ghost"} 
      onClick={onClick}
      className="h-9"
    >
      {children}
    </Button>
  );
}
