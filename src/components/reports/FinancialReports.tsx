
import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, Sector, PieLabelRenderProps
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// --- Projected Data (Based on 2021 RFS for EOY 2025) ---
const projectedTotalBalanceEOY2025 = 1464317;
const projectedContribution2025 = 268406;
const projectedExpenditure2025 = 68510;
const totalAssetsInventoriedRFS = 230;

const projectedBalanceByArea = [
  { name: 'Master Comm.', value: 798352 },
  { name: 'Typical Bldgs', value: 227018 },
  { name: 'Staff Accom.', value: 273878 },
  { name: 'Zone 3', value: 63604 },
  { name: 'Zone 5', value: 63581 },
  { name: 'Zone 8', value: 37884 },
];

// Approx. Total Current Replacement Cost (from 2021 RFS Costs)
const costByCategory = [
  { name: 'Infrastructure', value: 2000000 },
  { name: 'MEP', value: 1500000 },
  { name: 'Finishes/Structure', value: 500000 },
  { name: 'Landscaping', value: 500000 },
];

// Example data for funding trend
const fundingTrendData = [
  { year: '2021', balance: 900000 },
  { year: '2022', balance: 1050000 },
  { year: '2023', balance: 1200000 },
  { year: '2024', balance: 1350000 },
  { year: '2025', balance: projectedTotalBalanceEOY2025 },
  { year: '2026', balance: 1600000 },
  { year: '2027', balance: 1750000 },
];

const upcomingReplacements = [
  { component: 'Elevator Wire Ropes', location: 'Typical Buildings', year: 2026, cost: 2500 },
  { component: 'Lagoon - Infrastructure', location: 'Master Comm.', year: 2026, cost: 42000 },
  { component: 'External Wall Paint', location: 'Typical Buildings', year: 2027, cost: 1500 },
  { component: 'Landscaping Elements', location: 'Zones 3/5/8', year: 2026, cost: 'Various' },
  { component: 'Fire Extinguishers', location: 'Typical Buildings', year: 2025, cost: 129 },
];

const contributionRates2025 = [
  { area: 'Master Community', rate: 1.75 },
  { area: 'Typical Buildings', rate: 1.65 },
  { area: 'Zone 3', rate: 0.44 },
  { area: 'Zone 5', rate: 1.10 },
  { area: 'Zone 8', rate: 0.33 },
  { area: 'Staff Accommodation', rate: 3.95 },
];

// Colors for Charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#DA70D6'];

// Custom label for Pie Chart
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelRenderProps & { percent: number }) => {
  if (cx === undefined || cy === undefined || midAngle === undefined || innerRadius === undefined || outerRadius === undefined || percent === undefined) {
    return null; // Guard against undefined values
  }
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface KpiCardProps {
  title: string;
  value: string;
  description?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, description }) => (
  <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
    <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
    <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
  </div>
);

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, children }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
    <div>
      {children}
    </div>
  </div>
);

const FinancialReports: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">Reserve Fund Dashboard (Projected EOY 2025)</h1>
      <p className="text-sm text-red-600">Note: All figures based on 2021 RFS projections. Actuals may vary.</p>

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Projected Total Balance" value={`OMR ${projectedTotalBalanceEOY2025.toLocaleString()}`} description="End of Year 2025 Estimate" />
        <KpiCard title="Projected Annual Contribution" value={`OMR ${projectedContribution2025.toLocaleString()}`} description="For Year 2025" />
        <KpiCard title="Projected Annual Expenditure" value={`OMR ${projectedExpenditure2025.toLocaleString()}`} description="For Year 2025" />
        <KpiCard title="Assets Inventoried (RFS)" value={totalAssetsInventoriedRFS.toString()} description="Count from 2021 RFS Appendices" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funding Trend Chart */}
        <DashboardCard title="Projected Funding Trend (Total Balance)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fundingTrendData} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis width={80} tickFormatter={(value) => `OMR ${Math.round(value / 1000)}k`} />
                <Tooltip formatter={(value: number) => `OMR ${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="balance" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} name="Projected Balance" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        {/* Cost by Category Chart */}
        <DashboardCard title="Est. Total Replacement Value by Category (2021 Costs)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costByCategory} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize="10px" />
                <YAxis width={80} tickFormatter={(value) => `OMR ${Math.round(value / 1000000)}M`} />
                <Tooltip formatter={(value: number) => `OMR ${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" name="Est. Replacement Cost" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </div>

      {/* Tables/Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Replacements Table */}
        <DashboardCard title="Key Upcoming Replacements (Projected 2025-2027)">
          <div className="overflow-x-auto max-h-72">
            <table className="min-w-full text-sm table-fixed">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="w-2/5 text-left p-2 font-semibold">Component</th>
                  <th className="w-1/5 text-left p-2 font-semibold">Location</th>
                  <th className="w-1/5 text-center p-2 font-semibold">Year</th>
                  <th className="w-1/5 text-right p-2 font-semibold">Est. Cost (OMR)</th>
                </tr>
              </thead>
              <tbody>
                {upcomingReplacements.map((item, index) => (
                  <tr key={index} className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="p-2 truncate">{item.component}</td>
                    <td className="p-2 truncate">{item.location}</td>
                    <td className="p-2 text-center">{item.year}</td>
                    <td className="p-2 text-right">{typeof item.cost === 'number' ? item.cost.toLocaleString() : item.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>

        {/* Balance by Area */}
        <DashboardCard title="Projected EOY 2025 Balance by Area">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectedBalanceByArea}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {projectedBalanceByArea.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `OMR ${value.toLocaleString()}`} />
                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{fontSize: '10px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        {/* Contribution Rates */}
        <DashboardCard title="Est. Contribution Rates (2025)">
          <div className="space-y-2">
            {contributionRates2025.map(item => (
              <div key={item.area} className="flex justify-between text-sm border-b pb-1">
                <span>{item.area}:</span>
                <span className="font-medium">OMR {item.rate.toFixed(2)} / Sq.m.</span>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
      
      {/* Add Village Square Note */}
      <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md">
        <h4 className="font-bold">Note: Village Square (Opened 2023)</h4>
        <p className="text-sm">Common area assets specific to the Village Square commercial area may require a supplementary assessment, as they were not fully detailed in the 2021 RFS. Costs for these assets are typically allocated to commercial units unless governing documents state otherwise.</p>
      </div>
    </div>
  );
};

export default FinancialReports;
