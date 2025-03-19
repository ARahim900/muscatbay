
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Zap, BarChart3, FileText, Clock, Activity, ArrowRight, DownloadCloud, Gauge } from "lucide-react";
import Layout from '@/components/layout/Layout';

const ElectricitySystem = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-3 rounded-xl shadow-lg mr-4">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-muscat-primary">Electricity System</h1>
              <p className="text-muted-foreground">Real-time monitoring and management</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Last Update:</span> Just now
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <DownloadCloud className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>
        
        <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-400">Information</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            Welcome to the Electricity System management dashboard. This interface provides monitoring capabilities for electrical systems throughout Muscat Bay.
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="overview" className="w-full" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <TabsTrigger 
              value="overview" 
              className={`transition-all duration-200 rounded-md ${activeTab === 'overview' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
            >
              <Gauge className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="monitoring"
              className={`transition-all duration-200 rounded-md ${activeTab === 'monitoring' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
            >
              <Activity className="h-4 w-4 mr-2" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger 
              value="reports"
              className={`transition-all duration-200 rounded-md ${activeTab === 'reports' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-0 bg-white dark:bg-gray-800 shadow-soft hover:shadow-md transition-shadow overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
                <CardHeader>
                  <CardTitle className="text-muscat-primary flex items-center">
                    Power Consumption
                    <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">Today</span>
                  </CardTitle>
                  <CardDescription>Current total consumption</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-800 dark:text-white">843.5 kWh</div>
                  <p className="text-muted-foreground flex items-center">
                    Today's usage
                    <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full flex items-center">
                      -2.3% <ArrowRight className="h-3 w-3 -rotate-90" />
                    </span>
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white dark:bg-gray-800 shadow-soft hover:shadow-md transition-shadow overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-600"></div>
                <CardHeader>
                  <CardTitle className="text-muscat-primary">System Status</CardTitle>
                  <CardDescription>All systems operational</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2 animate-pulse-subtle"></div>
                    <span className="text-gray-800 dark:text-gray-200">All systems normal</span>
                  </div>
                  <div className="mt-3 w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">System performance: 94%</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white dark:bg-gray-800 shadow-soft hover:shadow-md transition-shadow overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-amber-300 to-amber-500"></div>
                <CardHeader>
                  <CardTitle className="text-muscat-primary">Alerts</CardTitle>
                  <CardDescription>System notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                    <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span>Scheduled maintenance: Tomorrow, 10:00 AM</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-8">
              <Card className="border-0 bg-white dark:bg-gray-800 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-muscat-primary">Quick Actions</CardTitle>
                  <CardDescription>Common electricity system tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="text-muscat-primary hover:bg-muscat-primary/5 border-muscat-primary/20 hover:border-muscat-primary/30 transition-all">
                      View Consumption History
                    </Button>
                    <Button variant="outline" className="text-muscat-primary hover:bg-muscat-primary/5 border-muscat-primary/20 hover:border-muscat-primary/30 transition-all">
                      Run System Diagnostics
                    </Button>
                    <Button variant="outline" className="text-muscat-primary hover:bg-muscat-primary/5 border-muscat-primary/20 hover:border-muscat-primary/30 transition-all">
                      Generate Monthly Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="monitoring">
            <div className="space-y-6">
              <Card className="border-0 bg-white dark:bg-gray-800 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-muscat-primary">Real-time Monitoring</CardTitle>
                  <CardDescription>Live power metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Real-time monitoring dashboard will be displayed here. The monitoring system is currently being upgraded.
                  </p>
                  <div className="h-64 bg-gray-50 dark:bg-gray-700/50 rounded-md flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-muscat-primary mb-3"></div>
                    <p className="text-gray-500 dark:text-gray-400">Monitoring dashboard loading...</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="reports">
            <div className="space-y-6">
              <Card className="border-0 bg-white dark:bg-gray-800 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-muscat-primary flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-muscat-primary" />
                    Reports
                  </CardTitle>
                  <CardDescription>Generated reports and analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    No reports have been generated yet. Use the form below to create a new report.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Report Type</label>
                      <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-muscat-primary/30 focus:border-muscat-primary transition-all">
                        <option>Daily Consumption</option>
                        <option>Monthly Usage</option>
                        <option>System Performance</option>
                        <option>Efficiency Analysis</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Date Range</label>
                      <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-muscat-primary/30 focus:border-muscat-primary transition-all">
                        <option>Last 7 days</option>
                        <option>Last 30 days</option>
                        <option>Last 3 months</option>
                        <option>Custom range</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Button className="w-full md:w-auto bg-muscat-primary hover:bg-muscat-primary/90 text-white">
                        Generate Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ElectricitySystem;
