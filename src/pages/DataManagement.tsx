
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { ClipboardCheck, Database, Droplets, Zap, ArrowRight } from 'lucide-react';
import STPDataEntryForm from '@/components/data-management/STPDataEntryForm';
import WaterDataEntryForm from '@/components/data-management/WaterDataEntryForm';
import ElectricityDataEntryForm from '@/components/data-management/ElectricityDataEntryForm';
import { useNavigate } from 'react-router-dom';

const DataManagement = () => {
  const [activeTab, setActiveTab] = useState<string>("stp");
  const navigate = useNavigate();
  
  const handleViewDashboard = (dashboardType: string) => {
    switch(dashboardType) {
      case 'stp':
        navigate('/stp-dashboard');
        break;
      case 'water':
        navigate('/water-system');
        break;
      case 'electricity':
        navigate('/electricity-system');
        break;
      default:
        break;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-muscat-primary flex items-center">
              <Database className="mr-2 h-6 w-6" />
              Data Management
            </h1>
            <p className="text-gray-500 mt-1">
              Update and manage utility data across all systems
            </p>
          </div>
        </div>

        <Tabs defaultValue="stp" className="mt-6" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
            <TabsTrigger value="stp" className="flex items-center">
              <Droplets className="mr-2 h-4 w-4" />
              STP Data
            </TabsTrigger>
            <TabsTrigger value="water" className="flex items-center">
              <Droplets className="mr-2 h-4 w-4" />
              Water Data
            </TabsTrigger>
            <TabsTrigger value="electricity" className="flex items-center">
              <Zap className="mr-2 h-4 w-4" />
              Electricity Data
            </TabsTrigger>
          </TabsList>
          
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {activeTab === 'stp' && 'STP Plant Data Entry'}
                    {activeTab === 'water' && 'Water Consumption Data Entry'}
                    {activeTab === 'electricity' && 'Electricity Consumption Data Entry'}
                  </CardTitle>
                  <CardDescription>
                    {activeTab === 'stp' && 'Enter daily and monthly STP plant operational data'}
                    {activeTab === 'water' && 'Enter water meter readings and consumption data'}
                    {activeTab === 'electricity' && 'Enter electricity meter readings and consumption data'}
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  className="flex items-center" 
                  onClick={() => handleViewDashboard(activeTab)}
                >
                  View Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TabsContent value="stp" className="mt-0">
                <STPDataEntryForm />
              </TabsContent>
              
              <TabsContent value="water" className="mt-0">
                <WaterDataEntryForm />
              </TabsContent>
              
              <TabsContent value="electricity" className="mt-0">
                <ElectricityDataEntryForm />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
        
        <div className="mt-8 text-sm text-gray-500 flex items-center">
          <ClipboardCheck className="h-4 w-4 mr-2 text-green-500" />
          <span>All data entered is automatically synchronized with relevant dashboards and reports.</span>
        </div>
      </div>
    </Layout>
  );
};

export default DataManagement;
