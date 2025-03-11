
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Map, 
  Building, 
  Thermometer, 
  BarChart2, 
  Activity,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";

interface AssetData {
  id: string;
  name: string;
  category: string;
  location: string;
  status: string;
  manufacturer?: string;
  model?: string;
  installationDate?: string;
  nextMaintenanceDate?: string;
}

const ZoneDetails = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [zoneData, setZoneData] = useState<any>(null);
  const [assets, setAssets] = useState<AssetData[]>([]);
  
  // Get zone name from query params
  const queryParams = new URLSearchParams(location.search);
  const zoneName = queryParams.get('zone') || 'Unknown Zone';
  
  useEffect(() => {
    const fetchZoneData = async () => {
      setLoading(true);
      try {
        // This is a placeholder - you'll need to adjust this based on your actual Supabase tables
        // Example query for a table named "Zone 03(A)" or similar
        const formattedZoneName = zoneName.replace(/\s+/g, '');
        
        // First try to get zone summary data
        let { data, error } = await supabase
          .from(`Zone ${zoneName}`)
          .select('*')
          .limit(10);
        
        if (error) {
          console.error("Error fetching zone data:", error);
          // Fallback to mock data if the query fails
          setZoneData(generateMockZoneData(zoneName));
        } else {
          setZoneData(data || generateMockZoneData(zoneName));
        }
        
        // Now fetch assets for this zone (this is a mock implementation)
        setAssets(generateMockAssets(zoneName, 15));
        
      } catch (error) {
        console.error("Error in data fetching:", error);
        toast({
          title: "Error Loading Zone Data",
          description: "Could not load zone details. Using sample data instead.",
          variant: "destructive"
        });
        
        // Use mock data as fallback
        setZoneData(generateMockZoneData(zoneName));
        setAssets(generateMockAssets(zoneName, 15));
      } finally {
        setLoading(false);
      }
    };
    
    fetchZoneData();
  }, [zoneName, toast]);
  
  const generateMockZoneData = (zoneName: string) => {
    return {
      name: zoneName,
      totalAssets: Math.floor(Math.random() * 50) + 30,
      operationalAssets: Math.floor(Math.random() * 40) + 20,
      issueCount: Math.floor(Math.random() * 5),
      maintenanceDue: Math.floor(Math.random() * 8),
      consumption: {
        water: Math.floor(Math.random() * 5000) + 1000,
        electricity: Math.floor(Math.random() * 10000) + 5000,
      },
      lastUpdated: new Date().toISOString()
    };
  };
  
  const generateMockAssets = (zoneName: string, count: number): AssetData[] => {
    const categories = ['Electrical', 'Mechanical', 'Plumbing', 'HVAC', 'Infrastructure'];
    const statuses = ['Operational', 'Requires Maintenance', 'Under Maintenance', 'Critical'];
    const manufacturers = ['Schneider', 'ABB', 'Siemens', 'Johnson Controls', 'Honeywell'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: `${zoneName}-${i + 100}`,
      name: `Asset ${i + 1}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      location: `${zoneName} - Section ${String.fromCharCode(65 + Math.floor(Math.random() * 4))}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      manufacturer: manufacturers[Math.floor(Math.random() * manufacturers.length)],
      model: `Model-${Math.floor(Math.random() * 1000)}`,
      installationDate: new Date(Date.now() - Math.floor(Math.random() * 1000 * 86400000)).toISOString().split('T')[0],
      nextMaintenanceDate: new Date(Date.now() + Math.floor(Math.random() * 100 * 86400000)).toISOString().split('T')[0]
    }));
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Operational':
        return 'bg-green-100 text-green-800';
      case 'Requires Maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'Under Maintenance':
        return 'bg-blue-100 text-blue-800';
      case 'Critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/alm')}
            className="mr-4"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to ALM
          </Button>
          
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-muscat-primary flex items-center">
              <Map size={24} className="mr-2" />
              {zoneName} Details
            </h1>
            <p className="text-gray-500">
              Asset management and monitoring for {zoneName}
            </p>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-muscat-primary border-opacity-50 border-t-muscat-primary rounded-full mx-auto mb-4"></div>
            <p>Loading zone data...</p>
          </div>
        ) : (
          <>
            {/* Zone Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Building size={18} className="mr-2 text-muscat-primary" />
                    Asset Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Assets:</span>
                      <span className="font-medium">{zoneData?.totalAssets || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Operational:</span>
                      <span className="font-medium text-green-600">{zoneData?.operationalAssets || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Issues:</span>
                      <span className="font-medium text-red-600">{zoneData?.issueCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Maintenance Due:</span>
                      <span className="font-medium text-amber-600">{zoneData?.maintenanceDue || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Thermometer size={18} className="mr-2 text-muscat-primary" />
                    Consumption Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Water:</span>
                      <span className="font-medium">{zoneData?.consumption?.water || 0} m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Electricity:</span>
                      <span className="font-medium">{zoneData?.consumption?.electricity || 0} kWh</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-gray-500 text-xs">Last Updated:</span>
                      <span className="text-xs">{new Date(zoneData?.lastUpdated || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <BarChart2 size={18} className="mr-2 text-muscat-primary" />
                    Asset Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs">Operational</span>
                        <span className="text-xs font-medium">
                          {zoneData ? Math.round((zoneData.operationalAssets / zoneData.totalAssets) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${zoneData ? Math.round((zoneData.operationalAssets / zoneData.totalAssets) * 100) : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs">Maintenance</span>
                        <span className="text-xs font-medium">
                          {zoneData ? Math.round((zoneData.maintenanceDue / zoneData.totalAssets) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full"
                          style={{
                            width: `${zoneData ? Math.round((zoneData.maintenanceDue / zoneData.totalAssets) * 100) : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs">Issues</span>
                        <span className="text-xs font-medium">
                          {zoneData ? Math.round((zoneData.issueCount / zoneData.totalAssets) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{
                            width: `${zoneData ? Math.round((zoneData.issueCount / zoneData.totalAssets) * 100) : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button 
                variant="outline" 
                className="flex items-center gap-1"
                onClick={() => {
                  toast({
                    title: "Generating Report",
                    description: `Preparing ${zoneName} asset report...`,
                  });
                }}
              >
                <FileText size={16} />
                Generate Report
              </Button>
              
              <Button 
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => {
                  toast({
                    title: "Health Check Initiated",
                    description: `Starting health check for all assets in ${zoneName}...`,
                  });
                }}
              >
                <Activity size={16} />
                Health Check
              </Button>
              
              <Button 
                variant="outline"
                className="flex items-center gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={() => {
                  toast({
                    title: "Maintenance Alert",
                    description: `Sent maintenance alerts for all due assets in ${zoneName}.`,
                  });
                }}
              >
                <AlertCircle size={16} />
                Maintenance Alert
              </Button>
            </div>
            
            {/* Assets Table */}
            <Card>
              <CardHeader>
                <CardTitle>Zone Assets</CardTitle>
                <CardDescription>
                  Displaying {assets.length} assets in {zoneName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Maintenance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assets.map((asset) => (
                        <tr key={asset.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{asset.id}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">{asset.name}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">{asset.category}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">{asset.location}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(asset.status)}`}>
                              {asset.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            {asset.nextMaintenanceDate || 'Not scheduled'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ZoneDetails;
