
import React, { useState } from 'react';
import { 
  Droplet, BarChart2, Activity, Calendar, FileText, 
  Filter, Download, RefreshCw, Search
} from 'lucide-react';

import { waterData, themes } from '@/utils/waterDashboardData';
import MetricCard from '@/components/water/dashboard/MetricCard';
import FilterButton from '@/components/water/dashboard/FilterButton';
import DataTable from '@/components/water/dashboard/DataTable';
import CustomTooltip from '@/components/water/dashboard/CustomTooltip';
import TabButton from '@/components/water/dashboard/TabButton';
import Button from '@/components/water/dashboard/Button';
import ThemeToggle from '@/components/water/dashboard/ThemeToggle';
import OverviewTab from '@/components/water/dashboard/OverviewTab';
import ZoneAnalysisTab from '@/components/water/dashboard/ZoneAnalysisTab';

const WaterSystem = () => {
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
        lossPercentage: parseFloat(((monthData.loss / monthData.l1) * 100).toFixed(1))
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

  const handleExport = () => {
    console.log('Export functionality to be implemented');
  };

  const handleRefresh = () => {
    console.log('Refresh functionality to be implemented');
  };

  const handleSearch = () => {
    console.log('Search functionality to be implemented');
  };

  return (
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
              onClick={handleExport}
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
        
        {selectedTab === 'overview' && (
          <OverviewTab
            filteredMonthlyData={filteredMonthlyData}
            summaryData={summaryData}
            yearComparisonData={yearComparisonData}
            visibleSeries={visibleSeries}
            setVisibleSeries={setVisibleSeries}
            theme={theme}
            selectedYear={selectedYear}
          />
        )}
        
        {selectedTab === 'zones' && (
          <ZoneAnalysisTab
            filteredZoneData={filteredZoneData}
            zoneComparisonData={zoneComparisonData}
            summaryData={summaryData}
            visibleZones={visibleZones}
            setVisibleZones={setVisibleZones}
            theme={theme}
            zoneColumns={zoneColumns}
          />
        )}
      </div>
      
      {/* Footer */}
      <div className={`${theme.cardBg} rounded-lg ${theme.shadow} p-4 md:p-6 transition-colors duration-300`}>
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className={`text-sm ${theme.textSecondary} mb-2 md:mb-0`}>
            Last updated: March 16, 2025 | Data source: Muscat Bay Water Management System
          </div>
          <div className="flex gap-2">
            <Button icon={RefreshCw} onClick={handleRefresh} theme={theme}>Refresh Data</Button>
            <Button icon={Search} onClick={handleSearch} theme={theme}>Advanced Search</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterSystem;
