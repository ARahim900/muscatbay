
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import STPDashboard from '@/components/stp/STPDashboard';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { ArrowRight, LineChart, Microscope, MonitorSmartphone, Upload } from 'lucide-react';
import STPDataImport from '@/components/stp/STPDataImport';

const STP = () => {
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    document.title = 'STP Plant | Muscat Bay Asset Manager';
    
    // Show toast when page loads to notify user about recent updates
    toast.info("Data updated successfully", {
      description: "Latest STP operational data is now available",
      duration: 3000,
    });
  }, []);

  const handleImportSuccess = () => {
    setShowImport(false);
    setSelectedTab('dashboard');
    toast.success("STP data imported successfully", {
      description: "The dashboard has been refreshed with the latest data",
    });
    // Refresh the dashboard
    window.location.reload();
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">STP Plant Management</h1>
            <p className="text-muted-foreground">
              Sewage Treatment Plant monitoring and operational metrics
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => setShowImport(!showImport)}>
              <Upload className="mr-2 h-4 w-4" />
              {showImport ? 'Hide Import' : 'Import Data'}
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/stp-bioreactor-mbr">
                <Microscope className="mr-2 h-4 w-4" />
                MBR Bioreactor
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/stp-analytics">
                <LineChart className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </Button>
          </div>
        </div>

        {showImport && (
          <div className="mb-6">
            <STPDataImport onImportSuccess={handleImportSuccess} />
          </div>
        )}

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="daily">Daily Reports</TabsTrigger>
            <TabsTrigger value="equipment">Equipment Status</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-4">
            <STPDashboard />
          </TabsContent>
          
          <TabsContent value="daily" className="space-y-4">
            <div className="grid gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Daily Reports</h2>
                <Button asChild variant="default" size="sm">
                  <Link to="/stp-bioreactor-mbr?tab=reports">
                    View Detailed Reports
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <iframe 
                src="/stp-bioreactor-mbr?tab=reports" 
                className="w-full h-[600px] border rounded-lg" 
                title="STP Daily Reports"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="equipment" className="space-y-4">
            <div className="grid gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Equipment Status</h2>
                <Button asChild variant="default" size="sm">
                  <Link to="/stp-bioreactor-mbr?tab=equipment">
                    View Equipment Details
                    <MonitorSmartphone className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <iframe 
                src="/stp-bioreactor-mbr?tab=equipment" 
                className="w-full h-[600px] border rounded-lg" 
                title="STP Equipment Status"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default STP;
