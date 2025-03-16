
import React from 'react';
import { Droplet, BarChart2, Calendar, FileText } from 'lucide-react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import MetricCard from './MetricCard';
import FilterButton from './FilterButton';
import DataTable from './DataTable';
import CustomTooltip from './CustomTooltip';
import { formatNumber } from '@/utils/waterDashboardData';

interface OverviewTabProps {
  filteredMonthlyData: any[];
  summaryData: any;
  yearComparisonData: any;
  visibleSeries: {
    l1: boolean;
    l2dc: boolean;
    l3dc: boolean;
    loss: boolean;
  };
  setVisibleSeries: React.Dispatch<React.SetStateAction<{
    l1: boolean;
    l2dc: boolean;
    l3dc: boolean;
    loss: boolean;
  }>>;
  theme: any;
  selectedYear: string;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  filteredMonthlyData,
  summaryData,
  yearComparisonData,
  visibleSeries,
  setVisibleSeries,
  theme,
  selectedYear
}) => {
  return (
    <>
      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard 
          title="Total Consumption" 
          value={summaryData.totalConsumption}
          unit="m³"
          subValue={summaryData.avgDailyConsumption}
          subUnit="m³/day avg."
          icon={Droplet}
          color={theme.chartColors.l1Color}
          percentage={yearComparisonData ? yearComparisonData.percentageChange : undefined}
          theme={theme}
        />
        <MetricCard 
          title="Total System Loss" 
          value={summaryData.totalLoss}
          unit="m³"
          subValue={summaryData.lossPercentage}
          subUnit="% of total"
          icon={BarChart2}
          color={theme.chartColors.lossColor}
          theme={theme}
        />
        <MetricCard 
          title="Highest Month" 
          value={selectedYear === "2024" ? 41953 : 44043}
          unit="m³"
          subValue={summaryData.highestConsumptionMonth}
          subUnit=""
          icon={Calendar}
          color={theme.info}
          theme={theme}
        />
        <MetricCard 
          title="Payable Consumption" 
          value={summaryData.payableConsumption}
          unit="m³"
          subValue={summaryData.payableCost}
          subUnit="OMR"
          icon={FileText}
          color={theme.warning}
          theme={theme}
        />
      </div>

      {/* Filter buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className={`flex items-center mr-2 ${theme.textSecondary}`}>
          <span className="text-sm">Data Series:</span>
        </div>
        <FilterButton 
          label="Main Bulk (L1)" 
          active={visibleSeries.l1} 
          color={theme.chartColors.l1Color}
          onClick={() => setVisibleSeries({...visibleSeries, l1: !visibleSeries.l1})}
          theme={theme}
        />
        <FilterButton 
          label="Zone Bulk + DC (L2+DC)" 
          active={visibleSeries.l2dc} 
          color={theme.chartColors.l2dcColor}
          onClick={() => setVisibleSeries({...visibleSeries, l2dc: !visibleSeries.l2dc})}
          theme={theme}
        />
        <FilterButton 
          label="Individual Meters + DC (L3+DC)" 
          active={visibleSeries.l3dc} 
          color={theme.chartColors.l3dcColor}
          onClick={() => setVisibleSeries({...visibleSeries, l3dc: !visibleSeries.l3dc})}
          theme={theme}
        />
        <FilterButton 
          label="System Loss" 
          active={visibleSeries.loss} 
          color={theme.chartColors.lossColor}
          onClick={() => setVisibleSeries({...visibleSeries, loss: !visibleSeries.loss})}
          theme={theme}
        />
      </div>

      {/* Main chart */}
      <div className={`${theme.cardBg} rounded-lg p-4 mb-6 transition-colors duration-300`}>
        <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Monthly Water Consumption</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={filteredMonthlyData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme.chartColors.bgGrid} />
              <XAxis dataKey="month" tick={{ fill: theme.text }} />
              <YAxis tick={{ fill: theme.text }} />
              <Tooltip content={(props: any) => <CustomTooltip {...props} theme={theme} />} />
              <Legend wrapperStyle={{ color: theme.text }} />
              {visibleSeries.l1 && <Line 
                type="monotone" 
                dataKey="l1" 
                name="Main Bulk (L1)"
                stroke={theme.chartColors.l1Color} 
                strokeWidth={2} 
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />}
              {visibleSeries.l2dc && <Line 
                type="monotone" 
                dataKey="l2dc" 
                name="Zone Bulk + DC (L2+DC)"
                stroke={theme.chartColors.l2dcColor} 
                strokeWidth={2} 
                dot={{ r: 4 }}
              />}
              {visibleSeries.l3dc && <Line 
                type="monotone" 
                dataKey="l3dc" 
                name="Individual Meters + DC (L3+DC)"
                stroke={theme.chartColors.l3dcColor} 
                strokeWidth={2} 
                dot={{ r: 4 }}
              />}
              {visibleSeries.loss && <Bar 
                dataKey="loss" 
                name="System Loss"
                fill={theme.chartColors.lossColor} 
                fillOpacity={0.7}
              />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Monthly data table */}
      <div className={`${theme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
        <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Monthly Consumption Details</h3>
        <DataTable 
          data={filteredMonthlyData}
          columns={[
            { key: 'month', header: 'Month' },
            { key: 'l1', header: 'Main Bulk (m³)', numeric: true },
            { key: 'l2dc', header: 'Zone Bulk + DC (m³)', numeric: true },
            { key: 'l3dc', header: 'Individual Meters + DC (m³)', numeric: true },
            { key: 'loss', header: 'System Loss (m³)', numeric: true, 
              render: (value, row, theme) => (
                <span className={value < 0 ? 'text-red-500' : theme.text}>
                  {formatNumber(value)}
                </span>
              )
            }
          ]}
          theme={theme}
        />
      </div>
    </>
  );
};

export default OverviewTab;
