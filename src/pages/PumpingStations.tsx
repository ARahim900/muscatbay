
import React from 'react';
import Layout from '../components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';

const PumpingStations = () => {
  return (
    <Layout>
      <div className="h-full flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-muscat-primary">Pumping Stations</h1>
            <p className="text-sm text-muscat-primary/60 flex items-center">
              <Activity className="h-4 w-4 mr-1.5 text-muscat-teal" />
              Monitor and control water pumping stations across the property
            </p>
          </div>
        </div>
        
        <Card className="flex-grow bg-white shadow-soft border border-muscat-primary/5">
          <CardContent className="p-0 h-[calc(100vh-12rem)]">
            <iframe 
              src="https://muscat-bay-pumping-stations.lovable.app/" 
              className="w-full h-full border-none"
              title="Pumping Stations"
              style={{ 
                width: '100%', 
                height: '100%',
                border: 'none',
                display: 'block'
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals"
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PumpingStations;
