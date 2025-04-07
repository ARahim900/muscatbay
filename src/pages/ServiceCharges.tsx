import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const ServiceCharges = () => {
  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  return (
    <Layout>
      <AnimatePresence>
        <motion.div 
          className="container mx-auto p-4"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Service Charges</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This page will display service charge information.</p>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
};

export default ServiceCharges;
