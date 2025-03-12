
import React from 'react';
import Layout from '../components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';

const AssetLifecycleManagement = () => {
  return (
    <Layout>
      <div className="h-full flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-muscat-primary">Asset Lifecycle Management</h1>
        </div>
        
        <Card className="flex-grow">
          <CardContent className="p-0 h-[calc(100vh-12rem)]">
            <iframe 
              src="https://assets-management-alm.lovable.app" 
              className="w-full h-full border-none"
              title="Asset Lifecycle Management"
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

export default AssetLifecycleManagement;
