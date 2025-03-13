
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import STPDashboard from '@/components/stp/STPDashboard';

const STP = () => {
  useEffect(() => {
    document.title = 'STP Plant | Muscat Bay Asset Manager';
  }, []);

  return (
    <Layout>
      <STPDashboard />
    </Layout>
  );
};

export default STP;
