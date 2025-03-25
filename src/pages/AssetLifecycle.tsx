
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, Wrench, FileText, TrendingUp, ListChecks, DollarSign, 
  Plus, Pencil, Loader2, Filter, Download, Info, BarChart3, Search, 
  Calendar, AlertTriangle, CheckCircle2, Clock, Tags
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { fetchOperatingExpenses, fetchReserveFundRates, fetchPropertyServiceCharges } from '@/services/serviceChargeService';
import Layout from '@/components/layout/Layout';
import { Progress } from '@/components/ui/progress';
import { useAssets } from '@/hooks/useAssets';

const AssetLifecycleManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Asset Lifecycle Management</h1>
            <p className="text-muted-foreground">Manage and track the lifecycle of all assets</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search assets..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assets</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="maintenance">Needs Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-1 md:grid-cols-6 lg:w-[900px]">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="condition" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span>Condition Assessment</span>
            </TabsTrigger>
            <TabsTrigger value="critical" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Critical Assets</span>
            </TabsTrigger>
            <TabsTrigger value="forecast" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Lifecycle Forecast</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              <span>Maintenance Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="serviceCharges" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Service Charges</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <AssetOverview />
          </TabsContent>

          <TabsContent value="condition" className="space-y-4">
            <AssetConditionAssessment />
          </TabsContent>

          <TabsContent value="critical" className="space-y-4">
            <CriticalAssets />
          </TabsContent>

          <TabsContent value="forecast" className="space-y-4">
            <LifecycleForecast />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <MaintenanceSchedule />
          </TabsContent>

          <TabsContent value="serviceCharges" className="space-y-4">
            <ServiceChargeSection />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

const ServiceChargeSection = () => {
  const [activeTab, setActiveTab] = useState('calculations');
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service Charges</CardTitle>
          <CardDescription>Manage and calculate service charges for properties</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-b mb-6">
            <div className="flex flex-wrap -mb-px">
              <button
                className={`mr-4 py-2 px-1 border-b-2 ${activeTab === 'calculations' ? 'border-primary font-medium' : 'border-transparent text-muted-foreground'}`}
                onClick={() => setActiveTab('calculations')}
              >
                Calculation Methodology
              </button>
              <button
                className={`mr-4 py-2 px-1 border-b-2 ${activeTab === 'allocations' ? 'border-primary font-medium' : 'border-transparent text-muted-foreground'}`}
                onClick={() => setActiveTab('allocations')}
              >
                Charge Allocations
              </button>
              <button
                className={`mr-4 py-2 px-1 border-b-2 ${activeTab === 'properties' ? 'border-primary font-medium' : 'border-transparent text-muted-foreground'}`}
                onClick={() => setActiveTab('properties')}
              >
                Property Charges
              </button>
              <button
                className={`mr-4 py-2 px-1 border-b-2 ${activeTab === 'settings' ? 'border-primary font-medium' : 'border-transparent text-muted-foreground'}`}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
            </div>
          </div>
          
          {activeTab === 'calculations' && <ServiceChargeCalculations />}
          {activeTab === 'allocations' && <ServiceChargeAllocations />}
          {activeTab === 'properties' && <PropertyServiceCharges />}
          {activeTab === 'settings' && <ServiceChargeSettings />}
        </CardContent>
      </Card>
    </div>
  );
};

// Placeholder components for ServiceChargeSection
const ServiceChargeCalculations = () => (
  <div>
    <h3 className="text-lg font-medium mb-4">Calculation Methodology</h3>
    <p className="text-muted-foreground">Service charge calculation methodology will be displayed here.</p>
  </div>
);

const ServiceChargeAllocations = () => (
  <div>
    <h3 className="text-lg font-medium mb-4">Charge Allocations</h3>
    <p className="text-muted-foreground">Service charge allocations will be displayed here.</p>
  </div>
);

const PropertyServiceCharges = () => (
  <div>
    <h3 className="text-lg font-medium mb-4">Property Charges</h3>
    <p className="text-muted-foreground">Property service charges will be displayed here.</p>
  </div>
);

const ServiceChargeSettings = () => (
  <div>
    <h3 className="text-lg font-medium mb-4">Settings</h3>
    <p className="text-muted-foreground">Service charge settings will be displayed here.</p>
  </div>
);

const AssetOverview = () => {
  const { 
    assets, 
    categorySummary, 
    locationSummary, 
    criticalAssets, 
    assetConditions, 
    loading, 
    error 
  } = useAssets();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary metrics
  const totalAssets = assets.length;
  const totalCategories = new Set(assets.map(asset => asset.assetCategName)).size;
  const totalLocations = new Set(assets.map(asset => asset.locationName)).size;
  
  // Count assets by condition
  const conditionCounts = {
    excellent: assetConditions.filter(c => c.condition === 'Excellent').length,
    good: assetConditions.filter(c => c.condition === 'Good').length,
    fair: assetConditions.filter(c => c.condition === 'Fair').length,
    poor: assetConditions.filter(c => c.condition === 'Poor').length,
    critical: assetConditions.filter(c => c.condition === 'Critical').length
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalAssets}</div>
            <p className="text-muted-foreground text-sm">Total Assets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalCategories}</div>
            <p className="text-muted-foreground text-sm">Asset Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalLocations}</div>
            <p className="text-muted-foreground text-sm">Asset Locations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{criticalAssets.length}</div>
            <p className="text-muted-foreground text-sm">Critical Assets</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categorySummary.slice(0, 5).map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{item.category}</span>
                    <div className="text-sm font-medium">
                      {item.count} ({item.percentage.toFixed(1)}%)
                    </div>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Assets by Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {locationSummary.slice(0, 5).map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{item.location}</span>
                    <div className="text-sm font-medium">
                      {item.count} ({item.percentage.toFixed(1)}%)
                    </div>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Asset Condition Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="border-green-500 border-l-4">
              <CardContent className="p-4">
                <div className="text-lg font-bold">{conditionCounts.excellent}</div>
                <p className="text-sm">Excellent</p>
              </CardContent>
            </Card>
            <Card className="border-blue-500 border-l-4">
              <CardContent className="p-4">
                <div className="text-lg font-bold">{conditionCounts.good}</div>
                <p className="text-sm">Good</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-500 border-l-4">
              <CardContent className="p-4">
                <div className="text-lg font-bold">{conditionCounts.fair}</div>
                <p className="text-sm">Fair</p>
              </CardContent>
            </Card>
            <Card className="border-orange-500 border-l-4">
              <CardContent className="p-4">
                <div className="text-lg font-bold">{conditionCounts.poor}</div>
                <p className="text-sm">Poor</p>
              </CardContent>
            </Card>
            <Card className="border-red-500 border-l-4">
              <CardContent className="p-4">
                <div className="text-lg font-bold">{conditionCounts.critical}</div>
                <p className="text-sm">Critical</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Assets</CardTitle>
          <Button variant="outline" size="sm">View All</Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Tag</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.slice(0, 5).map((asset) => (
                  <TableRow key={asset.assetId}>
                    <TableCell className="font-medium">{asset.assetTag}</TableCell>
                    <TableCell>{asset.assetName}</TableCell>
                    <TableCell>{asset.assetCategName}</TableCell>
                    <TableCell>{asset.locationName}</TableCell>
                    <TableCell>
                      <Badge variant={asset.isAssetActive === "YES" ? "default" : "outline"}>
                        {asset.isAssetActive === "YES" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AssetConditionAssessment = () => {
  const { assets, assetConditions, loading, error } = useAssets();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Join asset conditions with asset details
  const conditionsWithDetails = assetConditions.map(condition => {
    const asset = assets.find(a => a.assetId === condition.assetId);
    return {
      ...condition,
      assetTag: asset?.assetTag || '',
      assetName: asset?.assetName || '',
      category: asset?.assetCategName || '',
      location: asset?.locationName || ''
    };
  });

  const getConditionBadgeVariant = (condition: string) => {
    switch (condition) {
      case 'Excellent': return 'default';
      case 'Good': return 'outline';
      case 'Fair': return 'secondary';
      case 'Poor': return 'destructive';
      case 'Critical': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Asset Condition Assessment</CardTitle>
          <CardDescription>Review and manage the condition of all assets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search assets..."
                  className="pl-8"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Assessment
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Tag</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Assessment Date</TableHead>
                  <TableHead>Est. Life Remaining</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conditionsWithDetails.slice(0, 10).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.assetTag}</TableCell>
                    <TableCell>{item.assetName}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>
                      <Badge variant={getConditionBadgeVariant(item.condition)}>
                        {item.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.assessmentDate}</TableCell>
                    <TableCell>{item.estimatedLifeRemaining} months</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const CriticalAssets = () => {
  const { criticalAssets, loading, error } = useAssets();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Critical Assets</CardTitle>
          <CardDescription>Assets requiring immediate attention or special monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search critical assets..."
                  className="pl-8"
                />
              </div>
            </div>
            <Button>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Tag</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criticalAssets.slice(0, 10).map((asset) => (
                  <TableRow key={asset.assetId}>
                    <TableCell className="font-medium">{asset.assetTag}</TableCell>
                    <TableCell>{asset.assetName}</TableCell>
                    <TableCell>{asset.assetCategName}</TableCell>
                    <TableCell>{asset.locationName}</TableCell>
                    <TableCell>{asset.assetBrand}</TableCell>
                    <TableCell>{asset.assetModel}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">Critical Asset Management</h4>
                <p className="text-sm text-muted-foreground">
                  Critical assets have been identified based on missing PPM frequency data, indicating a potential
                  risk in maintenance planning. These assets require immediate review to ensure proper lifecycle management.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const LifecycleForecast = () => {
  const { lifecycleForecast, loading, error } = useAssets();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group assets by replacement year
  const assetsByYear = lifecycleForecast.reduce((acc, asset) => {
    const year = asset.replacementYear;
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(asset);
    return acc;
  }, {} as Record<number, typeof lifecycleForecast>);

  // Sort years for display
  const years = Object.keys(assetsByYear).map(Number).sort();

  // Calculate total replacement costs by year
  const replacementCostsByYear = years.map(year => {
    const assets = assetsByYear[year];
    const totalCost = assets.reduce((sum, asset) => sum + (asset.replacementCost || 0), 0);
    return { year, count: assets.length, totalCost };
  });

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lifecycle Forecast</CardTitle>
          <CardDescription>Projected asset replacement timeline and budget planning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {replacementCostsByYear.slice(0, 3).map((item) => (
              <Card key={item.year}>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-1">{item.year}</h3>
                  <div className="text-2xl font-bold">{item.totalCost.toLocaleString()} OMR</div>
                  <p className="text-muted-foreground text-sm">{item.count} assets to replace</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Expected Lifespan</TableHead>
                  <TableHead>Remaining Lifespan</TableHead>
                  <TableHead>Replacement Year</TableHead>
                  <TableHead>Replacement Cost</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lifecycleForecast.slice(0, 10).map((asset) => (
                  <TableRow key={asset.assetId}>
                    <TableCell className="font-medium">{asset.assetName}</TableCell>
                    <TableCell>{asset.assetCategory}</TableCell>
                    <TableCell>{Math.floor(asset.expectedLifespan / 12)} years</TableCell>
                    <TableCell>{Math.floor(asset.remainingLifespan / 12)} years {asset.remainingLifespan % 12} months</TableCell>
                    <TableCell>{asset.replacementYear}</TableCell>
                    <TableCell>{asset.replacementCost?.toLocaleString()} OMR</TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(asset.priority)}>
                        {asset.priority}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const MaintenanceSchedule = () => {
  const { maintenanceSchedule, assets, loading, error } = useAssets();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Join maintenance schedule with asset details
  const maintenanceWithDetails = maintenanceSchedule.map(maintenance => {
    const asset = assets.find(a => a.assetId === maintenance.assetId);
    return {
      ...maintenance,
      assetTag: asset?.assetTag || '',
      assetName: asset?.assetName || '',
      category: asset?.assetCategName || '',
      location: asset?.locationName || ''
    };
  });

  // Count maintenance by status
  const statusCounts = {
    scheduled: maintenanceSchedule.filter(m => m.status === 'Scheduled').length,
    inProgress: maintenanceSchedule.filter(m => m.status === 'In Progress').length,
    completed: maintenanceSchedule.filter(m => m.status === 'Completed').length,
    overdue: maintenanceSchedule.filter(m => m.status === 'Overdue').length
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'outline';
      case 'In Progress': return 'secondary';
      case 'Completed': return 'default';
      case 'Overdue': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Scheduled': return <Calendar className="h-4 w-4 mr-1" />;
      case 'In Progress': return <Clock className="h-4 w-4 mr-1" />;
      case 'Completed': return <CheckCircle2 className="h-4 w-4 mr-1" />;
      case 'Overdue': return <AlertTriangle className="h-4 w-4 mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Schedule</CardTitle>
          <CardDescription>Upcoming and past maintenance activities for assets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-blue-500 border-l-4">
              <CardContent className="p-4">
                <div className="text-lg font-bold">{statusCounts.scheduled}</div>
                <p className="text-sm">Scheduled</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-500 border-l-4">
              <CardContent className="p-4">
                <div className="text-lg font-bold">{statusCounts.inProgress}</div>
                <p className="text-sm">In Progress</p>
              </CardContent>
            </Card>
            <Card className="border-green-500 border-l-4">
              <CardContent className="p-4">
                <div className="text-lg font-bold">{statusCounts.completed}</div>
                <p className="text-sm">Completed</p>
              </CardContent>
            </Card>
            <Card className="border-red-500 border-l-4">
              <CardContent className="p-4">
                <div className="text-lg font-bold">{statusCounts.overdue}</div>
                <p className="text-sm">Overdue</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search maintenance..."
                  className="pl-8"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="inProgress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Maintenance
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Maintenance Type</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceWithDetails.slice(0, 10).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.assetName}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{item.maintenanceType}</TableCell>
                    <TableCell>{item.scheduledDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          <div className="flex items-center">
                            {getStatusIcon(item.status)}
                            {item.status}
                          </div>
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetLifecycleManagement;
