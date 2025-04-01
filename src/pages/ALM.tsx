
import React, { useState } from 'react';
import { BarChart3, FileSpreadsheet, Calendar, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ALM = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("2023");
  
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const years = ["2023", "2024", "2025"];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center">
            <BarChart3 size={20} />
          </div>
          <h1 className="text-2xl font-bold">Asset Lifecycle Management</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" className="gap-2">
            <Download size={16} />
            Export
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 size={16} />
            Overview
          </TabsTrigger>
          <TabsTrigger value="detailed" className="gap-2">
            <FileSpreadsheet size={16} />
            Detailed
          </TabsTrigger>
          <TabsTrigger value="forecast" className="gap-2">
            <Calendar size={16} />
            Forecast
          </TabsTrigger>
        </TabsList>
        
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing: <span className="font-medium">Asset Management Data for {selectedYear}</span>
          </p>
        </div>
        
        <TabsContent value="overview" className="mt-0">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0 h-[calc(100vh-260px)] min-h-[500px] relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              )}
              <iframe 
                src="https://financial-visualizer-alameeri900.replit.app/" 
                className="w-full h-full rounded-md"
                onLoad={handleIframeLoad}
                title="Asset Lifecycle Management"
                style={{ border: 'none' }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="detailed" className="mt-0">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0 h-[calc(100vh-260px)] min-h-[500px] relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              )}
              <iframe 
                src="https://financial-visualizer-alameeri900.replit.app/" 
                className="w-full h-full rounded-md"
                onLoad={handleIframeLoad}
                title="Asset Lifecycle Management - Detailed"
                style={{ border: 'none' }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="forecast" className="mt-0">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0 h-[calc(100vh-260px)] min-h-[500px] relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              )}
              <iframe 
                src="https://financial-visualizer-alameeri900.replit.app/" 
                className="w-full h-full rounded-md"
                onLoad={handleIframeLoad}
                title="Asset Lifecycle Management - Forecast"
                style={{ border: 'none' }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ALM;
