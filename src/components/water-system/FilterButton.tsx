
import React from 'react';
import { Button } from "@/components/ui/button";

interface FilterButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export function FilterButton({ children, onClick }: FilterButtonProps) {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onClick}
      className="rounded-full text-sm"
    >
      {children}
    </Button>
  );
}
