
import React from 'react';
import { Building2, CreditCard, FileText, BarChart3 } from 'lucide-react';
import ReserveFundLookup from './ReserveFundLookup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DashboardProps {
  compactView?: boolean;
  darkMode?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ compactView = false, darkMode = false }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Asset Reserve Fund</h1>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            className="bg-background border rounded px-2 py-1 text-sm"
            defaultValue="2025"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 px-3 py-1.5">
            <FileText className="mr-2 h-4 w-4" />
            Export
          </button>
        </div>
      </div>
      
      <Tabs defaultValue="lookup" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="lookup">Lookup</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lookup" className="space-y-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Showing:</span>
            <span className="font-medium">Reserve Fund Lookup</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">234</div>
                <CardDescription>All Muscat Bay properties</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Annual Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">481,310 OMR</div>
                <CardDescription>Reserve fund contributions</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Largest Contribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">21,917 OMR</div>
                <CardDescription>Commercial zone</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Contribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,128 OMR</div>
                <CardDescription>Per property annually</CardDescription>
              </CardContent>
            </Card>
          </div>
          
          <ReserveFundLookup compactView={compactView} darkMode={darkMode} />
        </TabsContent>
        
        <TabsContent value="overview">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex items-center justify-center h-40">
              <div className="flex flex-col items-center">
                <BarChart3 className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">Reserve Fund Overview Coming Soon</h3>
                <p className="text-sm text-muted-foreground">This feature is under development and will be available soon.</p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="zones">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex items-center justify-center h-40">
              <div className="flex flex-col items-center">
                <Building2 className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">Zone Analysis Coming Soon</h3>
                <p className="text-sm text-muted-foreground">Zone-based analysis will be available in a future update.</p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="properties">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex items-center justify-center h-40">
              <div className="flex flex-col items-center">
                <CreditCard className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">Property Listings Coming Soon</h3>
                <p className="text-sm text-muted-foreground">Full property listings with detailed information will be available soon.</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
