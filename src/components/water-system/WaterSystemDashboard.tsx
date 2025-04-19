
"use client"
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/water-system/MetricCard";
import { FilterButton } from "@/components/water-system/FilterButton";
import { ArrowDown, ArrowUp, Droplets, Gauge } from 'lucide-react';
import { waterData } from '@/data/water-data';
import { themeConfig } from '@/lib/theme-config';
import { formatNumber } from '@/lib/utils';

export function WaterSystemDashboard() {
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
          <FilterButton>All Zones</FilterButton>
          <FilterButton>Last 30 Days</FilterButton>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          title="Total Consumption"
          value="48,234"
          unit="m³"
          icon={<Droplets className="h-4 w-4" />}
          trend={{
            value: 12.5,
            icon: ArrowUp,
            label: "from previous period"
          }}
        />
        <MetricCard
          title="System Efficiency"
          value="94.2"
          unit="%"
          icon={<Gauge className="h-4 w-4" />}
          trend={{
            value: -2.1,
            icon: ArrowDown,
            label: "from target"
          }}
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
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Data table would be displayed here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
