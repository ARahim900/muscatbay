
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-muted-foreground text-sm">Scheduled</p>
                <div className="text-2xl font-bold">{statusCounts.scheduled}</div>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-muted-foreground text-sm">In Progress</p>
                <div className="text-2xl font-bold">{statusCounts.inProgress}</div>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-muted-foreground text-sm">Completed</p>
                <div className="text-2xl font-bold">{statusCounts.completed}</div>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-muted-foreground text-sm">Overdue</p>
                <div className="text-2xl font-bold">{statusCounts.overdue}</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Schedule</CardTitle>
          <CardDescription>Upcoming and past maintenance activities for all assets</CardDescription>
        </CardHeader>
        <CardContent>
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
                  <TableHead>Completed Date</TableHead>
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
                    <TableCell>{item.completedDate || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(item.status)} className="flex items-center w-fit">
                        {getStatusIcon(item.status)}
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">Details</Button>
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

const ServiceChargeCalculations = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Calculation Methodology</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-md border">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Fair Allocation Approach</h4>
                  <p className="text-sm text-muted-foreground">
                    Service charges are calculated using a fair allocation methodology that takes into account 
                    property type, size (BUA), and access to facilities like lifts.
                  </p>
                </div>
              </div>
              
              <h4 className="font-medium text-lg">Calculation Formula</h4>
              <div className="space-y-3 p-4 rounded-md border">
                <div>
                  <h5 className="font-medium">Operating Expenses</h5>
                  <p className="text-sm text-muted-foreground">
                    For properties <strong>without lift</strong>:
                    <br />
                    <code className="p-1 bg-muted rounded">
                      Property BUA × (Total Operating Expenses - Lift Maintenance) / Total BUA
                    </code>
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    For properties <strong>with lift</strong>:
                    <br />
                    <code className="p-1 bg-muted rounded">
                      Property BUA × (Total Operating Expenses - Lift Maintenance) / Total BUA + 
                      Property BUA × Lift Maintenance / Total Lift BUA
                    </code>
                  </p>
                </div>
                
                <div className="pt-2 border-t">
                  <h5 className="font-medium">Reserve Fund Contribution</h5>
                  <p className="text-sm text-muted-foreground">
                    <code className="p-1 bg-muted rounded">
                      Property BUA × Zone-Specific Reserve Fund Rate
                    </code>
                  </p>
                </div>
                
                <div className="pt-2 border-t">
                  <h5 className="font-medium">Total Service Charge</h5>
                  <p className="text-sm text-muted-foreground">
                    <code className="p-1 bg-muted rounded">
                      Operating Expense Share + Reserve Fund Contribution
                    </code>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Zone-Specific Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 rounded-md border">
                <h4 className="font-medium mb-2">Zaha (Z3)</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reserve Fund Rate:</span>
                  <span className="font-medium">0.04 OMR/sqft</span>
                </div>
              </div>
              
              <div className="p-3 rounded-md border">
                <h4 className="font-medium mb-2">Nameer (Z5)</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reserve Fund Rate:</span>
                  <span className="font-medium">0.05 OMR/sqft</span>
                </div>
              </div>
              
              <div className="p-3 rounded-md border">
                <h4 className="font-medium mb-2">Wajd (Z8)</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reserve Fund Rate:</span>
                  <span className="font-medium">0.06 OMR/sqft</span>
                </div>
              </div>
              
              <div className="p-3 rounded-md border">
                <h4 className="font-medium mb-2">Commercial</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reserve Fund Rate:</span>
                  <span className="font-medium">0.07 OMR/sqft</span>
                </div>
              </div>
              
              <div className="p-3 rounded-md border">
                <h4 className="font-medium mb-2">Staff Accommodation</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reserve Fund Rate:</span>
                  <span className="font-medium">0.03 OMR/sqft</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Example Calculations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-md border">
              <h4 className="font-medium text-lg mb-3">Zaha Apartment Example</h4>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm">Unit Number:</span>
                  <span className="text-sm font-medium">Z3-061(1A)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Zone:</span>
                  <span className="text-sm font-medium">Zaha (Z3)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">BUA:</span>
                  <span className="text-sm font-medium">115.47 sqft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Property Type:</span>
                  <span className="text-sm font-medium">2 Bedroom Small Apartment</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Lift Access:</span>
                  <span className="text-sm font-medium">Yes</span>
                </div>
              </div>
              
              <div className="space-y-2 pt-3 border-t">
                <div className="flex justify-between">
                  <span className="text-sm">Base Operating Cost:</span>
                  <span className="text-sm font-medium">1,210.43 OMR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Lift Maintenance:</span>
                  <span className="text-sm font-medium">99.00 OMR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Reserve Fund (0.04 OMR/sqft):</span>
                  <span className="text-sm font-medium">4.62 OMR</span>
                </div>
                <div className="flex justify-between font-medium pt-2">
                  <span>Total Annual Service Charge:</span>
                  <span>1,314.05 OMR</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-sm">Quarterly Payment:</span>
                  <span className="text-sm">328.51 OMR</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-sm">Monthly Payment:</span>
                  <span className="text-sm">109.50 OMR</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-md border">
              <h4 className="font-medium text-lg mb-3">Nameer Villa Example</h4>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm">Unit Number:</span>
                  <span className="text-sm font-medium">Z5-008</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Zone:</span>
                  <span className="text-sm font-medium">Nameer (Z5)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">BUA:</span>
                  <span className="text-sm font-medium">497.62 sqft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Property Type:</span>
                  <span className="text-sm font-medium">4 Bedroom Nameer Villa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Lift Access:</span>
                  <span className="text-sm font-medium">No</span>
                </div>
              </div>
              
              <div className="space-y-2 pt-3 border-t">
                <div className="flex justify-between">
                  <span className="text-sm">Base Operating Cost:</span>
                  <span className="text-sm font-medium">2,840.54 OMR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Lift Maintenance:</span>
                  <span className="text-sm font-medium">0.00 OMR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Reserve Fund (0.05 OMR/sqft):</span>
                  <span className="text-sm font-medium">24.88 OMR</span>
                </div>
                <div className="flex justify-between font-medium pt-2">
                  <span>Total Annual Service Charge:</span>
                  <span>2,865.42 OMR</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-sm">Quarterly Payment:</span>
                  <span className="text-sm">716.36 OMR</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-sm">Monthly Payment:</span>
                  <span className="text-sm">238.79 OMR</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ServiceChargeAllocations = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service Charge Allocation by Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <h4 className="font-medium">Operating Expenses Allocation</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Zaha (Z3)</span>
                      <span className="text-sm font-medium">341,220 OMR (55%)</span>
                    </div>
                    <Progress value={55} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Nameer (Z5)</span>
                      <span className="text-sm font-medium">155,100 OMR (25%)</span>
                    </div>
                    <Progress value={25} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Wajd (Z8)</span>
                      <span className="text-sm font-medium">124,080 OMR (20%)</span>
                    </div>
                    <Progress value={20} className="h-2" />
                  </div>
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <h4 className="font-medium">Reserve Fund Allocation</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Zaha (Z3)</span>
                      <span className="text-sm font-medium">53,075 OMR (55%)</span>
                    </div>
                    <Progress value={55} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Nameer (Z5)</span>
                      <span className="text-sm font-medium">24,125 OMR (25%)</span>
                    </div>
                    <Progress value={25} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Wajd (Z8)</span>
                      <span className="text-sm font-medium">19,300 OMR (20%)</span>
                    </div>
                    <Progress value={20} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead>BUA (sqft)</TableHead>
                    <TableHead>Property Count</TableHead>
                    <TableHead>Operating Expenses</TableHead>
                    <TableHead>Reserve Fund</TableHead>
                    <TableHead>Total Service Charges</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Zaha (Z3)</TableCell>
                    <TableCell>45,000</TableCell>
                    <TableCell>180</TableCell>
                    <TableCell>341,220 OMR</TableCell>
                    <TableCell>53,075 OMR</TableCell>
                    <TableCell>394,295 OMR</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Nameer (Z5)</TableCell>
                    <TableCell>21,000</TableCell>
                    <TableCell>33</TableCell>
                    <TableCell>155,100 OMR</TableCell>
                    <TableCell>24,125 OMR</TableCell>
                    <TableCell>179,225 OMR</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Wajd (Z8)</TableCell>
                    <TableCell>16,500</TableCell>
                    <TableCell>22</TableCell>
                    <TableCell>124,080 OMR</TableCell>
                    <TableCell>19,300 OMR</TableCell>
                    <TableCell>143,380 OMR</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Total</TableCell>
                    <TableCell>82,500</TableCell>
                    <TableCell>235</TableCell>
                    <TableCell>620,400 OMR</TableCell>
                    <TableCell>96,500 OMR</TableCell>
                    <TableCell>716,900 OMR</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Service Charge Allocation by Property Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <h4 className="font-medium">Operating Expenses Allocation</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Apartments with Lift</span>
                      <span className="text-sm font-medium">310,200 OMR (50%)</span>
                    </div>
                    <Progress value={50} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Villas</span>
                      <span className="text-sm font-medium">248,160 OMR (40%)</span>
                    </div>
                    <Progress value={40} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Commercial Properties</span>
                      <span className="text-sm font-medium">62,040 OMR (10%)</span>
                    </div>
                    <Progress value={10} className="h-2" />
                  </div>
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <h4 className="font-medium">Lift Maintenance Allocation</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Apartments with Lift</span>
                      <span className="text-sm font-medium">12,127.50 OMR (100%)</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Villas</span>
                      <span className="text-sm font-medium">0 OMR (0%)</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Commercial Properties</span>
                      <span className="text-sm font-medium">0 OMR (0%)</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property Type</TableHead>
                    <TableHead>BUA (sqft)</TableHead>
                    <TableHead>Property Count</TableHead>
                    <TableHead>Base Operating</TableHead>
                    <TableHead>Lift Maintenance</TableHead>
                    <TableHead>Reserve Fund</TableHead>
                    <TableHead>Total Charges</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Apartments with Lift</TableCell>
                    <TableCell>37,500</TableCell>
                    <TableCell>150</TableCell>
                    <TableCell>310,200 OMR</TableCell>
                    <TableCell>12,127.50 OMR</TableCell>
                    <TableCell>48,250 OMR</TableCell>
                    <TableCell>370,577.50 OMR</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Villas</TableCell>
                    <TableCell>38,000</TableCell>
                    <TableCell>65</TableCell>
                    <TableCell>248,160 OMR</TableCell>
                    <TableCell>0 OMR</TableCell>
                    <TableCell>38,600 OMR</TableCell>
                    <TableCell>286,760 OMR</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Commercial Properties</TableCell>
                    <TableCell>7,000</TableCell>
                    <TableCell>20</TableCell>
                    <TableCell>62,040 OMR</TableCell>
                    <TableCell>0 OMR</TableCell>
                    <TableCell>9,650 OMR</TableCell>
                    <TableCell>71,690 OMR</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Total</TableCell>
                    <TableCell>82,500</TableCell>
                    <TableCell>235</TableCell>
                    <TableCell>620,400 OMR</TableCell>
                    <TableCell>12,127.50 OMR</TableCell>
                    <TableCell>96,500 OMR</TableCell>
                    <TableCell>729,027.50 OMR</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PropertyServiceCharges = () => {
  const { data: propertyCharges, isLoading } = useQuery({
    queryKey: ['property-service-charges'],
    queryFn: fetchPropertyServiceCharges
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input 
            placeholder="Search by unit number or owner"
            className="w-64"
          />
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit Number</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Unit Type</TableHead>
              <TableHead>BUA (sqft)</TableHead>
              <TableHead>Lift</TableHead>
              <TableHead>Annual Charge</TableHead>
              <TableHead>Quarterly</TableHead>
              <TableHead>Monthly</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {propertyCharges.map((property) => (
              <TableRow key={property.id}>
                <TableCell className="font-medium">{property.unitNumber}</TableCell>
                <TableCell>{property.zone}</TableCell>
                <TableCell>{property.unitType}</TableCell>
                <TableCell>{property.bua}</TableCell>
                <TableCell>{property.hasLift ? 'Yes' : 'No'}</TableCell>
                <TableCell>{property.totalCharge.toFixed(2)} OMR</TableCell>
                <TableCell>{property.quarterlyCharge.toFixed(2)} OMR</TableCell>
                <TableCell>{property.monthlyCharge.toFixed(2)} OMR</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Service Charge Breakdown</CardTitle>
          <CardDescription>
            Select a property from the table above to view detailed breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Property Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Unit Number:</span>
                  <span className="text-sm font-medium">Z3-061(1A)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Zone:</span>
                  <span className="text-sm font-medium">Zaha (Z3)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Unit Type:</span>
                  <span className="text-sm font-medium">2 Bedroom Small Apartment</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">BUA:</span>
                  <span className="text-sm font-medium">115.47 sqft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Lift Access:</span>
                  <span className="text-sm font-medium">Yes</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Owner Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Owner Name:</span>
                  <span className="text-sm font-medium">Ahmed Al Balushi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm font-medium">ahmed@example.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Phone:</span>
                  <span className="text-sm font-medium">+968 9876 5432</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium mb-3">Service Charge Calculation</h4>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expense Category</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount (OMR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Base Operating Expenses</TableCell>
                    <TableCell>10.48 OMR/sqft</TableCell>
                    <TableCell>1,210.43</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Lift Maintenance</TableCell>
                    <TableCell>0.86 OMR/sqft</TableCell>
                    <TableCell>99.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Reserve Fund Contribution</TableCell>
                    <TableCell>0.04 OMR/sqft</TableCell>
                    <TableCell>4.62</TableCell>
                  </TableRow>
                  <TableRow className="font-medium">
                    <TableCell>Total Annual Service Charge</TableCell>
                    <TableCell></TableCell>
                    <TableCell>1,314.05</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Quarterly Payment</TableCell>
                    <TableCell></TableCell>
                    <TableCell>328.51</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Monthly Payment</TableCell>
                    <TableCell></TableCell>
                    <TableCell>109.50</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-4">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Statement
            </Button>
            <Button>
              Generate Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ServiceChargeSettings = () => {
  const [activeTab, setActiveTab] = useState('rates');
  
  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ['operating-expenses'],
    queryFn: fetchOperatingExpenses
  });
  
  const { data: reserveFundRates, isLoading: loadingRates } = useQuery({
    queryKey: ['reserve-fund-rates'],
    queryFn: fetchReserveFundRates
  });
  
  const isLoading = loadingExpenses || loadingRates;
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="border-b">
        <div className="flex">
          <button
            className={`px-4 py-2 ${activeTab === 'rates' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('rates')}
          >
            Reserve Fund Rates
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'expenses' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('expenses')}
          >
            Operating Expenses
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'policies' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('policies')}
          >
            Policies
          </button>
        </div>
      </div>
      
      {activeTab === 'rates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Reserve Fund Rates</h3>
            <Button size="sm" variant="outline" className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> Add Rate
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead>Rate (OMR/sqm)</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reserveFundRates?.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.zoneCode}</TableCell>
                    <TableCell>{rate.rate.toFixed(2)}</TableCell>
                    <TableCell>
                      {new Date(rate.effectiveDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{rate.notes || '-'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Operating Expenses</h3>
            <Button size="sm" variant="outline" className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Service Provider</TableHead>
                  <TableHead>Monthly Cost</TableHead>
                  <TableHead>Annual Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses?.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.category}</TableCell>
                    <TableCell>{expense.serviceProvider}</TableCell>
                    <TableCell>{expense.monthlyCost.toFixed(2)} OMR</TableCell>
                    <TableCell>{expense.annualCost.toFixed(2)} OMR</TableCell>
                    <TableCell>
                      <Badge variant={expense.status === 'Active' ? 'default' : expense.status === 'Pending' ? 'outline' : 'destructive'}>
                        {expense.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      
      {activeTab === 'policies' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Service Charge Policies</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Define billing frequency and payment terms for service charges.
            </p>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="billingFrequency">Billing Frequency</Label>
                <Select defaultValue="quarterly">
                  <SelectTrigger id="billingFrequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="biannually">Bi-annually</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="paymentDays">Payment Terms (days)</Label>
                <Input id="paymentDays" type="number" defaultValue={30} />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="latePaymentFee">Late Payment Fee (%)</Label>
                <Input id="latePaymentFee" type="number" defaultValue={2} />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Calculation Settings</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configure how service charges are calculated.
            </p>
            
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox id="includeVAT" />
              <Label htmlFor="includeVAT">Include VAT in service charge calculations</Label>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="vatRate">VAT Rate (%)</Label>
              <Input id="vatRate" type="number" defaultValue={5} />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline">Cancel</Button>
            <Button>Save Settings</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetLifecycleManagement;
