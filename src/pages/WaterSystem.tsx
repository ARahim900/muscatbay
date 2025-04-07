
import React from 'react';
import { Droplets } from 'lucide-react';
import { Card } from '@/components/ui/card';

const WaterSystem = () => {
  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
          <Droplets className="h-6 w-6 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold">Water System Dashboard</h1>
      </div>

      <Card className="w-full overflow-hidden border-0 shadow-sm">
        <div className="w-full h-[calc(100vh-180px)] p-0">
          <iframe 
            src="https://airtable.com/invite/l?inviteId=invvDirI6RN11wYFC&inviteToken=61180faba6a3d90cca1d18e78c06893ecb6a994e80f19ac9f613a5904ecb299f"
            style={{ 
              width: '100%', 
              height: '100%', 
              border: 'none' 
            }}
            frameBorder="0" 
            allowFullScreen
            title="Water System Dashboard"
          />
        </div>
      </Card>
    </div>
  );
};

export default WaterSystem;
