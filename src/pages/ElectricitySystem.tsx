
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import ElectricityDashboard from '@/components/electricity/ElectricityDashboard';
import { toast } from 'sonner';

const ElectricitySystem = () => {
  React.useEffect(() => {
    // Initialize page and check for API connection
    const checkConnection = async () => {
      try {
        // This will trigger the API key to be loaded from Supabase
        // The actual data fetch will happen in the ElectricityDashboard component
        // Just inform the user that the system is initialized
        toast.info('Connecting to electricity data system...');
      } catch (error) {
        console.error('Failed to initialize electricity system:', error);
        toast.error('Failed to connect to electricity data system. Using local data.');
      }
    };
    
    checkConnection();
  }, []);

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  return (
    <Layout>
      <motion.div 
        className="container mx-auto p-4"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
      >
        <ElectricityDashboard />
      </motion.div>
    </Layout>
  );
};

export default ElectricitySystem;
