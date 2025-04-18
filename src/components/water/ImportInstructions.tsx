
import React from 'react';
import { FileText } from 'lucide-react';

const ImportInstructions: React.FC = () => {
  return (
    <div>
      <h2 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
        <FileText className="h-5 w-5 mr-2 text-gray-500" />
        Import Water Distribution Data
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Copy water distribution data from Excel or similar spreadsheet applications to your clipboard, 
        then click the button below to import. The data should include columns for Meter Label, Acct #, 
        Zone, Type, Parent Meter, and monthly consumption values.
      </p>
    </div>
  );
};

export default ImportInstructions;
