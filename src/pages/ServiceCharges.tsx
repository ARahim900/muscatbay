
import React, { useState } from 'react';
import { Calculator, BarChart2, FileText, Settings, PieChart, Search, Filter, Activity, Building2 } from 'lucide-react';
import ServiceChargeCalculator from '@/components/service-charges/ServiceChargeCalculator';
import ServiceChargeOverview from '@/components/service-charges/ServiceChargeOverview';
import ServiceChargeExpenses from '@/components/service-charges/ServiceChargeExpenses';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a QueryClient for React Query
const queryClient = new QueryClient();

const ServiceCharges: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-30 w-full px-4 py-3 bg-white shadow-sm dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                <Calculator size={20} />
              </div>
              <h1 className="text-xl font-bold">OmniProp</h1>
            </div>
            
            <div className="relative w-96">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <input 
                type="search" 
                className="w-full py-2 pl-10 pr-4 text-sm border rounded-lg bg-gray-50 border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" 
                placeholder="Search service charges, properties..." 
              />
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700">
                <Filter size={20} />
              </button>
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-medium">MB</div>
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <div className="flex flex-1">
          {/* Sidebar */}
          <aside className="w-20 md:w-64 p-4 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <nav className="space-y-1 mt-6">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'overview' 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-100' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >
                <BarChart2 size={20} className="mr-3" />
                <span className="hidden md:inline">Overview</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('calculator')}
                className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'calculator' 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-100' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >
                <Calculator size={20} className="mr-3" />
                <span className="hidden md:inline">Calculator</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('expenses')}
                className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'expenses' 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-100' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >
                <PieChart size={20} className="mr-3" />
                <span className="hidden md:inline">Expenses</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'settings' 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-100' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >
                <Settings size={20} className="mr-3" />
                <span className="hidden md:inline">Settings</span>
              </button>
            </nav>
          </aside>
          
          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <div className="mb-6">
                  <h1 className="text-2xl font-bold">Service Charges</h1>
                  <p className="text-sm text-gray-500">Manage and calculate service charges for all properties</p>
                </div>
                
                {activeTab === 'overview' && (
                  <ServiceChargeOverview />
                )}

                {activeTab === 'calculator' && (
                  <ServiceChargeCalculator />
                )}

                {activeTab === 'expenses' && (
                  <ServiceChargeExpenses />
                )}

                {activeTab === 'settings' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-lg font-medium">Service Charge Settings</h2>
                    </div>
                    <div className="p-6">
                      <div className="grid gap-6">
                        <div>
                          <h3 className="text-lg font-medium mb-2">Reserve Fund Configuration</h3>
                          <p className="text-sm text-gray-500 mb-4">
                            Configure reserve fund rates by zone. These settings determine the contribution to the reserve fund for each property based on size and location.
                          </p>
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded text-center">
                            <p>Reserve fund settings editor will be implemented here.</p>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-2">Service Charge Policies</h3>
                          <p className="text-sm text-gray-500 mb-4">
                            Define service charge policies, payment terms, and allocation rules for different property types and zones.
                          </p>
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded text-center">
                            <p>Policy configuration settings will be implemented here.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default ServiceCharges;
