
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import STPDashboard from '@/components/stp/STPDashboard';
import { toast } from 'sonner';

const STP = () => {
  useEffect(() => {
    document.title = 'STP Plant | Muscat Bay Asset Manager';
    
    // Show toast when page loads to notify user about recent updates
    toast.info("Data updated successfully", {
      description: "Latest STP operational data is now available",
      duration: 3000,
    });
  }, []);

  return (
    <Layout>
      <STPDashboard />
    </Layout>
  );
};

export default STP;
