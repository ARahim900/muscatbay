
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Wrench, FileText, TrendingUp, ListChecks, Plus, Pencil, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { fetchOperatingExpenses, fetchReserveFundRates } from '@/services/serviceChargeService';
import Layout from '@/components/layout/Layout';

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
              <ListChecks className="h-4 w-4" />
              <span>Service Charges</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Asset Overview</CardTitle>
                <CardDescription>Summary of all assets and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Overview content will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="condition" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Condition Assessment</CardTitle>
                <CardDescription>Assess the condition of assets</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Condition assessment content will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="critical" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Critical Assets</CardTitle>
                <CardDescription>List of critical assets</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Critical assets content will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lifecycle Forecast</CardTitle>
                <CardDescription>Forecast the lifecycle of assets</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Lifecycle forecast content will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Schedule</CardTitle>
                <CardDescription>Schedule maintenance for assets</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Maintenance schedule content will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="serviceCharges" className="space-y-4">
            <ServiceChargeSettings />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

// Define a proper interface for ServiceChargeSettings props
interface OperatingExpenseDisplay {
  id: string;
  category: string;
  serviceProvider: string;
  monthlyCost: number;
  annualCost: number;
  status: string;
}

const ServiceChargeSettings = () => {
  const [activeTab, setActiveTab] = useState('rates');
  
  // Fetch the necessary data
  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ['operating-expenses'],
    queryFn: fetchOperatingExpenses
  });
  
  const { data: reserveFundRates, isLoading: loadingRates } = useQuery({
    queryKey: ['reserve-fund-rates'],
    queryFn: fetchReserveFundRates
  });
  
  // Make sure we have data before rendering
  const isLoading = loadingExpenses || loadingRates;
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Service Charge Configuration</CardTitle>
        <CardDescription>
          Configure service charge parameters, rates, and expenses
        </CardDescription>
        
        <div className="mt-4 border-b">
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
      </CardHeader>
      
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default AssetLifecycleManagement;
