
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import ElectricityDashboard from '@/components/electricity/ElectricityDashboard';

const ElectricitySystem = () => {
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
