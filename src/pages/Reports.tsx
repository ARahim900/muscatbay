
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { FileBarChart, Filter, Download, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FinancialReports from '@/components/reports/FinancialReports';

const Reports = () => {
  const [year, setYear] = useState<string>("2023");
  const [month, setMonth] = useState<string>("all");
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg mr-3">
                <FileBarChart className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports Management</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  View and analyze operational reports
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2">
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[120px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[120px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  <SelectItem value="01">January</SelectItem>
                  <SelectItem value="02">February</SelectItem>
                  <SelectItem value="03">March</SelectItem>
                  <SelectItem value="04">April</SelectItem>
                  <SelectItem value="05">May</SelectItem>
                  <SelectItem value="06">June</SelectItem>
                  <SelectItem value="07">July</SelectItem>
                  <SelectItem value="08">August</SelectItem>
                  <SelectItem value="09">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        
        <div className="mb-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="operational">Operational</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>
            
            <p className="text-sm text-muted-foreground mb-4">
              Showing: <span className="font-medium">All Reports</span>
            </p>
            
            <TabsContent value="overview" className="mt-0">
              <div className="bg-card rounded-lg border shadow-sm overflow-hidden h-[calc(100vh-280px)] min-h-[500px]">
                <iframe 
                  src="https://aitable.ai/share/shrVgCRjXVZUA5M2VZdWn" 
                  className="w-full h-full border-0"
                  title="Reports Management"
                  allow="fullscreen"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="operational" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Operational Reports</CardTitle>
                  <CardDescription>
                    View and analyze operational metrics and performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] flex items-center justify-center border border-dashed rounded-lg">
                    <p className="text-muted-foreground">Select a specific operational report to view</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="financial" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Reports</CardTitle>
                  <CardDescription>
                    Financial metrics, budgets and expenditure analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FinancialReports />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="maintenance" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Reports</CardTitle>
                  <CardDescription>
                    Maintenance schedules, history and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] flex items-center justify-center border border-dashed rounded-lg">
                    <p className="text-muted-foreground">Select a specific maintenance report to view</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
