
import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, Area, AreaChart,
  ComposedChart
} from 'recharts';
import { 
  Droplet, BarChart2, Activity, Calendar, FileText, 
  Filter, Moon, Sun, Download, RefreshCw, Search
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';

// Sample data for 2024-2025
const waterData = {
  "2024": {
    monthly: [
      {month: "Jan", l1: 32803, l2: 11964, l3: 7188, dc: 16725, loss: 4114},
      {month: "Feb", l1: 27996, l2: 10292, l3: 6437, dc: 14781, loss: 2923},
      {month: "Mar", l1: 23860, l2: 11087, l3: 5666, dc: 12920, loss: -147},
      {month: "Apr", l1: 31869, l2: 13380, l3: 7004, dc: 15333, loss: 3156},
      {month: "May", l1: 30737, l2: 11785, l3: 5969, dc: 16304, loss: 2648},
      {month: "Jun", l1: 41953, l2: 15699, l3: 7885, dc: 18927, loss: 7327},
      {month: "Jul", l1: 35166, l2: 18370, l3: 7526, dc: 16319, loss: 477},
      {month: "Aug", l1: 35420, l2: 16401, l3: 7526, dc: 16352, loss: 2667},
      {month: "Sep", l1: 41341, l2: 14818, l3: 7212, dc: 16074, loss: 10449},
      {month: "Oct", l1: 31519, l2: 16461, l3: 6820, dc: 22824, loss: -7766},
      {month: "Nov", l1: 35290, l2: 13045, l3: 6254, dc: 16868, loss: 5377},
      {month: "Dec", l1: 36733, l2: 16148, l3: 6813, dc: 16344, loss: 4241}
    ],
    zoneBulk: [
      {zone: "ZONE FM", consumption: 20646, loss: 1277, lossPercentage: 6.2},
      {zone: "ZONE 3A", consumption: 30198, loss: 18526, lossPercentage: 61.3},
      {zone: "ZONE 3B", consumption: 34837, loss: 19936, lossPercentage: 57.2},
      {zone: "ZONE 5", consumption: 45541, loss: 29089, lossPercentage: 63.9},
      {zone: "ZONE 8", consumption: 37110, loss: 14306, lossPercentage: 38.6},
      {zone: "Village Square", consumption: 1118, loss: 354, lossPercentage: 31.7}
    ],
    zoneMonthly: {
      "ZONE FM": [1595, 1283, 1255, 1383, 1411, 2078, 2601, 1638, 1550, 2098, 1808, 1946],
      "ZONE 3A": [1234, 1099, 1297, 1892, 2254, 2227, 3313, 3172, 2698, 3715, 3501, 3796],
      "ZONE 3B": [2653, 2169, 2315, 2381, 2634, 2932, 3369, 3458, 3742, 2906, 2695, 3583],
      "ZONE 5": [4286, 3897, 4127, 4911, 2639, 4992, 5305, 4039, 2736, 3383, 1438, 3788],
      "ZONE 8": [2170, 1825, 2021, 2753, 2722, 3193, 3639, 3957, 3947, 4296, 3569, 3018],
      "Village Square": [26, 19, 72, 60, 125, 277, 143, 137, 145, 63, 34, 17]
    },
    consumptionByType: [
      {type: "Retail", value: 192667, percentage: 47.6},
      {type: "Residential (Villas)", value: 54771, percentage: 13.5},
      {type: "Residential (Apart)", value: 14145, percentage: 3.5},
      {type: "IRR_Services", value: 27469, percentage: 6.8},
      {type: "MB_Common", value: 2769, percentage: 0.7},
      {type: "D_Building_Bulk", value: 5901, percentage: 1.5},
      {type: "D_Building_Common", value: 390, percentage: 0.1},
      {type: "Loss", value: 118954, percentage: 29.4}
    ],
    typeMonthly: {
      "Retail": [14012, 12880, 11222, 13217, 13980, 15385, 12810, 13747, 13031, 19940, 16458, 15970],
      "Residential (Villas)": [4238, 3745, 3835, 4524, 4581, 5155, 4812, 5087, 4396, 5023, 4292, 5083],
      "Residential (Apart)": [1024, 972, 1059, 1162, 1142, 1132, 1288, 1301, 1118, 1362, 1307, 1278],
      "IRR_Services": [2535, 1713, 1531, 1949, 2180, 3404, 3424, 2514, 2937, 2763, 295, 238],
      "MB_Common": [178, 188, 167, 167, 144, 138, 85, 91, 106, 121, 115, 136],
      "D_Building_Bulk": [425, 381, 463, 562, 421, 491, 530, 546, 499, 563, 451, 569],
      "D_Building_Common": [41, 42, 27, 23, 10, 10, 14, 9, 10, 20, 15, 12]
    },
    payable: {
      "IRR_Services": {consumption: 27469, cost: 36259.08},
      "MB_Common": {consumption: 2769, cost: 3655.08},
      "D_Building_Common": {consumption: 390, cost: 514.8}
    },
    summary: {
      totalConsumption: 404687,
      avgDailyConsumption: 1106,
      totalLoss: 118954,
      lossPercentage: 29.4,
      highestConsumptionMonth: "June",
      lowestConsumptionMonth: "March",
      payableConsumption: 30628,
      payableCost: 40429,
      waterRate: 1.32 // OMR per m³
    }
  },
  "2025": {
    monthly: [
      {month: "Jan", l1: 32580, l2: 15327, l3: 9109, dc: 19897, loss: -2644},
      {month: "Feb", l1: 44043, l2: 14716, l3: 8542, dc: 21338, loss: 7989}
    ],
    zoneBulk: [
      {zone: "ZONE FM", consumption: 3748, loss: -91, lossPercentage: -2.4},
      {zone: "ZONE 3A", consumption: 8508, loss: 6160, lossPercentage: 72.4},
      {zone: "ZONE 3B", consumption: 6218, loss: 3999, lossPercentage: 64.3},
      {zone: "ZONE 5", consumption: 8498, loss: 5854, lossPercentage: 68.9},
      {zone: "ZONE 8", consumption: 3045, loss: -3416, lossPercentage: -112.2},
      {zone: "Village Square", consumption: 26, loss: -114, lossPercentage: -438.5}
    ],
    zoneMonthly: {
      "ZONE FM": [2008, 1740],
      "ZONE 3A": [4235, 4273],
      "ZONE 3B": [3256, 2962],
      "ZONE 5": [4267, 4231],
      "ZONE 8": [1547, 1498],
      "Village Square": [14, 12]
    },
    consumptionByType: [
      {type: "Retail", value: 42015, percentage: 54.8},
      {type: "Residential (Villas)", value: 11300, percentage: 14.7},
      {type: "Residential (Apart)", value: 2826, percentage: 3.7},
      {type: "IRR_Services", value: 4888, percentage: 6.4},
      {type: "MB_Common", value: 610, percentage: 0.8},
      {type: "D_Building_Bulk", value: 1229, percentage: 1.6},
      {type: "D_Building_Common", value: 74, percentage: 0.1},
      {type: "Loss", value: 17737, percentage: 23.1}
    ],
    typeMonthly: {
      "Retail": [19590, 20970],
      "Residential (Villas)": [5827, 5473],
      "Residential (Apart)": [1450, 1376],
      "IRR_Services": [2159, 2729],
      "MB_Common": [148, 129],
      "D_Building_Bulk": [615, 614],
      "D_Building_Common": [37, 37]
    },
    payable: {
      "IRR_Services": {consumption: 4888, cost: 6452.16},
      "MB_Common": {consumption: 610, cost: 805.2},
      "D_Building_Common": {consumption: 74, cost: 97.68}
    },
    summary: {
      totalConsumption: 76623,
      avgDailyConsumption: 1278,
      totalLoss: 17737,
      lossPercentage: 23.1,
      highestConsumptionMonth: "February",
      lowestConsumptionMonth: "January",
      payableConsumption: 5572,
      payableCost: 7355.04,
      waterRate: 1.32 // OMR per m³
    }
  }
};

// Color themes
const themes = {
  light: {
    bg: "bg-gray-50",
    cardBg: "bg-white",
    panelBg: "bg-gray-100",
    border: "border-gray-200",
    text: "text-gray-800",
    textSecondary: "text-gray-500",
    shadow: "shadow",
    primary: "#2563eb",
    secondary: "#6b7280",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#3b82f6",
    chartColors: {
      l1Color: "#3b82f6",
      l2Color: "#10b981",
      l3Color: "#8b5cf6",
      dcColor: "#f59e0b",
      lossColor: "#ef4444",
      l2dcColor: "#059669", // L2 + DC
      l3dcColor: "#7c3aed", // L3 + DC
      bgGrid: "#e5e7eb"
    },
    zoneColors: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#6366f1"],
    typeColors: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#6366f1", "#ec4899", "#14b8a6"]
  },
  dark: {
    bg: "bg-slate-900",
    cardBg: "bg-slate-800",
    panelBg: "bg-slate-800",
    border: "border-slate-700",
    text: "text-slate-100",
    textSecondary: "text-slate-400",
    shadow: "shadow-xl shadow-slate-900/50",
    primary: "#3b82f6",
    secondary: "#94a3b8",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#3b82f6",
    chartColors: {
      l1Color: "#3b82f6",
      l2Color: "#10b981",
      l3Color: "#8b5cf6",
      dcColor: "#f59e0b",
      lossColor: "#ef4444",
      l2dcColor: "#059669", // L2 + DC
      l3dcColor: "#7c3aed", // L3 + DC
      bgGrid: "#334155"
    },
    zoneColors: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#6366f1"],
    typeColors: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#6366f1", "#ec4899", "#14b8a6"]
  }
};

// Helper function to format numbers
const formatNumber = (num, decimals = 0) => {
  if (num === undefined || num === null) return '';
  return num.toLocaleString(undefined, { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

// Component for metric card
const MetricCard = ({ title, value, unit, subValue, subUnit, icon, color, percentage, theme }) => {
  const Icon = icon;
  
  return (
    <div className={`${theme.cardBg} rounded-lg ${theme.shadow} p-6 flex flex-col h-36 relative overflow-hidden transition-colors duration-300`}>
      <div className="absolute left-0 top-0 h-full w-1 bg-opacity-70" style={{ backgroundColor: color }}></div>
      <div className="flex justify-between items-start">
        <div className={`text-sm font-medium ${theme.textSecondary}`}>{title}</div>
        <div className="p-2 rounded-full bg-opacity-20" style={{ backgroundColor: `${color}30` }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      <div className="mt-2 flex items-baseline">
        <div className={`text-3xl font-semibold ${theme.text}`}>{formatNumber(value)}</div>
        <div className={`ml-1 text-sm ${theme.textSecondary}`}>{unit}</div>
      </div>
      {subValue !== undefined && (
        <div className={`mt-1 text-sm ${theme.textSecondary}`}>
          {formatNumber(subValue, subUnit === "OMR" ? 2 : 0)} {subUnit}
          {percentage !== undefined && (
            <span className={`ml-2 ${percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {percentage >= 0 ? '+' : ''}{percentage}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label, theme }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`${theme.cardBg} p-3 border ${theme.border} ${theme.shadow} rounded-md`}>
        <p className={`font-medium ${theme.text}`}>{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {formatNumber(entry.value)} m³
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Filter button component
const FilterButton = ({ label, active, color, onClick, theme }) => {
  return (
    <button
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
        active ? 'bg-opacity-20 shadow-sm' : 'bg-transparent'
      }`}
      style={{ backgroundColor: active ? `${color}30` : '', color: active ? color : theme.text }}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div 
          className="w-2 h-2 rounded-full mr-2" 
          style={{ backgroundColor: color }}
        ></div>
        {label}
      </div>
    </button>
  );
};

// Table component
const DataTable = ({ data, columns, theme }) => {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y ${theme.border}`}>
        <thead className={theme.panelBg}>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={`px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider ${
                  column.numeric ? 'text-right' : ''
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`${theme.cardBg} divide-y ${theme.border}`}>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? theme.cardBg : theme.panelBg}>
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`px-4 py-3 whitespace-nowrap text-sm ${theme.text} ${
                    column.numeric ? 'text-right font-medium' : ''
                  }`}
                >
                  {column.render 
                    ? column.render(row[column.key], row, theme) 
                    : column.numeric && typeof row[column.key] === 'number'
                      ? formatNumber(row[column.key])
                      : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Tab component
const TabButton = ({ label, active, onClick, theme }) => {
  return (
    <button
      className={`px-4 py-2 font-medium text-sm rounded-t-md ${
        active 
          ? `${theme.cardBg} text-blue-600 border-b-2 border-blue-600` 
          : `${theme.textSecondary} hover:text-blue-500`
      } transition-colors duration-200`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

// Button component
const Button = ({ children, icon, onClick, theme, primary = false, className = '' }) => {
  const Icon = icon;
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 
      ${primary 
        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
        : `${theme.panelBg} ${theme.text} hover:bg-opacity-80 border ${theme.border}`
      } ${className}`}
    >
      {icon && <Icon size={16} />}
      <span>{children}</span>
    </button>
  );
};

// Theme toggle component
const ThemeToggle = ({ darkMode, setDarkMode }) => {
  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className={`p-2 rounded-md transition-colors duration-200 ${
        darkMode 
          ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' 
          : 'bg-gray-200 text-blue-900 hover:bg-gray-300'
      }`}
      aria-label="Toggle theme"
    >
      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

// Main dashboard component
const WaterSystemDashboard = () => {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [darkMode, setDarkMode] = useState(false);
  const [visibleSeries, setVisibleSeries] = useState({
    l1: true,
    l2dc: true,
    l3dc: true,
    loss: true
  });
  
  const [visibleZones, setVisibleZones] = useState({
    "ZONE FM": true,
    "ZONE 3A": true,
    "ZONE 3B": true,
    "ZONE 5": true,
    "ZONE 8": true,
    "Village Square": true
  });
  
  const theme = darkMode ? themes.dark : themes.light;
  
  // Filter monthly data based on selected month
  const getFilteredMonthlyData = () => {
    let data;
    if (selectedMonth === "All") {
      data = waterData[selectedYear].monthly;
    } else {
      data = waterData[selectedYear].monthly.filter(item => item.month === selectedMonth);
    }
    
    // Add combined metrics L2+DC and L3+DC to the data
    return data.map(item => ({
      ...item,
      l2dc: item.l2 + item.dc, // Zone Bulk + Direct Connection
      l3dc: item.l3 + item.dc  // Individual Meters + Direct Connection
    }));
  };
  
  // Get filtered zone data based on the selected month
  const getFilteredZoneData = () => {
    if (selectedMonth === "All") {
      return waterData[selectedYear].zoneBulk;
    } else {
      const monthIndex = waterData[selectedYear].monthly.findIndex(m => m.month === selectedMonth);
      if (monthIndex === -1) return waterData[selectedYear].zoneBulk;
      
      return waterData[selectedYear].zoneBulk.map(zone => {
        const monthlyConsumption = waterData[selectedYear].zoneMonthly[zone.zone]?.[monthIndex] || 0;
        // Estimating monthly loss based on annual loss percentage
        const monthlyLoss = Math.round(monthlyConsumption * (zone.lossPercentage / 100));
        
        return {
          ...zone,
          consumption: monthlyConsumption,
          loss: monthlyLoss
        };
      });
    }
  };
  
  // Get filtered consumption by type based on selected month
  const getFilteredConsumptionByType = () => {
    if (selectedMonth === "All") {
      return waterData[selectedYear].consumptionByType;
    } else {
      const monthIndex = waterData[selectedYear].monthly.findIndex(m => m.month === selectedMonth);
      if (monthIndex === -1) return waterData[selectedYear].consumptionByType;
      
      const typeMonthly = waterData[selectedYear].typeMonthly;
      const totalMonthlyConsumption = waterData[selectedYear].monthly[monthIndex].l1;
      
      return waterData[selectedYear].consumptionByType.map(type => {
        const monthlyValue = type.type === "Loss" 
          ? waterData[selectedYear].monthly[monthIndex].loss
          : typeMonthly[type.type]?.[monthIndex] || 0;
        
        return {
          ...type,
          value: monthlyValue,
          percentage: parseFloat(((monthlyValue / totalMonthlyConsumption) * 100).toFixed(1))
        };
      });
    }
  };
  
  // For comparing current year with previous year
  const getCurrentVsPreviousYear = () => {
    if (selectedYear === "2025" && waterData["2024"]) {
      const currentYearData = waterData["2025"];
      const prevYearData = waterData["2024"];
      
      // Get comparable months (only months that exist in both years)
      const comparableMonths = currentYearData.monthly.map(item => item.month)
        .filter(month => prevYearData.monthly.some(m => m.month === month));
      
      if (selectedMonth !== "All" && comparableMonths.includes(selectedMonth)) {
        // Compare specific month across years
        const currentMonth = currentYearData.monthly.find(m => m.month === selectedMonth);
        const prevMonth = prevYearData.monthly.find(m => m.month === selectedMonth);
        
        if (currentMonth && prevMonth) {
          const percentageChange = ((currentMonth.l1 - prevMonth.l1) / prevMonth.l1 * 100).toFixed(1);
          
          return {
            currentTotal: currentMonth.l1,
            prevTotal: prevMonth.l1,
            percentageChange: parseFloat(percentageChange)
          };
        }
      } else {
        // Calculate totals for those months only
        const currentTotal = currentYearData.monthly
          .filter(item => comparableMonths.includes(item.month))
          .reduce((sum, item) => sum + item.l1, 0);
          
        const prevTotal = prevYearData.monthly
          .filter(item => comparableMonths.includes(item.month))
          .reduce((sum, item) => sum + item.l1, 0);
        
        const percentageChange = ((currentTotal - prevTotal) / prevTotal * 100).toFixed(1);
        
        return {
          currentTotal,
          prevTotal,
          percentageChange: parseFloat(percentageChange)
        };
      }
    }
    
    return null;
  };
  
  // Get summary data based on month selection
  const getSummaryData = () => {
    if (selectedMonth === "All") {
      return waterData[selectedYear].summary;
    } else {
      const monthData = waterData[selectedYear].monthly.find(m => m.month === selectedMonth);
      if (!monthData) return waterData[selectedYear].summary;
      
      const daysInMonth = new Date(2024, 
        ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(selectedMonth), 
        0).getDate();
      
      return {
        ...waterData[selectedYear].summary,
        totalConsumption: monthData.l1,
        avgDailyConsumption: Math.round(monthData.l1 / daysInMonth),
        totalLoss: monthData.loss,
        lossPercentage: parseFloat(((monthData.loss / monthData.l1) * 100).toFixed(1)),
        // These will stay the same for monthly view
        highestConsumptionMonth: waterData[selectedYear].summary.highestConsumptionMonth,
        lowestConsumptionMonth: waterData[selectedYear].summary.lowestConsumptionMonth
      };
    }
  };
  
  const yearComparisonData = getCurrentVsPreviousYear();
  const filteredMonthlyData = getFilteredMonthlyData();
  const filteredZoneData = getFilteredZoneData();
  const filteredConsumptionByType = getFilteredConsumptionByType();
  const summaryData = getSummaryData();
  
  // Prepare data for the zone comparison chart
  const prepareZoneComparisonData = () => {
    // Only show the zones that are selected
    const filteredZones = filteredZoneData.filter(zone => visibleZones[zone.zone]);
    
    // Transform to format needed by chart
    const months = waterData[selectedYear].monthly.map(m => m.month);
    
    if (selectedMonth === "All") {
      return months.map((month, index) => {
        const dataPoint = { month };
        
        filteredZones.forEach(zone => {
          dataPoint[zone.zone] = waterData[selectedYear].zoneMonthly[zone.zone][index];
        });
        
        return dataPoint;
      });
    } else {
      const monthIndex = months.indexOf(selectedMonth);
      if (monthIndex === -1) return [];
      
      return [{
        month: selectedMonth,
        ...filteredZones.reduce((acc, zone) => {
          acc[zone.zone] = waterData[selectedYear].zoneMonthly[zone.zone][monthIndex];
          return acc;
        }, {})
      }];
    }
  };
  
  const zoneComparisonData = prepareZoneComparisonData();
  
  // Table columns for zone data
  const zoneColumns = [
    { key: 'zone', header: 'Zone' },
    { key: 'consumption', header: 'Consumption (m³)', numeric: true },
    { key: 'loss', header: 'Loss (m³)', numeric: true },
    { key: 'lossPercentage', header: 'Loss %', numeric: true, 
      render: (value, row, theme) => (
        <span className={value < 0 ? 'text-red-500' : value > 30 ? 'text-orange-500' : 'text-green-500'}>
          {value.toFixed(1)}%
        </span>
      )
    }
  ];

  // Set page title
  useEffect(() => {
    document.title = 'Water System | Muscat Bay Asset Manager';
  }, []);
  
  // Initialize data from Supabase in the future
  useEffect(() => {
    // This would normally fetch data from Supabase
    // const fetchData = async () => {
    //   try {
    //     const { data, error } = await supabase
    //       .from('water_meter_readings')
    //       .select('*');
    //     
    //     if (error) throw error;
    //     // Process and set data
    //   } catch (error) {
    //     console.error('Error fetching water data:', error);
    //   }
    // };
    // 
    // fetchData();
  }, []);

  return (
    <Layout>
      <div className={`min-h-screen ${theme.bg} p-4 md:p-6 transition-colors duration-300`}>
        {/* Header */}
        <div className={`${theme.cardBg} rounded-lg ${theme.shadow} p-4 md:p-6 mb-6 transition-colors duration-300`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="p-3 rounded-full bg-blue-100 mr-4 dark:bg-blue-900">
                <Droplet size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className={`text-2xl font-bold ${theme.text}`}>Water System</h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <select 
                className={`px-3 py-2 border ${theme.border} rounded-md text-sm ${theme.text} ${theme.cardBg}`}
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  // Reset month selection when changing year
                  setSelectedMonth("All");
                }}
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
              </select>
              
              <select 
                className={`px-3 py-2 border ${theme.border} rounded-md text-sm ${theme.text} ${theme.cardBg}`}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="All">All Months</option>
                {waterData[selectedYear].monthly.map(item => (
                  <option key={item.month} value={item.month}>{item.month}</option>
                ))}
              </select>
              
              <Button 
                icon={Download} 
                primary 
                theme={theme}
              >
                Export
              </Button>
              
              <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
            </div>
          </div>
        </div>
        
        {/* Tab navigation */}
        <div className={`${theme.panelBg} rounded-t-lg border-b ${theme.border} mb-0 transition-colors duration-300`}>
          <div className="flex overflow-x-auto">
            <TabButton 
              label="Overview" 
              active={selectedTab === 'overview'} 
              onClick={() => setSelectedTab('overview')} 
              theme={theme}
            />
            <TabButton 
              label="Zone Analysis" 
              active={selectedTab === 'zones'} 
              onClick={() => setSelectedTab('zones')} 
              theme={theme}
            />
            <TabButton 
              label="Consumption Types" 
              active={selectedTab === 'types'} 
              onClick={() => setSelectedTab('types')} 
              theme={theme}
            />
            <TabButton 
              label="Loss Analysis" 
              active={selectedTab === 'loss'} 
              onClick={() => setSelectedTab('loss')} 
              theme={theme}
            />
          </div>
        </div>
        
        <div className={`${theme.cardBg} rounded-b-lg ${theme.shadow} p-4 md:p-6 mb-6 transition-colors duration-300`}>
          <div className={`text-sm ${theme.textSecondary} mb-4`}>
            Showing: {selectedTab === 'overview' ? 'Water System Overview' : 
                     selectedTab === 'zones' ? 'Zone Analysis' :
                     selectedTab === 'types' ? 'Consumption Types' : 'Loss Analysis'} 
            {selectedMonth !== 'All' ? ` for ${selectedMonth} ${selectedYear}` : ` for ${selectedYear}`}
          </div>
          
          {/* Overview Tab */}
          {selectedTab === 'overview' && (
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
                  <Filter size={16} className="mr-1" />
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
                      <Tooltip content={(props) => <CustomTooltip {...props} theme={theme} />} />
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
          )}
          
          {/* Zone Analysis Tab */}
          {selectedTab === 'zones' && (
            <>
              {/* Zone metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard 
                  title="Highest Consumption Zone" 
                  value={filteredZoneData.reduce((prev, current) => 
                    (prev.consumption > current.consumption) ? prev : current
                  ).zone}
                  subValue={filteredZoneData.reduce((prev, current) => 
                    (prev.consumption > current.consumption) ? prev : current
                  ).consumption}
                  subUnit="m³"
                  icon={Droplet}
                  color={theme.success}
                  theme={theme}
                />
                <MetricCard 
                  title="Highest Loss Zone" 
                  value={filteredZoneData.reduce((prev, current) => 
                    (prev.loss > current.loss) ? prev : current
                  ).zone}
                  subValue={filteredZoneData.reduce((prev, current) => 
                    (prev.loss > current.loss) ? prev : current
                  ).loss}
                  subUnit="m³"
                  icon={BarChart2}
                  color={theme.danger}
                  theme={theme}
                />
                <MetricCard 
                  title="Zone Bulk Total" 
                  value={filteredZoneData.reduce((sum, item) => sum + item.consumption, 0)}
                  unit="m³"
                  subValue={(filteredZoneData.reduce((sum, item) => sum + item.consumption, 0) / 
                            summaryData.totalConsumption * 100).toFixed(1)}
                  subUnit="% of Main Bulk"
                  icon={BarChart2}
                  color={theme.info}
                  theme={theme}
                />
                <MetricCard 
                  title="Zone Distribution Loss" 
                  value={filteredZoneData.reduce((sum, item) => sum + (item.loss > 0 ? item.loss : 0), 0)}
                  unit="m³"
                  subValue={(filteredZoneData.reduce((sum, item) => sum + (item.loss > 0 ? item.loss : 0), 0) / 
                            filteredZoneData.reduce((sum, item) => sum + item.consumption, 0) * 100).toFixed(1)}
                  subUnit="% of Zone Bulk"
                  icon={BarChart2}
                  color={theme.warning}
                  theme={theme}
                />
              </div>
              
              {/* Zone filter buttons */}
              <div className="mb-4 flex flex-wrap gap-2">
                <div className={`flex items-center mr-2 ${theme.textSecondary}`}>
                  <Filter size={16} className="mr-1" />
                  <span className="text-sm">Zones:</span>
                </div>
                {filteredZoneData.map((zone, index) => (
                  <FilterButton 
                    key={zone.zone}
                    label={zone.zone} 
                    active={visibleZones[zone.zone]} 
                    color={theme.zoneColors[index % theme.zoneColors.length]}
                    onClick={() => setVisibleZones({
                      ...visibleZones, 
                      [zone.zone]: !visibleZones[zone.zone]
                    })}
                    theme={theme}
                  />
                ))}
              </div>
              
              {/* Zone charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className={`${theme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
                  <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Zone Consumption Distribution</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={filteredZoneData.filter(zone => visibleZones[zone.zone])}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                          outerRadius={80}
                          dataKey="consumption"
                          nameKey="zone"
                        >
                          {filteredZoneData.filter(zone => visibleZones[zone.zone]).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={theme.zoneColors[filteredZoneData.findIndex(z => z.zone === entry.zone) % theme.zoneColors.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatNumber(value) + ' m³'} />
                        <Legend 
                          formatter={(value) => <span className={theme.text}>{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className={`${theme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
                  <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Zone Consumption Trends</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={zoneComparisonData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.chartColors.bgGrid} />
                        <XAxis dataKey="month" tick={{ fill: theme.text }} />
                        <YAxis tick={{ fill: theme.text }} />
                        <Tooltip content={(props) => <CustomTooltip {...props} theme={theme} />} />
                        <Legend wrapperStyle={{ color: theme.text }} />
                        
                        {Object.keys(visibleZones)
                          .filter(zone => visibleZones[zone])
                          .map((zone, index) => (
                            <Line
                              key={zone}
                              type="monotone"
                              dataKey={zone}
                              name={zone}
                              stroke={theme.zoneColors[index % theme.zoneColors.length]}
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                          ))
                        }
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className={`${theme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
                  <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Zone Loss Comparison</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={filteredZoneData.filter(zone => visibleZones[zone.zone])}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.chartColors.bgGrid} />
                        <XAxis type="number" tick={{ fill: theme.text }} />
                        <YAxis type="category" dataKey="zone" tick={{ fill: theme.text }} />
                        <Tooltip content={(props) => <CustomTooltip {...props} theme={theme} />} />
                        <Legend wrapperStyle={{ color: theme.text }} />
                        <Bar dataKey="consumption" name="Consumption" fill={theme.chartColors.l2Color} stackId="a" />
                        <Bar dataKey="loss" name="Loss" fill={theme.chartColors.lossColor} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={`${theme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
                  <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Zone Loss Percentage</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={filteredZoneData.filter(zone => visibleZones[zone.zone] && zone.lossPercentage > 0)}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.chartColors.bgGrid} />
                        <XAxis dataKey="zone" tick={{ fill: theme.text }} />
                        <YAxis unit="%" tick={{ fill: theme.text }} />
                        <Tooltip formatter={(value) => value.toFixed(1) + '%'} />
                        <Legend wrapperStyle={{ color: theme.text }} />
                        <Bar 
                          dataKey="lossPercentage" 
                          name="Loss Percentage"
                          fill={theme.chartColors.lossColor} 
                        >
                          {filteredZoneData
                            .filter(zone => visibleZones[zone.zone] && zone.lossPercentage > 0)
                            .map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.lossPercentage > 50 ? theme.danger : 
                                    entry.lossPercentage > 30 ? theme.warning : theme.success} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Zone data table */}
              <div className={`${theme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
                <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Zone Details</h3>
                <DataTable data={filteredZoneData} columns={zoneColumns} theme={theme} />
              </div>
            </>
          )}
          
          {/* Consumption Types Tab */}
          {selectedTab === 'types' && (
            <>
              {/* Consumption type metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard 
                  title="Retail Consumption" 
                  value={filteredConsumptionByType.find(t => t.type === 'Retail')?.value || 0}
                  unit="m³"
                  subValue={filteredConsumptionByType.find(t => t.type === 'Retail')?.percentage || 0}
                  subUnit="% of total"
                  icon={Activity}
                  color={theme.typeColors[0]}
                  theme={theme}
                />
                <MetricCard 
                  title="Residential (Villas)" 
                  value={filteredConsumptionByType.find(t => t.type === 'Residential (Villas)')?.value || 0}
                  unit="m³"
                  subValue={filteredConsumptionByType.find(t => t.type === 'Residential (Villas)')?.percentage || 0}
                  subUnit="% of total"
                  icon={Activity}
                  color={theme.typeColors[1]}
                  theme={theme}
                />
                <MetricCard 
                  title="Irrigation Services" 
                  value={filteredConsumptionByType.find(t => t.type === 'IRR_Services')?.value || 0}
                  unit="m³"
                  subValue={filteredConsumptionByType.find(t => t.type === 'IRR_Services')?.percentage || 0}
                  subUnit="% of total"
                  icon={Activity}
                  color={theme.typeColors[3]}
                  theme={theme}
                />
                <MetricCard 
                  title="System Loss" 
                  value={filteredConsumptionByType.find(t => t.type === 'Loss')?.value || 0}
                  unit="m³"
                  subValue={filteredConsumptionByType.find(t => t.type === 'Loss')?.percentage || 0}
                  subUnit="% of total"
                  icon={Activity}
                  color={theme.chartColors.lossColor}
                  theme={theme}
                />
              </div>
              
              {/* Water price information */}
              <div className={`flex flex-col md:flex-row gap-4 mb-6`}>
                <div className={`${theme.cardBg} rounded-lg p-4 flex-1 transition-colors duration-300`}>
                  <h3 className={`text-lg font-medium mb-2 ${theme.text}`}>Water Pricing Information</h3>
                  <div className={`text-sm ${theme.textSecondary}`}>
                    <p>Water rate: <span className="font-semibold">{summaryData.waterRate.toFixed(2)} OMR</span> per cubic meter (m³)</p>
                    <p className="mt-2">Total payable consumption: <span className="font-semibold">{formatNumber(summaryData.payableConsumption)} m³</span></p>
                    <p className="mt-2">Total cost: <span className="font-semibold">{formatNumber(summaryData.payableCost, 2)} OMR</span></p>
                  </div>
                </div>
                
                <div className={`${theme.cardBg} rounded-lg p-4 flex-1 transition-colors duration-300`}>
                  <h3 className={`text-lg font-medium mb-2 ${theme.text}`}>Payable Categories</h3>
                  <div className="overflow-x-auto">
                    <table className={`min-w-full ${theme.text}`}>
                      <thead>
                        <tr>
                          <th className="text-left py-2">Category</th>
                          <th className="text-right py-2">Consumption (m³)</th>
                          <th className="text-right py-2">Cost (OMR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(waterData[selectedYear].payable).map(([category, data]) => (
                          <tr key={category}>
                            <td className="py-1">{category}</td>
                            <td className="text-right py-1">{formatNumber(data.consumption)}</td>
                            <td className="text-right py-1">{formatNumber(data.cost, 2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              {/* Consumption type chart */}
              <div className={`${theme.cardBg} rounded-lg p-4 mb-6 transition-colors duration-300`}>
                <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Consumption by Type</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredConsumptionByType}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                        outerRadius={130}
                        dataKey="value"
                        nameKey="type"
                      >
                        {filteredConsumptionByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={theme.typeColors[index % theme.typeColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(value) + ' m³'} />
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        formatter={(value) => <span className={theme.text}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Consumption type table */}
              <div className={`${theme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
                <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Consumption Type Details</h3>
                <DataTable 
                  data={filteredConsumptionByType}
                  columns={[
                    { key: 'type', header: 'Type' },
                    { key: 'value', header: 'Consumption (m³)', numeric: true },
                    { key: 'percentage', header: 'Percentage', numeric: true,
                      render: (value) => `${value.toFixed(1)}%` 
                    }
                  ]}
                  theme={theme}
                />
              </div>
            </>
          )}
          
          {/* Loss Analysis Tab */}
          {selectedTab === 'loss' && (
            <>
              {/* Loss metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard 
                  title="Main Bulk Loss" 
                  value={summaryData.totalLoss}
                  unit="m³"
                  subValue={summaryData.lossPercentage}
                  subUnit="% of Main Bulk"
                  icon={Droplet}
                  color={theme.danger}
                  theme={theme}
                />
                <MetricCard 
                  title="Zone Distribution Loss" 
                  value={filteredZoneData.reduce((sum, item) => sum + (item.loss > 0 ? item.loss : 0), 0)}
                  unit="m³"
                  subValue={(filteredZoneData.reduce((sum, item) => sum + (item.loss > 0 ? item.loss : 0), 0) / 
                            filteredZoneData.reduce((sum, item) => sum + item.consumption, 0) * 100).toFixed(1)}
                  subUnit="% of Zone Bulk"
                  icon={BarChart2}
                  color={theme.warning}
                  theme={theme}
                />
                <MetricCard 
                  title="Highest Loss Zone" 
                  value={filteredZoneData.reduce((prev, current) => 
                    (prev.loss > current.loss) ? prev : current
                  ).zone}
                  subValue={filteredZoneData.reduce((prev, current) => 
                    (prev.loss > current.loss) ? prev : current
                  ).loss}
                  subUnit="m³"
                  icon={BarChart2}
                  color={theme.danger}
                  theme={theme}
                />
                <MetricCard 
                  title="Highest Loss Month" 
                  value={selectedYear === "2024" ? "September" : "February"}
                  subValue={selectedYear === "2024" ? 10449 : 7989}
                  subUnit="m³"
                  icon={Calendar}
                  color={theme.danger}
                  theme={theme}
                />
              </div>
              
              {/* Loss charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className={`${theme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
                  <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Monthly Loss Trend</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={filteredMonthlyData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.chartColors.bgGrid} />
                        <XAxis dataKey="month" tick={{ fill: theme.text }} />
                        <YAxis tick={{ fill: theme.text }} />
                        <Tooltip content={(props) => <CustomTooltip {...props} theme={theme} />} />
                        <Legend wrapperStyle={{ color: theme.text }} />
                        <Bar 
                          dataKey="loss" 
                          name="System Loss"
                          fill={theme.chartColors.lossColor} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="l1" 
                          name="Main Bulk (L1)"
                          stroke={theme.chartColors.l1Color} 
                          strokeWidth={2} 
                          dot={{ r: 4 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className={`${theme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
                  <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Loss Distribution by Zone</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={filteredZoneData.filter(zone => zone.loss > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                          outerRadius={80}
                          dataKey="loss"
                          nameKey="zone"
                        >
                          {filteredZoneData.filter(zone => zone.loss > 0).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={theme.zoneColors[filteredZoneData.findIndex(z => z.zone === entry.zone) % theme.zoneColors.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatNumber(value) + ' m³'} />
                        <Legend 
                          formatter={(value) => <span className={theme.text}>{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Financial impact of losses */}
              <div className={`${theme.cardBg} rounded-lg p-4 mb-6 transition-colors duration-300`}>
                <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Financial Impact of Water Losses</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-lg border ${theme.border}`}>
                    <h4 className={`text-md font-medium ${theme.text}`}>Total Loss Value</h4>
                    <p className="text-2xl font-bold text-red-500 mt-2">
                      {formatNumber(Math.abs(summaryData.totalLoss) * summaryData.waterRate, 2)} OMR
                    </p>
                    <p className={`mt-1 text-sm ${theme.textSecondary}`}>
                      Based on {formatNumber(Math.abs(summaryData.totalLoss))} m³ at {summaryData.waterRate.toFixed(2)} OMR/m³
                    </p>
                  </div>
                  
                  <div className={`p-4 rounded-lg border ${theme.border}`}>
                    <h4 className={`text-md font-medium ${theme.text}`}>Zone Distribution Loss Value</h4>
                    <p className="text-2xl font-bold text-orange-500 mt-2">
                      {formatNumber(filteredZoneData.reduce((sum, item) => sum + (item.loss > 0 ? item.loss : 0), 0) * summaryData.waterRate, 2)} OMR
                    </p>
                    <p className={`mt-1 text-sm ${theme.textSecondary}`}>
                      {formatNumber(filteredZoneData.reduce((sum, item) => sum + (item.loss > 0 ? item.loss : 0), 0))} m³ at {summaryData.waterRate.toFixed(2)} OMR/m³
                    </p>
                  </div>
                  
                  <div className={`p-4 rounded-lg border ${theme.border}`}>
                    <h4 className={`text-md font-medium ${theme.text}`}>Potential Annual Savings</h4>
                    <p className="text-2xl font-bold text-green-500 mt-2">
                      {formatNumber(summaryData.totalLoss * summaryData.waterRate * 0.5, 2)} OMR
                    </p>
                    <p className={`mt-1 text-sm ${theme.textSecondary}`}>
                      If losses are reduced by 50%
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Loss anomalies table */}
              <div className={`${theme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
                <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Measurement Anomalies</h3>
                <DataTable 
                  data={filteredMonthlyData.filter(item => item.loss < 0)}
                  columns={[
                    { key: 'month', header: 'Month' },
                    { key: 'l1', header: 'Main Bulk (m³)', numeric: true },
                    { key: 'l2', header: 'Zone Bulk (m³)', numeric: true },
                    { key: 'dc', header: 'Direct Connection (m³)', numeric: true },
                    { key: 'loss', header: 'Negative Loss (m³)', numeric: true, 
                      render: (value) => (
                        <span className="text-red-500 font-medium">
                          {formatNumber(value)}
                        </span>
                      )
                    }
                  ]}
                  theme={theme}
                />
                {filteredMonthlyData.filter(item => item.loss < 0).length === 0 && (
                  <div className={`text-center ${theme.textSecondary} py-4`}>
                    No measurement anomalies detected for the selected period.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className={`${theme.cardBg} rounded-lg ${theme.shadow} p-4 md:p-6 transition-colors duration-300`}>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className={`text-sm ${theme.textSecondary} mb-2 md:mb-0`}>
              Last updated: March 16, 2025 | Data source: Muscat Bay Water Management System
            </div>
            <div className="flex gap-2">
              <Button icon={RefreshCw} theme={theme}>Refresh Data</Button>
              <Button icon={Search} theme={theme}>Advanced Search</Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WaterSystemDashboard;
