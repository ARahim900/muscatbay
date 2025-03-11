
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { 
  PlusCircle, Database, Wrench, RefreshCw, Settings, Calendar, 
  BarChart2, Map, FileText, Clipboard, AlertTriangle, Download, 
  Printer, Filter, Smartphone, Bell, CheckSquare, Info
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import DashboardCard from "@/components/dashboard/DashboardCard";
import KpiIndicator from "@/components/dashboard/KpiIndicator";

const AssetLifecycleManagement = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Maintenance Due', message: 'HVAC system in FM BUILDING requires quarterly maintenance', priority: 'high', date: '2025-03-15' },
    { id: 2, title: 'Installation Date Missing', message: '23 assets added this month are missing installation dates', priority: 'medium', date: '2025-03-12' },
    { id: 3, title: 'Work Order Created', message: 'Work order #WO-2345 created for electrical maintenance', priority: 'normal', date: '2025-03-10' },
  ]);

  // Mock data until connected to backend
  const assetData = generateMockAssetData();
  const categories = ['All', 'Electrical', 'Mechanical', 'Plumbing', 'HVAC', 'Infrastructure'];
  const locations = ['All', 'FM BUILDING', 'Main TRD', 'Zone 1', 'Zone 3', 'Zone 5', 'Zone 8', 'Technical Zone'];
  
  const workOrders = [
    { id: 'WO-2345', asset: 'SBJ-Z1-FM-GF-LVP-ELDB1', description: 'Quarterly electrical maintenance', status: 'Scheduled', assignedTo: 'Tech Team 3', dueDate: '2025-03-22' },
    { id: 'WO-2346', asset: 'SBJ-Z1-FM-GF-LVP-ELDB2', description: 'Repair power distribution panel', status: 'In Progress', assignedTo: 'John Smith', dueDate: '2025-03-15' },
    { id: 'WO-2347', asset: 'SLP-HVAC-RTU-001', description: 'Replace air filters', status: 'Completed', assignedTo: 'Maintenance Team', dueDate: '2025-03-08' },
  ];

  // Styled colors for visualizations
  const PRIMARY_COLOR = '#4E4456';
  const COLORS = [
    PRIMARY_COLOR, '#7D6E85', '#A78BA4', '#D8BFD8', '#946B7C', 
    '#C36E79', '#F57F7F', '#E89F9F', '#AE9BC7', '#6D598A',
    '#BE6E6E', '#8B6C79', '#9E788F', '#6B5364', '#514958'
  ];

  // Generate pie chart data for categories
  const categoryData = [
    { name: 'Electrical', value: 142 },
    { name: 'Mechanical', value: 89 },
    { name: 'Plumbing', value: 56 },
    { name: 'HVAC', value: 72 },
    { name: 'Infrastructure', value: 38 },
  ];

  // Generate bar chart data for locations
  const locationData = [
    { name: 'FM BUILDING', value: 84 },
    { name: 'Main TRD', value: 67 },
    { name: 'Zone 1', value: 54 },
    { name: 'Zone 3', value: 48 },
    { name: 'Zone 5', value: 42 },
    { name: 'Zone 8', value: 39 },
    { name: 'Technical Zone', value: 28 },
    { name: 'Lagoon Area', value: 24 },
    { name: 'Village Square', value: 19 },
    { name: 'Zone 9', value: 14 },
  ];

  // Statistics for the dashboard
  const stats = {
    totalAssets: 397,
    missingInstallationCount: 35,
    operationalAssets: 342,
    requiresMaintenance: 43,
    underMaintenance: 12,
  };

  // Lifecycle form states
  const [formData, setFormData] = useState({
    assetId: '',
    installationDate: '',
    maintenanceSchedule: ''
  });
  
  const [lifecycleAsset, setLifecycleAsset] = useState({
    assetId: '',
    status: 'Operational',
    nextMaintenance: '',
    notes: ''
  });

  // Filtered data based on selections and search
  const filteredData = assetData.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesLocation = selectedLocation === 'All' || item.location === selectedLocation;
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.model && item.model.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesLocation && matchesSearch;
  });

  // Pagination
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Handle update installation date
  const handleUpdateData = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Asset Updated",
      description: `Successfully updated installation date for asset ${formData.assetId}`,
    });
    setFormData({ assetId: '', installationDate: '', maintenanceSchedule: '' });
  };

  // Handle lifecycle update
  const handleLifecycleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Lifecycle Status Updated",
      description: `Successfully updated lifecycle status for asset ${lifecycleAsset.assetId}`,
    });
    setLifecycleAsset({ assetId: '', status: 'Operational', nextMaintenance: '', notes: '' });
  };

  // Function to handle report generation
  const handleGenerateReport = () => {
    setShowReportModal(false);
    toast({
      title: "Report Generation Started",
      description: `Generating ${selectedReport} report for ${filteredData.length} assets...`,
    });
  };

  // Toggle mobile view
  const toggleMobileView = () => {
    setIsMobileView(!isMobileView);
  };

  // Function to generate mock asset data
  function generateMockAssetData() {
    const statuses = ['Operational', 'Requires Maintenance', 'Under Maintenance'];
    const categories = ['Electrical', 'Mechanical', 'Plumbing', 'HVAC', 'Infrastructure'];
    const locations = ['FM BUILDING', 'Main TRD', 'Zone 1', 'Zone 3', 'Zone 5', 'Zone 8', 'Technical Zone', 'Lagoon Area'];
    const manufacturers = ['Schneider', 'ABB', 'Siemens', 'Johnson Controls', 'Honeywell', 'Carrier', 'York', 'Daikin'];
    
    return Array.from({ length: 50 }, (_, i) => {
      const today = new Date();
      const monthsToAdd = Math.floor(Math.random() * 4) + 3;
      const nextMaintenanceDate = new Date(today);
      nextMaintenanceDate.setMonth(today.getMonth() + monthsToAdd);
      
      return {
        id: `ASSET-${i + 1000}`,
        name: `Asset ${i + 1}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        subCategory: 'Sub-Category',
        location: locations[Math.floor(Math.random() * locations.length)],
        manufacturer: manufacturers[Math.floor(Math.random() * manufacturers.length)],
        model: `Model ${Math.floor(Math.random() * 100)}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        installationDate: Math.random() > 0.1 ? '2023-01-15' : '',
        nextMaintenanceDate: nextMaintenanceDate.toISOString().split('T')[0],
        quantity: Math.floor(Math.random() * 3) + 1
      };
    });
  }

  // Render the Dashboard
  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Report Generation Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Generate {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report</h3>
            
            <p className="mb-6 text-sm text-gray-600">
              {selectedReport === 'inventory' && 'This report will include a complete inventory of all assets with details on location, category, and status.'}
              {selectedReport === 'maintenance' && 'This report will show upcoming maintenance schedules for all assets with due dates and responsible teams.'}
              {selectedReport === 'status' && 'This report will provide a breakdown of asset status across categories and locations.'}
              {selectedReport === 'lifecycle' && 'This report will analyze asset lifecycle status, including age, expected lifespan, and replacement planning.'}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Format</label>
                <select className="w-full p-2 border rounded-md">
                  <option>PDF Document</option>
                  <option>Excel Spreadsheet</option>
                  <option>CSV File</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Time Range</label>
                <select className="w-full p-2 border rounded-md">
                  <option>Current Data</option>
                  <option>Last 30 Days</option>
                  <option>Last Quarter</option>
                  <option>Last Year</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateReport}
                >
                  Generate Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-muscat-primary">Asset Lifecycle Management</h1>
        
        <div className="flex items-center gap-4">
          {/* Responsive mode toggle for field technicians */}
          <Button 
            variant="outline"
            size="sm"
            className={`flex items-center gap-1 ${isMobileView ? 'bg-blue-100 text-blue-700' : ''}`}
            onClick={toggleMobileView}
          >
            <Smartphone size={16} />
            <span className="hidden sm:inline">{isMobileView ? 'Field Tech View' : 'Standard View'}</span>
          </Button>
          
          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} className="text-gray-700" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </Button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-10 overflow-hidden">
                <div className="p-3 border-b">
                  <h3 className="font-medium">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No notifications</div>
                  ) : (
                    notifications.map(notification => (
                      <div key={notification.id} className={`p-3 border-b ${notification.priority === 'high' ? 'bg-red-50' : notification.priority === 'medium' ? 'bg-amber-50' : 'bg-white'}`}>
                        <div className="flex justify-between">
                          <span className="font-medium">{notification.title}</span>
                          <span className="text-xs text-gray-500">{notification.date}</span>
                        </div>
                        <p className="text-sm mt-1">{notification.message}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t bg-gray-50">
                  <button 
                    className="w-full py-1 text-sm text-center text-blue-600"
                    onClick={() => {
                      setNotifications([]);
                      setShowNotifications(false);
                      toast({
                        title: "Notifications Cleared",
                        description: "All notifications have been marked as read.",
                      });
                    }}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 md:p-6">
        <div className="flex flex-wrap overflow-x-auto gap-8 justify-center md:justify-between">
          <div className="flex-shrink-0 text-center">
            <div className="h-12 w-12 md:h-16 md:w-16 bg-blue-100 text-muscat-primary rounded-full flex items-center justify-center mx-auto">
              <PlusCircle size={24} />
            </div>
            <div className="mt-2 text-sm font-medium">Planning</div>
            <div className="text-xs text-gray-500">Acquisition & Funding</div>
          </div>
          
          <div className="hidden md:block flex-shrink-0 border-t-2 border-gray-300 w-8 md:w-12 mt-8"></div>
          
          <div className="flex-shrink-0 text-center">
            <div className="h-12 w-12 md:h-16 md:w-16 bg-purple-100 text-muscat-lavender rounded-full flex items-center justify-center mx-auto">
              <Database size={24} />
            </div>
            <div className="mt-2 text-sm font-medium">Registration</div>
            <div className="text-xs text-gray-500">Inventory & Tagging</div>
          </div>
          
          <div className="hidden md:block flex-shrink-0 border-t-2 border-gray-300 w-8 md:w-12 mt-8"></div>
          
          <div className="flex-shrink-0 text-center">
            <div className="h-12 w-12 md:h-16 md:w-16 bg-green-100 text-muscat-teal rounded-full flex items-center justify-center mx-auto">
              <Wrench size={24} />
            </div>
            <div className="mt-2 text-sm font-medium">Operation</div>
            <div className="text-xs text-gray-500">Use & Maintenance</div>
          </div>
          
          <div className="hidden md:block flex-shrink-0 border-t-2 border-gray-300 w-8 md:w-12 mt-8"></div>
          
          <div className="flex-shrink-0 text-center">
            <div className="h-12 w-12 md:h-16 md:w-16 bg-yellow-100 text-muscat-gold rounded-full flex items-center justify-center mx-auto">
              <RefreshCw size={24} />
            </div>
            <div className="mt-2 text-sm font-medium">Evaluation</div>
            <div className="text-xs text-gray-500">Performance Review</div>
          </div>
          
          <div className="hidden md:block flex-shrink-0 border-t-2 border-gray-300 w-8 md:w-12 mt-8"></div>
          
          <div className="flex-shrink-0 text-center">
            <div className="h-12 w-12 md:h-16 md:w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Settings size={24} />
            </div>
            <div className="mt-2 text-sm font-medium">End of Life</div>
            <div className="text-xs text-gray-500">Disposal or Replacement</div>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid ${isMobileView ? 'grid-cols-4' : 'grid-cols-8'} mb-6`}>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart2 size={16} />
            <span className={isMobileView ? "hidden" : ""}>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <FileText size={16} />
            <span className={isMobileView ? "hidden" : ""}>Assets</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FileText size={16} />
            <span className={isMobileView ? "hidden" : ""}>Categories</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <Map size={16} />
            <span className={isMobileView ? "hidden" : ""}>Locations</span>
          </TabsTrigger>
          {!isMobileView && (
            <>
              <TabsTrigger value="update" className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Update</span>
              </TabsTrigger>
              <TabsTrigger value="lifecycle" className="flex items-center gap-2">
                <Settings size={16} />
                <span>Lifecycle</span>
              </TabsTrigger>
              <TabsTrigger value="workorders" className="flex items-center gap-2">
                <Clipboard size={16} />
                <span>Work Orders</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell size={16} />
                <span>Alerts</span>
              </TabsTrigger>
            </>
          )}
          {isMobileView && (
            <TabsTrigger value="fieldwork" className="flex items-center gap-2">
              <Wrench size={16} />
              <span className={isMobileView ? "hidden" : ""}>Field</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiIndicator
              title="Total Assets"
              value={stats.totalAssets.toString()}
              status="info"
              subtext="Across all categories"
            />
            
            <KpiIndicator
              title="Operational Assets"
              value={stats.operationalAssets.toString()}
              status="good"
              subtext={`${((stats.operationalAssets / stats.totalAssets) * 100).toFixed(1)}% of total assets`}
            />
            
            <KpiIndicator
              title="Assets Requiring Attention"
              value={(stats.requiresMaintenance + stats.underMaintenance).toString()}
              status="warning"
              subtext={`${(((stats.requiresMaintenance + stats.underMaintenance) / stats.totalAssets) * 100).toFixed(1)}% need maintenance`}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Assets by Category</CardTitle>
              </CardHeader>
              <CardContent className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={isMobileView ? 60 : 80}
                      fill={PRIMARY_COLOR}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend layout={isMobileView ? "horizontal" : "vertical"} align="right" verticalAlign="middle" />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Locations by Asset Count</CardTitle>
              </CardHeader>
              <CardContent className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={locationData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: isMobileView ? 80 : 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: isMobileView ? 8 : 10 }} width={isMobileView ? 80 : 100} />
                    <Tooltip />
                    <Bar dataKey="value" fill={PRIMARY_COLOR}>
                      {locationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          {/* Maintenance Alerts Card */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-yellow-600" />
                Maintenance Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-md shadow-sm border border-yellow-200">
                  <h3 className="font-medium text-sm mb-1 flex items-center">
                    <span className="h-3 w-3 rounded-full bg-red-500"></span>
                    Overdue Maintenance
                  </h3>
                  <p className="text-2xl font-bold">{Math.round(stats.totalAssets * 0.05)}</p>
                  <p className="text-xs text-gray-500 mt-1">Assets requiring immediate attention</p>
                </div>
                
                <div className="bg-white p-4 rounded-md shadow-sm border border-yellow-200">
                  <h3 className="font-medium text-sm mb-1 flex items-center">
                    <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
                    Due This Week
                  </h3>
                  <p className="text-2xl font-bold">{Math.round(stats.totalAssets * 0.09)}</p>
                  <p className="text-xs text-gray-500 mt-1">Assets scheduled for maintenance</p>
                </div>
                
                <div className="bg-white p-4 rounded-md shadow-sm border border-yellow-200">
                  <h3 className="font-medium text-sm mb-1 flex items-center">
                    <span className="h-3 w-3 rounded-full bg-green-500"></span>
                    Upcoming (30 days)
                  </h3>
                  <p className="text-2xl font-bold">{Math.round(stats.totalAssets * 0.23)}</p>
                  <p className="text-xs text-gray-500 mt-1">Assets to plan for maintenance</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Installation Date Status</CardTitle>
              <CardDescription>
                {stats.missingInstallationCount} assets ({((stats.missingInstallationCount / stats.totalAssets) * 100).toFixed(1)}%) are missing installation dates
              </CardDescription>
            </CardHeader>
            <CardContent className="h-16">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-blue-600 h-4 rounded-full" 
                  style={{ width: `${100 - ((stats.missingInstallationCount / stats.totalAssets) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span>Missing: {stats.missingInstallationCount}</span>
                <span>Available: {stats.totalAssets - stats.missingInstallationCount}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto">
              <div className="w-full md:w-64">
                <label className="block text-sm font-medium mb-1">Filter by Category</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="w-full md:w-64">
                <label className="block text-sm font-medium mb-1">Filter by Location</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
              
              <div className="w-full md:w-64">
                <label className="block text-sm font-medium mb-1">Search Assets</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  placeholder="Search by name, ID, model..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value.toLowerCase());
                  }}
                />
              </div>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto justify-end">
              <Button 
                className="flex items-center gap-1"
                onClick={() => {
                  toast({
                    title: "Advanced Filter",
                    description: "Advanced filtering options would open here.",
                  });
                }}
              >
                <Filter size={16} />
                <span>Advanced Filter</span>
              </Button>
              <Button 
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => {
                  toast({
                    title: "Export Started",
                    description: `Exporting ${filteredData.length} assets to CSV file...`,
                  });
                }}
              >
                <Download size={16} />
                <span>Export</span>
              </Button>
              <Button 
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => {
                  toast({
                    title: "Print Prepared",
                    description: "Preparing print view of current assets...",
                  });
                }}
              >
                <Printer size={16} />
                <span>Print</span>
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span>All Assets {filteredData.length > 0 ? `(${filteredData.length})` : ''}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-normal text-gray-500">Last refreshed: Today, 14:32</span>
                  <button className="p-1 rounded hover:bg-gray-100">
                    <RefreshCw size={16} />
                  </button>
                </div>
              </CardTitle>
              <CardDescription>
                {selectedCategory !== 'All' && `Category: ${selectedCategory}`}
                {selectedCategory !== 'All' && selectedLocation !== 'All' && ' • '}
                {selectedLocation !== 'All' && `Location: ${selectedLocation}`}
                {searchTerm && (selectedCategory !== 'All' || selectedLocation !== 'All') && ' • '}
                {searchTerm && `Search: "${searchTerm}"`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset ID</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Maintenance</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((asset, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{asset.id}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">{asset.name}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{asset.category}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{asset.location}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{asset.manufacturer}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${asset.status === 'Operational' ? 'bg-green-100 text-green-800' :
                            asset.status === 'Requires Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'}`}>
                            {asset.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{asset.nextMaintenanceDate}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          <button 
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => {
                              toast({
                                title: "Asset Details",
                                description: `Viewing details for ${asset.name}`,
                              });
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab - Basic implementation */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asset Categories</CardTitle>
              <CardDescription>
                Distribution of assets across categories
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill={PRIMARY_COLOR}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locations Tab - Basic implementation */}
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assets by Location</CardTitle>
              <CardDescription>
                {selectedLocation === 'All' ? 'All locations' : `Location: ${selectedLocation}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={locationData}
                  margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0088FE">
                    {locationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Update Data Tab */}
        <TabsContent value="update" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Update Missing Installation Dates</CardTitle>
              <CardDescription>
                Enter installation date information for assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateData} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Asset ID/Tag</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.assetId}
                    onChange={(e) => {
                      const selectedAsset = assetData.find(asset => asset.id === e.target.value);
                      setFormData({
                        ...formData,
                        assetId: e.target.value,
                        installationDate: selectedAsset?.installationDate || '',
                        maintenanceSchedule: ''
                      });
                    }}
                    required
                  >
                    <option value="">Select an asset</option>
                    {assetData
                      .filter(asset => !asset.installationDate)
                      .map((asset, index) => (
                        <option key={index} value={asset.id}>
                          {asset.id} - {asset.name}
                        </option>
                      ))
                    }
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Installation Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-md"
                    value={formData.installationDate}
                    onChange={(e) => setFormData({...formData, installationDate: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Maintenance Schedule</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.maintenanceSchedule}
                    onChange={(e) => setFormData({...formData, maintenanceSchedule: e.target.value})}
                  >
                    <option value="">Select schedule</option>
                    <option value="QUARTERLY">QUARTERLY</option>
                    <option value="HALF YEARLY">HALF YEARLY</option>
                    <option value="YEARLY">YEARLY</option>
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="ON CALL">ON CALL</option>
                    <option value="THIRD PARTY">THIRD PARTY</option>
                  </select>
                </div>
                
                <div className="flex space-x-2">
                  <Button type="submit">
                    Update Asset Information
                  </Button>
                  
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      setFormData({
                        assetId: '',
                        installationDate: '',
                        maintenanceSchedule: ''
                      });
                    }}
                  >
                    Reset Form
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lifecycle Management Tab */}
        <TabsContent value="lifecycle" className="space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Operational Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">
                  {assetData.filter(asset => asset.status === 'Operational').length}
                </div>
                <div className="text-sm text-gray-500">
                  {assetData.length > 0 ? 
                    `${((assetData.filter(asset => asset.status === 'Operational').length / assetData.length) * 100).toFixed(1)}% of total assets` : 
                    '0% of total assets'}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Maintenance Required</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-yellow-600">
                  {assetData.filter(asset => asset.status === 'Requires Maintenance').length}
                </div>
                <div className="text-sm text-gray-500">
                  {assetData.length > 0 ? 
                    `${((assetData.filter(asset => asset.status === 'Requires Maintenance').length / assetData.length) * 100).toFixed(1)}% of total assets` : 
                    '0% of total assets'}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Under Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-red-600">
                  {assetData.filter(asset => asset.status === 'Under Maintenance').length}
                </div>
                <div className="text-sm text-gray-500">
                  {assetData.length > 0 ? 
                    `${((assetData.filter(asset => asset.status === 'Under Maintenance').length / assetData.length) * 100).toFixed(1)}% of total assets` : 
                    '0% of total assets'}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Status Updates</CardTitle>
                <CardDescription>
                  Track and update status across the asset lifecycle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLifecycleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Asset ID/Tag</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={lifecycleAsset.assetId}
                      onChange={(e) => {
                        const selectedAsset = assetData.find(asset => asset.id === e.target.value);
                        setLifecycleAsset({
                          ...lifecycleAsset,
                          assetId: e.target.value,
                          status: selectedAsset?.status || 'Operational',
                          nextMaintenance: selectedAsset?.nextMaintenanceDate || '',
                          notes: ''
                        });
                      }}
                      required
                    >
                      <option value="">Select an asset</option>
                      {assetData.map((asset, index) => (
                        <option key={index} value={asset.id}>
                          {asset.id} - {asset.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Current Status</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={lifecycleAsset.status}
                      onChange={(e) => setLifecycleAsset({...lifecycleAsset, status: e.target.value})}
                      required
                    >
                      <option value="Operational">Operational</option>
                      <option value="Requires Maintenance">Requires Maintenance</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                      <option value="Out of Service">Out of Service</option>
                      <option value="Scheduled for Replacement">Scheduled for Replacement</option>
                      <option value="Decommissioned">Decommissioned</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Next Maintenance Date</label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded-md"
                      value={lifecycleAsset.nextMaintenance}
                      onChange={(e) => setLifecycleAsset({...lifecycleAsset, nextMaintenance: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      className="w-full p-2 border rounded-md"
                      rows={3}
                      value={lifecycleAsset.notes}
                      onChange={(e) => setLifecycleAsset({...lifecycleAsset, notes: e.target.value})}
                      placeholder="Enter any relevant notes about this asset's status"
                    ></textarea>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button type="submit">
                      Update Lifecycle Status
                    </Button>
                    
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        setLifecycleAsset({
                          assetId: '',
                          status: 'Operational',
                          nextMaintenance: '',
                          notes: ''
                        });
                      }}
                    >
                      Reset Form
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Work Orders Tab */}
        <TabsContent value="workorders" className="space-y-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0 mb-4">
            <h2 className="text-xl font-bold">Maintenance Work Orders</h2>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  toast({
                    title: "Create Work Order",
                    description: "Opening work order creation form",
                  });
                }}
              >
                + Create Work Order
              </Button>
              <Button variant="outline">
                Export
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Work Orders</CardTitle>
              <CardDescription>
                Manage and track maintenance activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {workOrders.map(workOrder => (
                      <tr key={workOrder.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{workOrder.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{workOrder.asset}</td>
                        <td className="px-6 py-4">{workOrder.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${workOrder.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                              workOrder.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                              'bg-yellow-100 text-yellow-800'}`}
                          >
                            {workOrder.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{workOrder.assignedTo}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{workOrder.dueDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button 
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            onClick={() => {
                              toast({
                                title: "Edit Work Order",
                                description: `Editing work order: ${workOrder.id}`,
                              });
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => {
                              toast({
                                title: "View Work Order",
                                description: `Viewing details for work order: ${workOrder.id}`,
                              });
                            }}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications/Alerts Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Maintenance Alerts & Notifications</h2>
            
            <div>
              <Button
                variant="outline"
                onClick={() => {
                  setNotifications([]);
                  toast({
                    title: "Notifications Cleared",
                    description: "All notifications marked as read",
                  });
                }}
              >
                Mark All as Read
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No notifications to display
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div key={notification.id} className={`p-4 border-l-4 ${
                      notification.priority === 'high' ? 'border-red-500 bg-red-50' : 
                      notification.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' : 
                      'border-blue-500 bg-blue-50'
                    } rounded-md mb-2`}>
                      <div className="flex justify-between">
                        <h3 className="font-medium">{notification.title}</h3>
                        <span className="text-xs text-gray-500">{notification.date}</span>
                      </div>
                      <p className="text-sm mt-1">{notification.message}</p>
                      <div className="flex mt-2 space-x-2">
                        <button 
                          className="text-xs text-blue-600"
                          onClick={() => {
                            setNotifications(notifications.filter(n => n.id !== notification.id));
                          }}
                        >
                          Mark as Read
                        </button>
                        <button 
                          className="text-xs text-blue-600"
                          onClick={() => {
                            toast({
                              title: "Take Action",
                              description: `Taking action on notification: ${notification.title}`,
                            });
                          }}
                        >
                          Take Action
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Field Technician View - Mobile Optimized */}
        <TabsContent value="fieldwork" className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg shadow mb-4">
            <h2 className="text-lg font-bold mb-2">Field Technician View</h2>
            <p className="text-sm">Optimized for mobile use in the field with essential functions</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button 
              className="p-3 bg-white rounded-lg shadow text-center flex flex-col items-center gap-2"
              onClick={() => setActiveTab('workorders')}
            >
              <Clipboard size={24} className="text-blue-600" />
              <span className="text-sm">Work Orders</span>
            </button>
            
            <button 
              className="p-3 bg-white rounded-lg shadow text-center flex flex-col items-center gap-2"
              onClick={() => {
                toast({
                  title: "Maintenance Dashboard",
                  description: "Opening maintenance dashboard for field technicians",
                });
              }}
            >
              <Wrench size={24} className="text-blue-600" />
              <span className="text-sm">Maintenance</span>
            </button>
            
            <button 
              className="p-3 bg-white rounded-lg shadow text-center flex flex-col items-center gap-2"
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={24} className="text-blue-600" />
              <span className="text-sm">Alerts</span>
            </button>
            
            <button 
              className="p-3 bg-white rounded-lg shadow text-center flex flex-col items-center gap-2"
              onClick={() => setActiveTab('locations')}
            >
              <Map size={24} className="text-blue-600" />
              <span className="text-sm">Locations</span>
            </button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Today's Work Orders</CardTitle>
            </CardHeader>
            <CardContent className="px-2 py-1">
              <div className="space-y-2">
                {workOrders.map(workOrder => (
                  <div key={workOrder.id} className="p-3 bg-gray-50 rounded-md border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{workOrder.id}</div>
                        <div className="text-sm text-gray-600 truncate max-w-xs">{workOrder.description}</div>
                      </div>
                      <span 
                        className={`px-2 py-1 text-xs font-semibold rounded-full 
                        ${workOrder.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                          workOrder.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'}`}
                      >
                        {workOrder.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-gray-500">Asset: {workOrder.asset}</div>
                      <div className="text-xs text-gray-500">Due: {workOrder.dueDate}</div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      <Button variant="default" size="sm" className="text-xs">
                        Start Work
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs">
                        Update Status
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssetLifecycleManagement;
