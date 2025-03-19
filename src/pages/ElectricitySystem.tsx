
import React, { useState } from 'react';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/electricity/PageHeader';
import InfoAlert from '@/components/electricity/InfoAlert';
import TabNavigation from '@/components/electricity/TabNavigation';
import OverviewTab from '@/components/electricity/OverviewTab';
import MonitoringTab from '@/components/electricity/MonitoringTab';
import ReportsTab from '@/components/electricity/ReportsTab';

const ElectricitySystem = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <PageHeader />
        <InfoAlert />
        
        <Tabs defaultValue="overview" className="w-full" onValueChange={handleTabChange}>
          <TabNavigation activeTab={activeTab} />
          
          <TabsContent value="overview" className="animate-fade-in">
            <OverviewTab />
          </TabsContent>
          
          <TabsContent value="monitoring">
            <MonitoringTab />
          </TabsContent>
          
          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ElectricitySystem;
