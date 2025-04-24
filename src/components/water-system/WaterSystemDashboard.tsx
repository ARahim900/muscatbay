
"use client"
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterButton } from "@/components/water-system/FilterButton";
import { MetricCard } from "@/components/water-system/MetricCard";
import { DataTable } from "@/components/water-system/DataTable";
import { ArrowDown, ArrowUp, Droplets, Gauge } from 'lucide-react';
import { useWaterData } from '@/hooks/useWaterData';
import { themeConfig } from '@/lib/theme-config';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function WaterSystemDashboard() {
  // Use the water data hook to fetch data
  const { data, zoneData, systemEfficiency, loading, error, updateFilters } = useWaterData();
  
  // Define the theme from config
  const theme = themeConfig;
  
  // Handle filter button clicks
  const handleZoneFilterClick = (zone: string) => {
    updateFilters({ zone });
  };
  
  const handleTimeFilterClick = (month: string) => {
    updateFilters({ period: month });
  };
  
  // Handle loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        
        <Skeleton className="h-64" />
      </div>
    );
  }
  
  // Handle error state
  if (error || !data) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || 'Failed to load water system data. Please try again later.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Extract total consumption and ensure it exists
  const totalConsumption = data.total?.consumption || 0;
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Water System Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and analyze water consumption and efficiency
          </p>
        </div>
        <div className="flex gap-2">
          <FilterButton onClick={() => handleZoneFilterClick('all')}>
            All Zones
          </FilterButton>
          <FilterButton onClick={() => handleTimeFilterClick('last30days')}>
            Last 30 Days
          </FilterButton>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          title="Total Consumption"
          value={totalConsumption}
          unit="m³"
          icon={<Droplets className="h-4 w-4" />}
          trend={{
            value: 12.5,
            icon: ArrowUp,
            label: "vs. last month"
          }}
          lossPercent={0}
          secondaryValue={0}
          secondaryUnit=""
        />
        <MetricCard
          title="System Efficiency"
          value={systemEfficiency || 94.0}
          unit="%"
          icon={<Gauge className="h-4 w-4" />}
          trend={{
            value: -2.1,
            icon: ArrowDown,
            label: "vs. last month"
          }}
          lossPercent={0}
          secondaryValue={0}
          secondaryUnit=""
        />
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Consumption by Zone</CardTitle>
            <CardDescription>
              Water usage distribution across different zones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
