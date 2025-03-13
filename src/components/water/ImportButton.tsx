
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface ImportButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

const ImportButton: React.FC<ImportButtonProps> = ({ onClick, isLoading }) => {
  return (
    <Button 
      onClick={onClick}
      disabled={isLoading}
      className="flex items-center"
    >
      <Upload className="mr-2 h-4 w-4" />
      {isLoading ? "Importing..." : "Import from Clipboard"}
    </Button>
  );
};

export default ImportButton;
