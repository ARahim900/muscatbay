import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Droplets, TrendingUp, TrendingDown } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';

// Type definitions for water system data
interface WaterRecord {
  zone: string;
  acctNum: string;
  meterLabel: string;
  type: string;
  consumption: number;
  l2Reading?: number;
  l3Sum?: number;
  loss?: number;
  lossPercent?: number;
}

const WaterSystem = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const allMonths = [
    { value: 'all', label: 'All Months' },
    { value: 'Apr-24', label: 'April 2024' },
    { value: 'May-24', label: 'May 2024' },
    { value: 'Jun-24', label: 'June 2024' },
    { value: 'Jul-24', label: 'July 2024' },
    { value: 'Aug-24', label: 'August 2024' },
    { value: 'Sep-24', label: 'September 2024' },
    { value: 'Oct-24', label: 'October 2024' },
    { value: 'Nov-24', label: 'November 2024' },
    { value: 'Dec-24', label: 'December 2024' },
    { value: 'Jan-25', label: 'January 2025' },
    { value: 'Feb-25', label: 'February 2025' }
  ];

  // Define types for the calculated data
  const waterData: WaterRecord[] = useMemo(() => {
    return [
      {
        zone: "Zone 1",
        acctNum: "12345",
        meterLabel: "Meter A",
        type: "Residential",
        consumption: 150,
      },
      {
        zone: "Zone 2",
        acctNum: "67890",
        meterLabel: "Meter B",
        type: "Commercial",
        consumption: 300,
      },
    ];
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Droplets className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
            <h2 className="text-xl font-medium text-gray-700">Loading Water System Dashboard...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-30 w-full px-4 py-3 bg-white shadow-sm dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
              <Droplets size={20} />
            </div>
            <h1 className="text-xl font-bold">OmniProp</h1>
          </div>
        </div>
      </header>

      <table>
        <tbody>
          {waterData.map((item: WaterRecord) => (
            <tr key={item.acctNum}>
              <td>{item.acctNum}</td>
              <td>{item.meterLabel}</td>
              <td>{item.type}</td>
              <td>{item.zone}</td>
              <td>{item.consumption}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WaterSystem;
