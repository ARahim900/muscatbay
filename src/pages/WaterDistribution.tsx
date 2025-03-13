
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ComposedChart, Scatter, ScatterChart, ZAxis, ReferenceLine
} from 'recharts';
import _ from 'lodash';

const WaterDistributionDashboard: React.FC = () => {
  const [selectedPage, setSelectedPage] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState('Jan-25'); // Default to a recent month
  const [selectedZone, setSelectedZone] = useState(''); // Empty string means "All Zones"
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]); // For consumption type filtering
  
  // Define color scheme
  const primaryColor = '#4E4456';
  const secondaryColor = '#6d5d78';
  const accentColor = '#8b7998';
  const lightColor = '#e0d8e6';
  const dangerColor = '#dc3545';
  const warningColor = '#ffc107';
  const successColor = '#198754';
  
  // Color scale for heat map
  const getLossColor = (value: number) => {
    if (value < 10) return successColor;
    if (value < 20) return '#5cb85c';
    if (value < 30) return '#30a5ff';
    if (value < 40) return '#f0ad4e';
    if (value < 50) return warningColor;
    return dangerColor;
  };

  // Array of all months for UI selectors
  const months = ['Jan-24', 'Feb-24', 'Mar-24', 'Apr-24', 'May-24', 'Jun-24', 
                  'Jul-24', 'Aug-24', 'Sep-24', 'Oct-24', 'Nov-24', 'Dec-24', 
                  'Jan-25', 'Feb-25'];

  // Mock data based on our analysis (in a real system this would come from an API/backend)
  const l1Data: Record<string, number> = {
    'Jan-24': 32803, 'Feb-24': 27996, 'Mar-24': 23860, 'Apr-24': 31869, 
    'May-24': 30737, 'Jun-24': 41953, 'Jul-24': 35166, 'Aug-24': 35420, 
    'Sep-24': 41341, 'Oct-24': 31519, 'Nov-24': 35290, 'Dec-24': 36733, 
    'Jan-25': 32580, 'Feb-25': 44043
  };

  const l2ZoneBulkData: Record<string, number> = {
    'Jan-24': 11964, 'Feb-24': 10292, 'Mar-24': 11087, 'Apr-24': 13380, 
    'May-24': 11785, 'Jun-24': 15699, 'Jul-24': 18370, 'Aug-24': 16401, 
    'Sep-24': 14818, 'Oct-24': 16461, 'Nov-24': 13045, 'Dec-24': 16148, 
    'Jan-25': 15327, 'Feb-25': 14716
  };

  const directConnectionData: Record<string, number> = {
    'Jan-24': 16725, 'Feb-24': 14781, 'Mar-24': 12920, 'Apr-24': 15333,
    'May-24': 16304, 'Jun-24': 18927, 'Jul-24': 16319, 'Aug-24': 16352,
    'Sep-24': 16074, 'Oct-24': 22824, 'Nov-24': 16868, 'Dec-24': 16344,
    'Jan-25': 19897, 'Feb-25': 21338
  };

  // Zone-wise data for the selected month
  const zoneData: Record<string, { 
    bulk: Record<string, number>; 
    individual: Record<string, number>;
  }> = {
    'Zone_01_(FM)': {
      bulk: {
        'Jan-24': 1595, 'Feb-24': 1283, 'Mar-24': 1255, 'Apr-24': 1383,
        'May-24': 1411, 'Jun-24': 2078, 'Jul-24': 2601, 'Aug-24': 1638,
        'Sep-24': 1550, 'Oct-24': 2098, 'Nov-24': 1808, 'Dec-24': 1946,
        'Jan-25': 2008, 'Feb-25': 1740
      },
      individual: {
        'Jan-24': 1746, 'Feb-24': 1225, 'Mar-24': 1194, 'Apr-24': 1316,
        'May-24': 1295, 'Jun-24': 1909, 'Jul-24': 2369, 'Aug-24': 1619,
        'Sep-24': 1425, 'Oct-24': 1485, 'Nov-24': 1756, 'Dec-24': 1975,
        'Jan-25': 2062, 'Feb-25': 1832
      }
    },
    'Zone_03_(A)': {
      bulk: {
        'Jan-24': 1234, 'Feb-24': 1099, 'Mar-24': 1297, 'Apr-24': 1892,
        'May-24': 2254, 'Jun-24': 2227, 'Jul-24': 3313, 'Aug-24': 3172,
        'Sep-24': 2698, 'Oct-24': 3715, 'Nov-24': 3501, 'Dec-24': 3796,
        'Jan-25': 4235, 'Feb-25': 4273
      },
      individual: {
        'Jan-24': 1420, 'Feb-24': 1309, 'Mar-24': 1196, 'Apr-24': 1194,
        'May-24': 1409, 'Jun-24': 1187, 'Jul-24': 1183, 'Aug-24': 1482,
        'Sep-24': 1269, 'Oct-24': 2529, 'Nov-24': 2326, 'Dec-24': 2191,
        'Jan-25': 2064, 'Feb-25': 2070
      }
    },
    'Zone_03_(B)': {
      bulk: {
        'Jan-24': 2653, 'Feb-24': 2169, 'Mar-24': 2315, 'Apr-24': 2381,
        'May-24': 2634, 'Jun-24': 2932, 'Jul-24': 3369, 'Aug-24': 3458,
        'Sep-24': 3742, 'Oct-24': 2906, 'Nov-24': 2695, 'Dec-24': 3583,
        'Jan-25': 3256, 'Feb-25': 2962
      },
      individual: {
        'Jan-24': 1709, 'Feb-24': 1471, 'Mar-24': 1553, 'Apr-24': 1572,
        'May-24': 1557, 'Jun-24': 1675, 'Jul-24': 1794, 'Aug-24': 1653,
        'Sep-24': 1503, 'Oct-24': 2412, 'Nov-24': 1975, 'Dec-24': 2574,
        'Jan-25': 2312, 'Feb-25': 1986
      }
    },
    'Zone_05': {
      bulk: {
        'Jan-24': 4286, 'Feb-24': 3897, 'Mar-24': 4127, 'Apr-24': 4911,
        'May-24': 2639, 'Jun-24': 4992, 'Jul-24': 5305, 'Aug-24': 4039,
        'Sep-24': 2736, 'Oct-24': 3383, 'Nov-24': 1438, 'Dec-24': 3788,
        'Jan-25': 4267, 'Feb-25': 4231
      },
      individual: {
        'Jan-24': 2172, 'Feb-24': 1623, 'Mar-24': 1032, 'Apr-24': 1553,
        'May-24': 788, 'Jun-24': 1274, 'Jul-24': 1861, 'Aug-24': 1137,
        'Sep-24': 858, 'Oct-24': 1100, 'Nov-24': 1057, 'Dec-24': 1154,
        'Jan-25': 1254, 'Feb-25': 1233
      }
    },
    'Zone_08': {
      bulk: {
        'Jan-24': 2170, 'Feb-24': 1825, 'Mar-24': 2021, 'Apr-24': 2753,
        'May-24': 2722, 'Jun-24': 3193, 'Jul-24': 3639, 'Aug-24': 3957,
        'Sep-24': 3947, 'Oct-24': 4296, 'Nov-24': 3569, 'Dec-24': 3018,
        'Jan-25': 1547, 'Feb-25': 1498
      },
      individual: {
        'Jan-24': 1986, 'Feb-24': 1560, 'Mar-24': 1749, 'Apr-24': 2597,
        'May-24': 2372, 'Jun-24': 2718, 'Jul-24': 2311, 'Aug-24': 2896,
        'Sep-24': 2493, 'Oct-24': 1977, 'Nov-24': 2070, 'Dec-24': 1680,
        'Jan-25': 1477, 'Feb-25': 1379
      }
    },
    'Zone_VS': {
      bulk: {
        'Jan-24': 26, 'Feb-24': 19, 'Mar-24': 72, 'Apr-24': 60,
        'May-24': 125, 'Jun-24': 277, 'Jul-24': 143, 'Aug-24': 137,
        'Sep-24': 145, 'Oct-24': 63, 'Nov-24': 34, 'Dec-24': 17,
        'Jan-25': 14, 'Feb-25': 12
      },
      individual: {
        'Jan-24': 0, 'Feb-24': 1, 'Mar-24': 16, 'Apr-24': 51,
        'May-24': 33, 'Jun-24': 191, 'Jul-24': 148, 'Aug-24': 125,
        'Sep-24': 134, 'Oct-24': 49, 'Nov-24': 57, 'Dec-24': 34,
        'Jan-25': 35, 'Feb-25': 30
      }
    }
  };

  // Consumption by type data
  const typeConsumptionData: Record<string, Record<string, number>> = {
    'Main BULK': {
      'Jan-24': 32803, 'Feb-24': 27996, 'Mar-24': 23860, 'Apr-24': 31869, 
      'May-24': 30737, 'Jun-24': 41953, 'Jul-24': 35166, 'Aug-24': 35420, 
      'Sep-24': 41341, 'Oct-24': 31519, 'Nov-24': 35290, 'Dec-24': 36733, 
      'Jan-25': 32580, 'Feb-25': 44043
    },
    'IRR_Servies': {
      'Jan-24': 3800, 'Feb-24': 2765, 'Mar-24': 2157, 'Apr-24': 2798,
      'May-24': 2211, 'Jun-24': 4463, 'Jul-24': 5225, 'Aug-24': 2630,
      'Sep-24': 2400, 'Oct-24': 2793, 'Nov-24': 326, 'Dec-24': 295,
      'Jan-25': 208, 'Feb-25': 286
    },
    'MB_Common': {
      'Jan-24': 213, 'Feb-24': 232, 'Mar-24': 190, 'Apr-24': 187,
      'May-24': 175, 'Jun-24': 164, 'Jul-24': 123, 'Aug-24': 136,
      'Sep-24': 143, 'Oct-24': 168, 'Nov-24': 173, 'Dec-24': 283,
      'Jan-25': 273, 'Feb-25': 193
    },
    'Building': {
      'Jan-24': 99, 'Feb-24': 98, 'Mar-24': 70, 'Apr-24': 53,
      'May-24': 22, 'Jun-24': 95, 'Jul-24': 90, 'Aug-24': 10,
      'Sep-24': 4, 'Oct-24': 1, 'Nov-24': 15, 'Dec-24': 42,
      'Jan-25': 68, 'Feb-25': 59
    },
    'Retail': {
      'Jan-24': 15624, 'Feb-24': 13964, 'Mar-24': 12339, 'Apr-24': 14509,
      'May-24': 15255, 'Jun-24': 16688, 'Jul-24': 14206, 'Aug-24': 15365,
      'Sep-24': 15116, 'Oct-24': 21426, 'Nov-24': 18197, 'Dec-24': 17790,
      'Jan-25': 21494, 'Feb-25': 22709
    },
    'Residential (Villa)': {
      'Jan-24': 4626, 'Feb-24': 3591, 'Mar-24': 3709, 'Apr-24': 4724,
      'May-24': 4800, 'Jun-24': 5288, 'Jul-24': 5060, 'Aug-24': 5964,
      'Sep-24': 5178, 'Oct-24': 4955, 'Nov-24': 4719, 'Dec-24': 4789,
      'Jan-25': 4494, 'Feb-25': 4174
    },
    'Residential (Apart)': {
      'Jan-24': 1240, 'Feb-24': 1182, 'Mar-24': 1127, 'Apr-24': 1281,
      'May-24': 1163, 'Jun-24': 1151, 'Jul-24': 1233, 'Aug-24': 1121,
      'Sep-24': 891, 'Oct-24': 1501, 'Nov-24': 1339, 'Dec-24': 1326,
      'Jan-25': 1243, 'Feb-25': 1173
    }
  };

  // Prepare data for charts
  const prepareMonthlyData = () => {
    return months.map(month => ({
      month,
      l1Total: l1Data[month],
      l2ZoneBulk: l2ZoneBulkData[month],
      directConnections: directConnectionData[month],
      totalL2: l2ZoneBulkData[month] + directConnectionData[month],
      loss: l1Data[month] - (l2ZoneBulkData[month] + directConnectionData[month]),
      lossPercentage: ((l1Data[month] - (l2ZoneBulkData[month] + directConnectionData[month])) / l1Data[month] * 100).toFixed(2)
    }));
  };

  const monthlyData = prepareMonthlyData();

  // Prepare zone data for the selected month
  const prepareZoneData = () => {
    // Filter zones based on selection if needed
    let zones = Object.keys(zoneData);
    if (selectedZone) {
      zones = zones.filter(zone => zone === selectedZone);
    }
    
    return zones.map(zone => {
      const bulkValue = zoneData[zone].bulk[selectedMonth];
      const individualValue = zoneData[zone].individual[selectedMonth];
      const difference = bulkValue - individualValue;
      const lossPercentage = bulkValue > 0 ? (difference / bulkValue * 100).toFixed(2) : '0';
      
      return {
        zone,
        bulkValue,
        individualValue,
        difference,
        lossPercentage
      };
    }).sort((a, b) => parseFloat(b.lossPercentage) - parseFloat(a.lossPercentage));
  };

  const zoneDataForSelectedMonth = prepareZoneData();

  // Prepare type consumption data for the selected month
  const prepareTypeConsumptionData = () => {
    return Object.keys(typeConsumptionData).map(type => ({
      type,
      value: typeConsumptionData[type][selectedMonth],
    })).sort((a, b) => b.value - a.value);
  };

  const typeConsumptionForSelectedMonth = prepareTypeConsumptionData();

  // Prepare loss data for the heat map
  const prepareLossHeatMapData = () => {
    // Filter zones based on selection if needed
    let zones = Object.keys(zoneData);
    if (selectedZone && selectedPage === 'zone-analysis') {
      zones = zones.filter(zone => zone === selectedZone);
    }
    
    return zones.map(zone => {
      const monthlyLosses = months.map(month => {
        const bulkValue = zoneData[zone].bulk[month];
        const individualValue = zoneData[zone].individual[month];
        const difference = bulkValue - individualValue;
        const lossPercentage = bulkValue > 0 ? (difference / bulkValue * 100) : 0;
        
        return {
          month,
          zone,
          lossPercentage: lossPercentage > 0 ? parseFloat(lossPercentage.toFixed(2)) : 0
        };
      });
      
      return {
        zone,
        data: monthlyLosses
      };
    });
  };

  const lossHeatMapData = prepareLossHeatMapData();

  // Prepare consumption trend data
  const prepareConsumptionTrendData = () => {
    return months.map(month => {
      const data: Record<string, any> = {
        month
      };
      
      Object.keys(typeConsumptionData).forEach(type => {
        if (type !== 'Main BULK') {
          data[type] = typeConsumptionData[type][month];
        }
      });
      
      return data;
    });
  };

  const consumptionTrendData = prepareConsumptionTrendData();

  // Calculate summary metrics for the selected month
  const l1Total = l1Data[selectedMonth];
  const l2Total = l2ZoneBulkData[selectedMonth] + directConnectionData[selectedMonth];
  const overallLoss = l1Total - l2Total;
  const overallLossPercentage = ((overallLoss / l1Total) * 100).toFixed(2);

  // Function to format large numbers with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Function to determine status color based on value
  const getStatusColor = (percentage: number | string) => {
    const numPercentage = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    if (numPercentage < 10) return successColor;
    if (numPercentage < 30) return warningColor;
    return dangerColor;
  };

  // Render Overview Page
  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Summary Cards */}
      <Card className="bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-2">
          <CardTitle className="text-lg font-bold text-gray-700">L1 Total (Main Bulk)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-center mt-4" style={{ color: primaryColor }}>
            {formatNumber(l1Total)} m³
          </div>
          <div className="text-sm text-gray-500 text-center">Source Meter Reading</div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-2">
          <CardTitle className="text-lg font-bold text-gray-700">L2 Total (Distribution)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-center mt-4" style={{ color: secondaryColor }}>
            {formatNumber(l2Total)} m³
          </div>
          <div className="text-sm text-gray-500 text-center">Zone Bulk + Direct Connections</div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-2">
          <CardTitle className="text-lg font-bold text-gray-700">Overall Loss</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-center mt-4" style={{ color: getStatusColor(parseFloat(overallLossPercentage)) }}>
            {formatNumber(overallLoss)} m³ ({overallLossPercentage}%)
          </div>
          <div className="text-sm text-gray-500 text-center">L1 - L2</div>
        </CardContent>
      </Card>

      {/* Monthly Trend Chart */}
      <Card className="col-span-1 lg:col-span-3 bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-2">
          <CardTitle className="text-lg font-bold text-gray-700">Monthly Water Distribution Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="l1Total" name="L1 Total (Main Bulk)" fill={primaryColor} />
                <Bar dataKey="l2ZoneBulk" name="L2 Zone Bulk" fill={secondaryColor} stackId="a" />
                <Bar dataKey="directConnections" name="Direct Connections" fill={accentColor} stackId="a" />
                <Line type="monotone" dataKey="loss" name="Loss (m³)" stroke={dangerColor} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Loss Distribution */}
      <Card className="col-span-1 lg:col-span-2 bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-2">
          <CardTitle className="text-lg font-bold text-gray-700">Loss Percentage by Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <ReferenceLine y={10} stroke="green" strokeDasharray="3 3" />
                <ReferenceLine y={30} stroke="orange" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="lossPercentage" name="Loss %" stroke={dangerColor} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Consumption by Type */}
      <Card className="col-span-1 bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-2">
          <CardTitle className="text-lg font-bold text-gray-700">Consumption by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeConsumptionForSelectedMonth.filter(d => d.type !== 'Main BULK')}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  fill={primaryColor}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ type, percent }) => `${type}: ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                >
                  {typeConsumptionForSelectedMonth.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={[primaryColor, secondaryColor, accentColor, '#8884d8', '#82ca9d', '#ffc658', '#ff8042'][index % 7]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Zone-wise Analysis Page
  const renderZoneAnalysis = () => (
    <div className="grid grid-cols-1 gap-6">
      {/* Zone-wise Comparison */}
      <Card className="bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <CardTitle className="text-lg font-bold text-gray-700">Zone-wise Consumption and Loss Analysis</CardTitle>
            <div className="mt-2 md:mt-0">
              <select 
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Zones</option>
                {Object.keys(zoneData).map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneDataForSelectedMonth} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="zone" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bulkValue" name="Zone Bulk Meter (m³)" fill={primaryColor} />
                <Bar dataKey="individualValue" name="Sum of Individual Meters (m³)" fill={accentColor} />
                <Line type="monotone" dataKey="lossPercentage" name="Loss %" stroke={dangerColor} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Zone Loss Details Table */}
      <Card className="bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-2">
          <CardTitle className="text-lg font-bold text-gray-700">
            {selectedZone ? `${selectedZone} Details for ${selectedMonth}` : `Zone Details for ${selectedMonth}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Zone</th>
                  <th className="py-3 px-4 text-right">Bulk Meter (m³)</th>
                  <th className="py-3 px-4 text-right">Sum of Individual (m³)</th>
                  <th className="py-3 px-4 text-right">Difference (m³)</th>
                  <th className="py-3 px-4 text-right">Loss %</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {zoneDataForSelectedMonth.map((zone, index) => (
                  <tr 
                    key={index} 
                    className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} cursor-pointer hover:bg-blue-50`}
                    onClick={() => selectedZone === zone.zone ? setSelectedZone('') : setSelectedZone(zone.zone)}
                  >
                    <td className="py-3 px-4 border-b font-medium">
                      {zone.zone}
                      {selectedZone === zone.zone && (
                        <span className="ml-2 text-blue-600">●</span>
                      )}
                    </td>
                    <td className="py-3 px-4 border-b text-right">{formatNumber(zone.bulkValue)}</td>
                    <td className="py-3 px-4 border-b text-right">{formatNumber(zone.individualValue)}</td>
                    <td className="py-3 px-4 border-b text-right">{formatNumber(zone.difference)}</td>
                    <td className="py-3 px-4 border-b text-right font-semibold" style={{ color: getStatusColor(zone.lossPercentage) }}>
                      {zone.lossPercentage}%
                    </td>
                    <td className="py-3 px-4 border-b text-center">
                      <span 
                        className="inline-block w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getStatusColor(zone.lossPercentage) }}
                      ></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Click on any zone row to filter the dashboard to that specific zone.
          </div>
        </CardContent>
      </Card>

      {/* Zone Performance Over Time */}
      <Card className="bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <CardTitle className="text-lg font-bold text-gray-700">
              {selectedZone ? `${selectedZone} Performance Over Time` : 'Zone Performance Over Time'}
            </CardTitle>
            {selectedZone && (
              <button 
                onClick={() => setSelectedZone('')}
                className="mt-2 md:mt-0 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition duration-200"
              >
                View All Zones
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" type="category" allowDuplicatedCategory={false} />
                <YAxis />
                <Tooltip />
                <Legend />
                {lossHeatMapData.map((zone, index) => (
                  <Line 
                    key={index}
                    data={zone.data} 
                    dataKey="lossPercentage" 
                    name={zone.zone} 
                    stroke={[primaryColor, secondaryColor, accentColor, '#8884d8', '#82ca9d', '#ffc658'][index % 6]}
                    type="monotone"
                    strokeWidth={selectedZone === zone.zone ? 3 : 1.5}
                  />
                ))}
                <ReferenceLine y={10} stroke="green" strokeDasharray="3 3" />
                <ReferenceLine y={30} stroke="orange" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Losses Analysis Page
  const renderLossesAnalysis = () => (
    <div className="grid grid-cols-1 gap-6">
      {/* Loss Trend Over Time */}
      <Card className="bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-2">
          <CardTitle className="text-lg font-bold text-gray-700">L1 to L2 Loss Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="loss" name="Loss (m³)" fill={dangerColor} stroke={dangerColor} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Loss Heatmap */}
      <Card className="bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-2">
          <CardTitle className="text-lg font-bold text-gray-700">Zone Loss Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Zone</th>
                  {months.map(month => (
                    <th key={month} className="py-3 px-2 text-center">{month}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lossHeatMapData.map((zone, zoneIndex) => (
                  <tr key={zoneIndex} className={zoneIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-3 px-4 border-b font-medium">{zone.zone}</td>
                    {zone.data.map((item, monthIndex) => (
                      <td 
                        key={`${zoneIndex}-${monthIndex}`} 
                        className="py-3 px-2 border-b text-center text-white font-medium"
                        style={{ 
                          backgroundColor: getLossColor(item.lossPercentage),
                          opacity: 0.7 + (item.lossPercentage > 0 ? 0.3 : 0)
                        }}
                      >
                        {item.lossPercentage.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Loss Zones Scatter Plot */}
      <Card className="bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-2">
          <CardTitle className="text-lg font-bold text-gray-700">Loss vs. Consumption Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" dataKey="bulkValue" name="Consumption (m³)" />
                <YAxis type="number" dataKey="lossPercentage" name="Loss %" />
                <ZAxis type="number" range={[100, 500]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter 
                  name="Zones" 
                  data={zoneDataForSelectedMonth} 
                  fill={primaryColor}
                  shape="circle"
                />
                <ReferenceLine y={10} stroke="green" strokeDasharray="3 3" />
                <ReferenceLine y={30} stroke="orange" strokeDasharray="3 3" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="text-sm text-gray-500 mt-4">
            <p>This chart helps identify high-consumption zones with significant losses. The larger the bubble, the higher the absolute water loss.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Consumption Types Page
  const renderConsumptionTypes = () => {
    // Define color palette for different meter types
    const COLORS: Record<string, string> = {
      'Retail': '#ff8042',
      'Zone Bulk': '#00C49F',
      'Residential (Villa)': '#FFED00', // Yellow
      'Residential (Apart)': '#82ca9d',
      'IRR_Servies': '#0088FE', // Blue
      'MB_Common': '#4E4456', // Dark purple/gray
      'Building': '#B8860B', // Dark yellow
      'D_Building_Bulk': '#a4de6c',
      'D_Building_Common': '#d0ed57',
      'Main BULK': '#ff5252'
    };
    
    // Access available types for filtering
    const availableTypes = Object.keys(typeConsumptionData).filter(type => type !== 'Main BULK');
    
    // Handle type selection toggling
    const handleTypeSelection = (type: string) => {
      setSelectedTypes(prevSelectedTypes => {
        if (prevSelectedTypes.includes(type)) {
          return prevSelectedTypes.filter(t => t !== type);
        } else {
          return [...prevSelectedTypes, type];
        }
      });
    };
    
    // Clear all type selections
    const clearTypeSelection = () => {
      setSelectedTypes([]);
    };
    
    // Prepare the consumption data by type
    const prepareTypeData = () => {
      const typeData = Object.keys(typeConsumptionData)
        .map(type => ({
          name: type,
          value: typeConsumptionData[type][selectedMonth]
        }))
        .sort((a, b) => b.value - a.value);
        
      // Calculate percentages
      const totalConsumption = typeData
        .filter(item => item.name !== 'Main BULK')
        .reduce((sum, item) => sum + item.value, 0);
        
      return typeData.map(item => ({
        ...item,
        percentage: item.name !== 'Main BULK' 
          ? ((item.value / totalConsumption) * 100).toFixed(1) 
          : '0'
      }));
    };
    
    const typeData = prepareTypeData();
    
    // Filter out Main BULK for some charts to focus on actual consumption types
    const filteredTypeData = typeData.filter(item => item.name !== 'Main BULK');
    
    // Apply selected type filters if any are selected
    const typeDataToDisplay = selectedTypes.length > 0 
      ? filteredTypeData.filter(item => selectedTypes.includes(item.name))
      : filteredTypeData;
    
    // Get the types sorted by total consumption for consistent coloring
    const typesByConsumption = [...filteredTypeData]
      .sort((a, b) => b.value - a.value)
      .map(item => item.name);
      
    // Get only selected types for charts if any are selected
    const typesToShow = selectedTypes.length > 0 ? selectedTypes : typesByConsumption;
    
    // Prepare data for trend charts
    const consumptionTrendsByType = months.map(month => {
      const monthData: Record<string, any> = { month };
      Object.keys(typeConsumptionData).forEach(type => {
        monthData[type] = typeConsumptionData[type][month];
      });
      return monthData;
    });
    
    const totalConsumption = l1Data[selectedMonth];

    return (
      <div className="bg-gray-50">
        {/* Type Selector */}
        <div className="bg-white shadow mb-6 rounded-lg">
          <div className="p-4">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-700">Filter by Meter Type</h2>
                {selectedTypes.length > 0 && (
                  <button 
                    onClick={clearTypeSelection}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => handleTypeSelection(type)}
                    className={`px-3 py-1 rounded text-sm flex items-center ${
                      selectedTypes.includes(type) 
                        ? 'bg-indigo-100 border border-indigo-400' 
                        : 'bg-gray-100 border border-gray-300'
                    }`}
                  >
                    <span 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: COLORS[type] || primaryColor }}
                    ></span>
                    {type}
                    {selectedTypes.includes(type) && (
                      <span className="ml-2 text-indigo-600">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Total Consumption Card */}
          <Card className="bg-white shadow-md">
            <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-2">
              <CardTitle className="text-lg font-bold text-gray-700">Total Consumption (Main Bulk)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold" style={{ color: primaryColor }}>{formatNumber(totalConsumption)}</span>
                <span className="ml-2 text-gray-500">m³</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">For {selectedMonth}</p>
            </CardContent>
          </Card>

          {/* Highest Consumer Type Card */}
          <Card className="bg-white shadow-md">
            <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-2">
              <CardTitle className="text-lg font-bold text-gray-700">Top Consumer Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-green-600">
                  {typeDataToDisplay.length > 0 ? typeDataToDisplay[0].name : '-'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {typeDataToDisplay.length > 0 ? 
                  `${formatNumber(typeDataToDisplay[0].value)} m³ (${typeDataToDisplay[0].percentage}% of consumption)` : 
                  ''}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Consumption By Type Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-white shadow-md">
            <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-2">
              <CardTitle className="text-lg font-bold text-gray-700">Consumption by Type ({selectedMonth})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={typeDataToDisplay}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis label={{ value: 'Consumption (m³)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`${formatNumber(value as number)} m³`, 'Consumption']} />
                    <Bar dataKey="value">
                      {typeDataToDisplay.map((entry) => (
                        <Cell key={entry.name} fill={COLORS[entry.name] || primaryColor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-2">
              <CardTitle className="text-lg font-bold text-gray-700">Consumption Distribution (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDataToDisplay}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent ? percent * 100 : 0).toFixed(1)}%`}
                    >
                      {typeDataToDisplay.map((entry) => (
                        <Cell key={entry.name} fill={COLORS[entry.name] || primaryColor} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${formatNumber(value as number)} m³`, 'Consumption']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends */}
        <Card className="bg-white shadow-md mb-6">
          <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-2">
            <CardTitle className="text-lg font-bold text-gray-700">Consumption Trend by Type (Jan-24 to Feb-25)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={consumptionTrendsByType}
                  margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis label={{ value: 'Consumption (m³)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${formatNumber(value as number)} m³`, 'Consumption']} />
                  <Legend />
                  {typesToShow.map((type) => (
                    <Line 
                      type="monotone" 
                      dataKey={type} 
                      key={type}
                      stroke={COLORS[type] || primaryColor} 
                      activeDot={{ r: 8 }} 
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Stacked Area Chart for Overall Composition */}
        <Card className="bg-white shadow-md mb-6">
          <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-2">
            <CardTitle className="text-lg font-bold text-gray-700">Consumption Composition Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={consumptionTrendsByType}
                  margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis label={{ value: 'Consumption (m³)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${formatNumber(value as number)} m³`, 'Consumption']} />
                  <Legend />
                  {typesToShow.map((type) => (
                    <Area 
                      type="monotone" 
                      dataKey={type} 
                      key={type}
                      stackId="1"
                      stroke={COLORS[type] || primaryColor} 
                      fill={COLORS[type] || primaryColor} 
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Consumption Table */}
        <Card className="bg-white shadow-md mb-6">
          <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-2">
            <CardTitle className="text-lg font-bold text-gray-700">Consumption by Type Details ({selectedMonth})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumption Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value (m³)</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {typeDataToDisplay.map((type) => (
                    <tr key={type.name}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[type.name] || primaryColor }}></span>
                          {type.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(type.value)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Set page title
  useEffect(() => {
    document.title = 'Water Distribution Dashboard | Muscat Bay Asset Manager';
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>Muscat Bay Water Distribution Dashboard</h1>
                <p className="text-gray-500">Monitoring hierarchical water flow, consumption, and losses</p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="flex items-center space-x-4">
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {months.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-gray-100 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto py-2">
              <button
                onClick={() => setSelectedPage('overview')}
                className={`px-4 py-2 mr-2 font-medium rounded-lg ${selectedPage === 'overview' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setSelectedPage('zone-analysis')}
                className={`px-4 py-2 mr-2 font-medium rounded-lg ${selectedPage === 'zone-analysis' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Zone Analysis
              </button>
              <button
                onClick={() => setSelectedPage('losses')}
                className={`px-4 py-2 mr-2 font-medium rounded-lg ${selectedPage === 'losses' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Losses
              </button>
              <button
                onClick={() => setSelectedPage('consumption-types')}
                className={`px-4 py-2 mr-2 font-medium rounded-lg ${selectedPage === 'consumption-types' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Consumption Types
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {selectedPage === 'overview' && renderOverview()}
          {selectedPage === 'zone-analysis' && renderZoneAnalysis()}
          {selectedPage === 'losses' && renderLossesAnalysis()}
          {selectedPage === 'consumption-types' && renderConsumptionTypes()}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-500 text-sm">
                © 2025 Muscat Bay Water Management System
              </div>
              <div className="text-gray-500 text-sm mt-2 md:mt-0">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WaterDistributionDashboard;
