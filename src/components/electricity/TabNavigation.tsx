
import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, BarChart3, Gauge } from "lucide-react";

interface TabNavigationProps {
  activeTab: string;
}

const TabNavigation = ({ activeTab }: TabNavigationProps) => {
  return (
    <TabsList className="grid w-full grid-cols-3 mb-8 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/80 p-1 rounded-lg shadow-inner">
      <TabsTrigger 
        value="overview" 
        className={`transition-all duration-300 rounded-md ${activeTab === 'overview' ? 'bg-white dark:bg-gray-700 shadow-md' : 'hover:bg-white/80 dark:hover:bg-gray-700/50'}`}
      >
        <Gauge className={`h-4 w-4 mr-2 ${activeTab === 'overview' ? 'text-muscat-primary' : 'text-gray-500'}`} />
        Overview
      </TabsTrigger>
      <TabsTrigger 
        value="monitoring"
        className={`transition-all duration-300 rounded-md ${activeTab === 'monitoring' ? 'bg-white dark:bg-gray-700 shadow-md' : 'hover:bg-white/80 dark:hover:bg-gray-700/50'}`}
      >
        <Activity className={`h-4 w-4 mr-2 ${activeTab === 'monitoring' ? 'text-muscat-primary' : 'text-gray-500'}`} />
        Monitoring
      </TabsTrigger>
      <TabsTrigger 
        value="reports"
        className={`transition-all duration-300 rounded-md ${activeTab === 'reports' ? 'bg-white dark:bg-gray-700 shadow-md' : 'hover:bg-white/80 dark:hover:bg-gray-700/50'}`}
      >
        <BarChart3 className={`h-4 w-4 mr-2 ${activeTab === 'reports' ? 'text-muscat-primary' : 'text-gray-500'}`} />
        Reports
      </TabsTrigger>
    </TabsList>
  );
};

export default TabNavigation;
