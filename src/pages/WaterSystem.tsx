import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, Area, AreaChart, ComposedChart 
} from 'recharts';
import { 
  Droplet, BarChart2, TrendingDown, TrendingUp, 
  Activity, Calendar, FileText, Settings,
  Filter, Moon, Sun, Upload, Download, RefreshCw
} from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';

// Main Water System Dashboard Component
function WaterSystemDashboard() {
  // State management
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedZone, setSelectedZone] = useState("All");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [darkMode, setDarkMode] = useState(false);
  const [visibleSeries, setVisibleSeries] = useState({ l1: true, l2: true, l3: true, loss: true });
  const [isLoading, setIsLoading] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [rawData, setRawData] = useState(null);

  // Theme configuration
  const theme = {
    light: {
      bg: "bg-gray-50",
      cardBg: "bg-white",
      panelBg: "bg-gray-100",
      border: "border-gray-200",
      text: "text-gray-800",
      textSecondary: "text-gray-500",
      shadow: "shadow",
      primary: "#4E4456", // Deep purple (primary brand color)
      secondary: "#6B7280",
      success: "#10B981", // Green
      warning: "#F59E0B", // Amber
      danger: "#EF4444", // Red
      info: "#6366F1", // Indigo
      chartColors: {
        l1Color: "#4E4456", // Primary color for main bulk
        l2Color: "#10B981", // Green for zone bulk
        l3Color: "#8B5CF6", // Purple for individual meters
        dcColor: "#F59E0B", // Amber for direct connections
        lossColor: "#EF4444", // Red for losses
        bgGrid: "#E5E7EB"
      },
      zoneColors: ["#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#6366F1", "#A855F7"],
      typeColors: ["#10B981", "#8B5CF6", "#F59E0B", "#6366F1", "#EC4899", "#14B8A6"]
    },
    dark: {
      bg: "bg-slate-900",
      cardBg: "bg-slate-800",
      panelBg: "bg-slate-800",
      border: "border-slate-700",
      text: "text-slate-100",
      textSecondary: "text-slate-400",
      shadow: "shadow-xl shadow-slate-900/50",
      primary: "#4E4456", // Keep the same primary color
      secondary: "#94A3B8",
      success: "#10B981",
      warning: "#F59E0B",
      danger: "#EF4444",
      info: "#6366F1",
      chartColors: {
        l1Color: "#4E4456",
        l2Color: "#10B981",
        l3Color: "#8B5CF6",
        dcColor: "#F59E0B",
        lossColor: "#EF4444",
        bgGrid: "#334155"
      },
      zoneColors: ["#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#6366F1", "#A855F7"],
      typeColors: ["#10B981", "#8B5CF6", "#F59E0B", "#6366F1", "#EC4899", "#14B8A6"]
    }
  };

  const currentTheme = darkMode ? theme.dark : theme.light;

  // Helper functions
  const formatNumber = (num, decimals = 0) => {
    if (num === undefined || num === null) return '';
    const numericValue = Number(num);
    if (isNaN(numericValue)) return '';
    return numericValue.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Loading Sample Data
  useEffect(() => {
    const loadSampleData = async () => {
      setIsLoading(true);
      try {
        const fileContent = await window.fs.readFile('Database Master', { encoding: 'utf8' });
        processWaterData(fileContent);
      } catch (error) {
        console.error("Error loading sample data:", error);
      }
      setIsLoading(false);
    };

    loadSampleData();
  }, []);

  const processWaterData = (csvData) => {
    // Parse CSV data
    const parseResult = Papa.parse(csvData, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim()
    });
    
    const parsedData = parseResult.data;
    setRawData(parsedData);
    
    // Process the data into the required format
    const processedData = processDataForDashboard(parsedData);
    setProcessedData(processedData);
  };

  const processDataForDashboard = (data) => {
    // Filter out any rows with invalid or empty data
    const validData = data.filter(row => 
      row['Meter Label'] && 
      row['Acct #'] && 
      row['Label']
    );
    
    // Exclude meter with Acct # 4300322 as mentioned in requirements
    const filteredData = validData.filter(row => row['Acct #'] !== 4300322);
    
    // Get all months from Jan-24 to Mar-25
    const months = [
      'Jan-24', 'Feb-24', 'Mar-24', 'Apr-24', 'May-24', 'Jun-24', 
      'Jul-24', 'Aug-24', 'Sep-24', 'Oct-24', 'Nov-24', 'Dec-24',
      'Jan-25', 'Feb-25', 'Mar-25'
    ];
    
    // Process data for each month
    const monthlyData = months.map(month => {
      // Calculate L1 (Main Bulk)
      const l1Meter = filteredData.find(row => row['Label'] === 'L1');
      const l1Reading = l1Meter ? l1Meter[month] || 0 : 0;
      
      // Calculate L2 (Zone Bulk)
      const l2Meters = filteredData.filter(row => row['Label'] === 'L2');
      const l2Reading = l2Meters.reduce((sum, meter) => sum + (meter[month] || 0), 0);
      
      // Calculate DC (Direct Connections)
      const dcMeters = filteredData.filter(row => row['Label'] === 'DC');
      const dcReading = dcMeters.reduce((sum, meter) => sum + (meter[month] || 0), 0);
      
      // Calculate L3 (Individual Meters)
      const l3Meters = filteredData.filter(row => row['Label'] === 'L3');
      const l3Reading = l3Meters.reduce((sum, meter) => sum + (meter[month] || 0), 0);
      
      // Calculate L2 + DC for stage 1 loss calculation
      const l2dcReading = l2Reading + dcReading;
      
      // Calculate losses
      const stage1Loss = l1Reading - l2dcReading;
      const stage2Loss = l2dcReading - (l3Reading + dcReading);
      const totalLoss = l1Reading - (l3Reading + dcReading);
      
      // Format month name for display
      const monthName = month.split('-')[0];
      const year = month.split('-')[1];
      
      return {
        month: monthName,
        year: '20' + year,
        l1: l1Reading,
        l2: l2Reading,
        l3: l3Reading,
        dc: dcReading,
        l2dc: l2dcReading,
        l3dc: l3Reading + dcReading,
        stage1Loss,
        stage2Loss,
        totalLoss,
        stage1LossPercent: l1Reading > 0 ? (stage1Loss / l1Reading) * 100 : 0,
        stage2LossPercent: l2dcReading > 0 ? (stage2Loss / l2dcReading) * 100 : 0,
        totalLossPercent: l1Reading > 0 ? (totalLoss / l1Reading) * 100 : 0
      };
    });
    
    // Process zone data
    const zones = Array.from(new Set(filteredData.filter(row => row['Zone']).map(row => row['Zone'])));
    
    const zoneData = zones.map(zone => {
      const zoneMonthlyData = months.map(month => {
        // Get Zone Bulk meter for this zone
        const zoneBulkMeter = filteredData.find(row => 
          row['Label'] === 'L2' && 
          row['Zone'] === zone
        );
        
        const zoneBulkReading = zoneBulkMeter ? zoneBulkMeter[month] || 0 : 0;
        
        // Get all L3 meters for this zone
        const zoneL3Meters = filteredData.filter(row => 
          row['Label'] === 'L3' && 
          row['Zone'] === zone
        );
        
        const zoneL3Reading = zoneL3Meters.reduce((sum, meter) => sum + (meter[month] || 0), 0);
        
        // Calculate zone loss
        const zoneLoss = zoneBulkReading - zoneL3Reading;
        const zoneLossPercent = zoneBulkReading > 0 ? (zoneLoss / zoneBulkReading) * 100 : 0;
        
        // Format month name
        const monthName = month.split('-')[0];
        
        return {
          month: monthName,
          zoneBulk: zoneBulkReading,
          zoneL3: zoneL3Reading,
          zoneLoss,
          zoneLossPercent
        };
      });
      
      return {
        zone,
        monthlyData: zoneMonthlyData
      };
    });
    
    // Process type data
    const types = Array.from(new Set(filteredData.filter(row => row['Type']).map(row => row['Type'])));
    
    const typeData = types.map(type => {
      const typeMonthlyData = months.map(month => {
        // Get all meters of this type
        const typeMeters = filteredData.filter(row => row['Type'] === type);
        
        // Calculate total consumption for this type
        const typeReading = typeMeters.reduce((sum, meter) => sum + (meter[month] || 0), 0);
        
        // Format month name
        const monthName = month.split('-')[0];
        
        return {
          month: monthName,
          reading: typeReading
        };
      });
      
      return {
        type,
        monthlyData: typeMonthlyData
      };
    });
    
    // Return the processed data
    return {
      monthly: monthlyData,
      zones: zoneData,
      types: typeData,
      rawMonths: months
    };
  };

  // Get filtered data based on year and month selections
  const getFilteredData = () => {
    if (!processedData) return { monthlyData: [], zoneData: [], typeData: [] };
    
    // Filter monthly data
    const yearFilter = selectedYear === "All" 
      ? () => true 
      : item => item.year === selectedYear;
      
    const monthFilter = selectedMonth === "All" 
      ? () => true 
      : item => item.month === selectedMonth;
      
    const filteredMonthly = processedData.monthly
      .filter(item => yearFilter(item) && monthFilter(item));
      
    // Filter zone data
    const filteredZones = processedData.zones.map(zone => {
      const filteredMonthlyData = zone.monthlyData
        .filter((_, index) => {
          const correspondingMonthlyData = processedData.monthly[index];
          return yearFilter(correspondingMonthlyData) && monthFilter(correspondingMonthlyData);
        });
        
      return {
        ...zone,
        filteredMonthlyData
      };
    });
    
    // Filter type data
    const filteredTypes = processedData.types.map(type => {
      const filteredMonthlyData = type.monthlyData
        .filter((_, index) => {
          const correspondingMonthlyData = processedData.monthly[index];
          return yearFilter(correspondingMonthlyData) && monthFilter(correspondingMonthlyData);
        });
        
      return {
        ...type,
        filteredMonthlyData
      };
    });
    
    return {
      monthlyData: filteredMonthly,
      zoneData: filteredZones,
      typeData: filteredTypes
    };
  };

  const filteredData = getFilteredData();

  // Calculate KPI metrics
  const calculateKPIs = () => {
    if (filteredData.monthlyData.length === 0) {
      return {
        l1: { current: 0, previous: 0, change: 0 },
        l2: { current: 0, previous: 0, change: 0 },
        l3: { current: 0, previous: 0, change: 0 },
        stage1Loss: { current: 0, previous: 0, change: 0 },
        stage2Loss: { current: 0, previous: 0, change: 0 },
        totalLoss: { current: 0, previous: 0, change: 0 }
      };
    }

    // Get the most recent and previous months' data
    const sortedData = [...filteredData.monthlyData].sort((a, b) => {
      const yearDiff = b.year - a.year;
      if (yearDiff !== 0) return yearDiff;
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.indexOf(b.month) - months.indexOf(a.month);
    });

    const current = sortedData[0] || { l1: 0, l2: 0, l3: 0, stage1Loss: 0, stage2Loss: 0, totalLoss: 0 };
    const previous = sortedData[1] || { l1: 0, l2: 0, l3: 0, stage1Loss: 0, stage2Loss: 0, totalLoss: 0 };

    return {
      l1: { 
        current: current.l1, 
        previous: previous.l1, 
        change: previous.l1 ? ((current.l1 - previous.l1) / previous.l1) * 100 : 0 
      },
      l2: { 
        current: current.l2, 
        previous: previous.l2, 
        change: previous.l2 ? ((current.l2 - previous.l2) / previous.l2) * 100 : 0 
      },
      l3: { 
        current: current.l3dc, 
        previous: previous.l3dc, 
        change: previous.l3dc ? ((current.l3dc - previous.l3dc) / previous.l3dc) * 100 : 0 
      },
      stage1Loss: { 
        current: current.stage1Loss, 
        previous: previous.stage1Loss, 
        change: previous.stage1Loss ? ((current.stage1Loss - previous.stage1Loss) / previous.stage1Loss) * 100 : 0 
      },
      stage2Loss: { 
        current: current.stage2Loss, 
        previous: previous.stage2Loss, 
        change: previous.stage2Loss ? ((current.stage2Loss - previous.stage2Loss) / previous.stage2Loss) * 100 : 0 
      },
      totalLoss: { 
        current: current.totalLoss, 
        previous: previous.totalLoss, 
        change: previous.totalLoss ? ((current.totalLoss - previous.totalLoss) / previous.totalLoss) * 100 : 0 
      }
    };
  };

  const kpis = calculateKPIs();

  // Function to handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target.result;
      processWaterData(contents);
    };
    reader.readAsText(file);
  };

  // --- UI Components ---

  // KPI Card Component
  const KPICard = ({ title, value, unit, previousValue, change, icon, color, isLoss = false }) => {
    const Icon = icon;
    const changeColor = change > 0 ? (isLoss ? 'text-red-500' : 'text-green-500') : (isLoss ? 'text-green-500' : 'text-red-500');
    const ChangeIcon = change > 0 ? TrendingUp : TrendingDown;
    
    // Set colors based on whether this is a loss or consumption metric
    const dotColor = isLoss ? "#e63946" : "#4361ee";
    const borderColor = isLoss ? "#e63946" : "#4361ee";
    const valueColor = isLoss ? "#e63946" : "#4361ee";
    
    // Calculate the absolute change in volume rather than percentage
    const changeVolume = Math.abs(value - previousValue);

    return (
      <div className={`${currentTheme.cardBg} rounded-lg ${currentTheme.shadow} p-6 flex flex-col h-36 relative overflow-hidden transition-colors duration-300`}>
        <div className="absolute left-0 top-0 h-full w-1 bg-opacity-70" style={{ backgroundColor: borderColor }}></div>
        <div className="flex items-center mb-2">
          <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: dotColor }}></div>
          <div className={`text-sm font-medium ${currentTheme.textSecondary}`}>{title}</div>
        </div>
        <div className="mt-1 flex items-baseline">
          <div className="text-5xl font-semibold" style={{ color: valueColor }}>{formatNumber(value)}</div>
          <div className={`ml-1 text-lg ${currentTheme.textSecondary}`}>{unit}</div>
        </div>
        <div className="mt-3">
          <div className={`py-1 px-3 rounded-full inline-flex items-center ${change > 0 ? (isLoss ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600') : (isLoss ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}`}>
            <ChangeIcon size={16} className="mr-1" />
            <span>{formatNumber(changeVolume)} {unit}</span>
            <span className="ml-2 text-sm opacity-70">vs previous month</span>
          </div>
        </div>
      </div>
    );
  };

  // Tab Button Component
  const TabButton = ({ label, active, onClick }) => (
    <button 
      className={`px-4 py-2 font-medium text-sm rounded-t-md ${
        active 
          ? `${currentTheme.cardBg} border-b-2` 
          : `${currentTheme.textSecondary} hover:text-[${currentTheme.primary}]`
      } transition-colors duration-200`}
      style={active ? { color: currentTheme.primary, borderColor: currentTheme.primary } : {}}
      onClick={onClick}
    >
      {label}
    </button>
  );

  // Custom Tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${currentTheme.cardBg} p-3 border ${currentTheme.border} ${currentTheme.shadow} rounded-md`}>
          <p className={`font-medium ${currentTheme.text}`}>{label}</p>
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

  // Filter Button Component
  const FilterButton = ({ label, active, color, onClick }) => (
    <button 
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
        active ? 'bg-opacity-20 shadow-sm' : 'bg-transparent'
      }`}
      style={{ 
        backgroundColor: active ? `${color}30` : '', 
        color: active ? color : currentTheme.text 
      }} 
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

  // Main Button Component
  const Button = ({ children, icon, onClick, primary = false, className = '' }) => {
    const Icon = icon;
    let baseClasses = `flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${className}`;
    
    if (primary) {
      baseClasses += ` text-white`;
      return (
        <button 
          onClick={onClick} 
          className={baseClasses}
          style={{ backgroundColor: currentTheme.primary }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          {icon && <Icon size={16} />}
          <span>{children}</span>
        </button>
      );
    } else {
      baseClasses += ` ${currentTheme.panelBg} ${currentTheme.text} hover:bg-opacity-80 border ${currentTheme.border}`;
      return (
        <button onClick={onClick} className={baseClasses}>
          {icon && <Icon size={16} />}
          <span>{children}</span>
        </button>
      );
    }
  };

  // Theme Toggle Component
  const ThemeToggle = () => (
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

  // --- Main Rendering ---
  if (isLoading) {
    return (
      <div className={`min-h-screen ${currentTheme.bg} flex items-center justify-center`}>
        <div className={`${currentTheme.cardBg} p-8 rounded-lg ${currentTheme.shadow} text-center`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-purple-500 mx-auto"></div>
          <p className={`mt-4 ${currentTheme.text} text-lg`}>Loading Water System Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.bg} p-4 md:p-6 transition-colors duration-300`}>
      {/* Header */}
      <div className={`${currentTheme.cardBg} rounded-lg ${currentTheme.shadow} p-4 md:p-6 mb-6 transition-colors duration-300`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between"> 
          <div className="flex items-center mb-4 md:mb-0"> 
            <div className="p-3 rounded-full mr-4" style={{backgroundColor: `${currentTheme.primary}1A`}}> 
              <Droplet size={24} style={{color: currentTheme.primary}} /> 
            </div> 
            <h1 className={`text-2xl font-bold`} style={{color: currentTheme.primary}}>Muscat Bay Water System</h1> 
          </div> 
          <div className="flex flex-wrap items-center gap-2"> 
            <select 
              className={`px-3 py-2 border ${currentTheme.border} rounded-md text-sm ${currentTheme.text} ${currentTheme.cardBg}`} 
              value={selectedYear} 
              onChange={(e) => { setSelectedYear(e.target.value); setSelectedMonth("All"); }}
            > 
              <option value="All">All Years</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select> 
            <select 
              className={`px-3 py-2 border ${currentTheme.border} rounded-md text-sm ${currentTheme.text} ${currentTheme.cardBg}`} 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
            > 
              <option value="All">All Months</option>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select> 
            <Button icon={RefreshCw} theme={currentTheme} onClick={() => window.location.reload()}>
              Refresh
            </Button> 
            <ThemeToggle /> 
          </div> 
        </div>
      </div>

      {/* Tab navigation */}
      <div className={`${currentTheme.panelBg} rounded-t-lg border-b ${currentTheme.border} mb-0 transition-colors duration-300`}>
        <div className="flex overflow-x-auto"> 
          <TabButton label="Overview" active={selectedTab === 'overview'} onClick={() => setSelectedTab('overview')} />
          <TabButton label="Zone Analysis" active={selectedTab === 'zones'} onClick={() => setSelectedTab('zones')} />
          <TabButton label="Type Analysis" active={selectedTab === 'types'} onClick={() => setSelectedTab('types')} />
          <TabButton label="Loss Analysis" active={selectedTab === 'loss'} onClick={() => setSelectedTab('loss')} />
          <TabButton label="Settings" active={selectedTab === 'settings'} onClick={() => setSelectedTab('settings')} />
        </div>
      </div>

      {/* Tab Content Area */}
      <div className={`${currentTheme.cardBg} rounded-b-lg ${currentTheme.shadow} p-4 md:p-6 mb-6 transition-colors duration-300`}>
        <div className={`text-sm ${currentTheme.textSecondary} mb-4`}>
          Showing: {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} 
          {selectedMonth !== 'All' ? ` for ${selectedMonth} ${selectedYear}` : selectedYear !== 'All' ? ` for ${selectedYear}` : ' for All Data'}
        </div>
        
        {/* Overview Tab Content */}
        {selectedTab === 'overview' && (
          <>
            {/* KPI Metrics - Top Row (Consumption) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <KPICard 
                title="L1 TOTAL" 
                value={kpis.l1.current} 
                unit="m³" 
                previousValue={kpis.l1.previous} 
                change={kpis.l1.change} 
                icon={Droplet}
                color={currentTheme.chartColors.l1Color}
              />
              <KPICard 
                title="L2 TOTAL" 
                value={kpis.l2.current} 
                unit="m³" 
                previousValue={kpis.l2.previous} 
                change={kpis.l2.change} 
                icon={Droplet}
                color={currentTheme.chartColors.l2Color}
              />
              <KPICard 
                title="L3 TOTAL" 
                value={kpis.l3.current} 
                unit="m³" 
                previousValue={kpis.l3.previous} 
                change={kpis.l3.change} 
                icon={Droplet}
                color={currentTheme.chartColors.l3Color}
              />
            </div>
            
            {/* KPI Metrics - Bottom Row (Losses) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <KPICard 
                title="LOSS (L1→L2)" 
                value={kpis.stage1Loss.current} 
                unit="m³" 
                previousValue={kpis.stage1Loss.previous} 
                change={kpis.stage1Loss.change} 
                icon={TrendingDown}
                color={currentTheme.danger}
                isLoss={true}
              />
              <KPICard 
                title="LOSS (L2→L3)" 
                value={kpis.stage2Loss.current} 
                unit="m³" 
                previousValue={kpis.stage2Loss.previous} 
                change={kpis.stage2Loss.change} 
                icon={TrendingDown}
                color={currentTheme.warning}
                isLoss={true}
              />
              <KPICard 
                title="TOTAL LOSS" 
                value={kpis.totalLoss.current} 
                unit="m³" 
                previousValue={kpis.totalLoss.previous} 
                change={kpis.totalLoss.change} 
                icon={TrendingDown}
                color={currentTheme.chartColors.lossColor}
                isLoss={true}
              />
            </div>
            
            {/* Filter buttons */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className={`mr-2 ${currentTheme.textSecondary} flex items-center`}>
                <Filter size={16} className="mr-1" />
                <span className="text-sm">Data Series:</span>
              </div>
              <FilterButton 
                label="Main Bulk (L1)" 
                active={visibleSeries.l1} 
                color={currentTheme.chartColors.l1Color} 
                onClick={() => setVisibleSeries({...visibleSeries, l1: !visibleSeries.l1})}
              />
              <FilterButton 
                label="Zone Bulk (L2)" 
                active={visibleSeries.l2} 
                color={currentTheme.chartColors.l2Color} 
                onClick={() => setVisibleSeries({...visibleSeries, l2: !visibleSeries.l2})}
              />
              <FilterButton 
                label="Consumption (L3)" 
                active={visibleSeries.l3} 
                color={currentTheme.chartColors.l3Color} 
                onClick={() => setVisibleSeries({...visibleSeries, l3: !visibleSeries.l3})}
              />
              <FilterButton 
                label="System Loss" 
                active={visibleSeries.loss} 
                color={currentTheme.chartColors.lossColor} 
                onClick={() => setVisibleSeries({...visibleSeries, loss: !visibleSeries.loss})}
              />
            </div>
            
            {/* Main Consumption Chart */}
            <div className={`${currentTheme.cardBg} rounded-lg p-4 mb-6 transition-colors duration-300`}>
              <h3 className={`text-lg font-medium mb-4 ${currentTheme.text}`}>Monthly Water Consumption</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={filteredData.monthlyData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gradientL1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={currentTheme.chartColors.l1Color} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={currentTheme.chartColors.l1Color} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gradientL2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={currentTheme.chartColors.l2Color} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={currentTheme.chartColors.l2Color} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gradientL3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={currentTheme.chartColors.l3Color} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={currentTheme.chartColors.l3Color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.chartColors.bgGrid} />
                    <XAxis dataKey="month" tick={{ fill: currentTheme.text, fontSize: 12 }} />
                    <YAxis tick={{ fill: currentTheme.text, fontSize: 12 }} />
                    <Tooltip content={(props) => <CustomTooltip {...props} />} />
                    <Legend wrapperStyle={{ color: currentTheme.text }} />
                    
                    {visibleSeries.l1 && (
                      <Area 
                        type="monotone" 
                        dataKey="l1" 
                        stroke="none" 
                        fill="url(#gradientL1)" 
                        stackId="1"
                      />
                    )}
                    
                    {visibleSeries.l2 && (
                      <Area 
                        type="monotone" 
                        dataKey="l2dc" 
                        stroke="none" 
                        fill="url(#gradientL2)" 
                        stackId="2"
                      />
                    )}
                    
                    {visibleSeries.l3 && (
                      <Area 
                        type="monotone" 
                        dataKey="l3dc" 
                        stroke="none" 
                        fill="url(#gradientL3)" 
                        stackId="3"
                      />
                    )}
                    
                    {visibleSeries.l1 && (
                      <Line 
                        type="monotone" 
                        dataKey="l1" 
                        name="Main Bulk (L1)" 
                        stroke={currentTheme.chartColors.l1Color} 
                        strokeWidth={2} 
                        dot={false} 
                        activeDot={{ r: 6 }}
                      />
                    )}
                    
                    {visibleSeries.l2 && (
                      <Line 
                        type="monotone" 
                        dataKey="l2dc" 
                        name="Zone Bulk + DC (L2+DC)" 
                        stroke={currentTheme.chartColors.l2Color} 
                        strokeWidth={2} 
                        dot={false} 
                        activeDot={{ r: 6 }}
                      />
                    )}
                    
                    {visibleSeries.l3 && (
                      <Line 
                        type="monotone" 
                        dataKey="l3dc" 
                        name="Consumption (L3+DC)" 
                        stroke={currentTheme.chartColors.l3Color} 
                        strokeWidth={2} 
                        dot={false} 
                        activeDot={{ r: 6 }}
                      />
                    )}
                    
                    {visibleSeries.loss && (
                      <Bar 
                        dataKey="totalLoss" 
                        name="System Loss" 
                        fill={currentTheme.chartColors.lossColor} 
                        fillOpacity={0.7}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Loss Percentage Chart */}
            <div className={`${currentTheme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
              <h3 className={`text-lg font-medium mb-4 ${currentTheme.text}`}>Loss Percentage Trend</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData.monthlyData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.chartColors.bgGrid} />
                    <XAxis dataKey="month" tick={{ fill: currentTheme.text, fontSize: 12 }} />
                    <YAxis 
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fill: currentTheme.text, fontSize: 12 }} 
                    />
                    <Tooltip 
                      formatter={(value) => [`${value.toFixed(1)}%`, 'Loss Percentage']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend wrapperStyle={{ color: currentTheme.text }} />
                    
                    <Line 
                      type="monotone" 
                      dataKey="stage1LossPercent" 
                      name="Stage 1 Loss %" 
                      stroke={currentTheme.danger} 
                      strokeWidth={2} 
                      dot={true} 
                      activeDot={{ r: 6 }}
                    />
                    
                    <Line 
                      type="monotone" 
                      dataKey="stage2LossPercent" 
                      name="Stage 2 Loss %" 
                      stroke={currentTheme.warning} 
                      strokeWidth={2} 
                      dot={true} 
                      activeDot={{ r: 6 }}
                    />
                    
                    <Line 
                      type="monotone" 
                      dataKey="totalLossPercent" 
                      name="Total Loss %" 
                      stroke={currentTheme.chartColors.lossColor} 
                      strokeWidth={2} 
                      dot={true} 
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
        
        {/* Zone Analysis Tab Content */}
        {selectedTab === 'zones' && (
          <>
            {/* Zone selector */}
            <div className="mb-6">
              <div className={`mb-2 ${currentTheme.text} font-medium`}>Select Zone:</div>
              <div className="flex flex-wrap gap-2">
                <button 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    selectedZone === 'All' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100' 
                      : `${currentTheme.panelBg} ${currentTheme.text}`
                  }`}
                  onClick={() => setSelectedZone('All')}
                >
                  All Zones
                </button>
                
                {processedData?.zones.map((zone, index) => (
                  <button 
                    key={zone.zone}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      selectedZone === zone.zone 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100' 
                        : `${currentTheme.panelBg} ${currentTheme.text}`
                    }`}
                    onClick={() => setSelectedZone(zone.zone)}
                  >
                    {zone.zone}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Zone KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {selectedZone !== 'All' ? (
                // Single zone KPIs
                <>
                  <div className={`${currentTheme.cardBg} rounded-lg ${currentTheme.shadow} p-6`}>
                    <h3 className={`text-lg font-medium mb-2 ${currentTheme.text}`}>{selectedZone}</h3>
                    <p className={`${currentTheme.textSecondary}`}>
                      Selected zone details and statistics
                    </p>
                  </div>
                  
                  {filteredData.zoneData
                    .filter(zone => zone.zone === selectedZone)
                    .map(zone => {
                      // Calculate total consumption and loss for the zone
                      const totalZoneBulk = zone.filteredMonthlyData.reduce(
                        (sum, month) => sum + month.zoneBulk, 0
                      );
                      
                      const totalZoneL3 = zone.filteredMonthlyData.reduce(
                        (sum, month) => sum + month.zoneL3, 0
                      );
                      
                      const totalZoneLoss = totalZoneBulk - totalZoneL3;
                      const zoneLossPercent = totalZoneBulk > 0 
                        ? (totalZoneLoss / totalZoneBulk) * 100 
                        : 0;
                        
                      return (
                        <React.Fragment key={zone.zone}>
                          <KPICard 
                            title="Zone Bulk" 
                            value={totalZoneBulk} 
                            unit="m³" 
                            previousValue="--" 
                            change={0} 
                            icon={Droplet} 
                            color={currentTheme.chartColors.l2Color}
                          />
                          <KPICard 
                            title="Zone Loss" 
                            value={totalZoneLoss} 
                            unit="m³" 
                            previousValue={`${zoneLossPercent.toFixed(1)}%`} 
                            change={0} 
                            icon={TrendingDown} 
                            color={currentTheme.chartColors.lossColor}
                          />
                        </React.Fragment>
                      );
                    })}
                </>
              ) : (
                // All zones comparison
                processedData?.zones.slice(0, 3).map(zone => {
                  // Calculate total consumption and loss for each zone
                  const totalZoneBulk = zone.monthlyData.reduce(
                    (sum, month) => sum + month.zoneBulk, 0
                  );
                  
                  const totalZoneL3 = zone.monthlyData.reduce(
                    (sum, month) => sum + month.zoneL3, 0
                  );
                  
                  const totalZoneLoss = totalZoneBulk - totalZoneL3;
                  const zoneLossPercent = totalZoneBulk > 0 
                    ? (totalZoneLoss / totalZoneBulk) * 100 
                    : 0;
                    
                  return (
                    <KPICard 
                      key={zone.zone}
                      title={zone.zone} 
                      value={totalZoneBulk} 
                      unit="m³" 
                      previousValue={`${zoneLossPercent.toFixed(1)}% Loss`} 
                      change={0} 
                      icon={Droplet} 
                      color={currentTheme.chartColors.l2Color}
                    />
                  );
                })
              )}
            </div>
            
            {/* Zone Consumption Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Zone Consumption Chart */}
              <div className={`${currentTheme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
                <h3 className={`text-lg font-medium mb-4 ${currentTheme.text}`}>
                  {selectedZone !== 'All' ? `${selectedZone} Monthly Consumption` : 'Zone Consumption Comparison'}
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {selectedZone !== 'All' ? (
                      // Single zone monthly trend
                      <AreaChart 
                        data={filteredData.zoneData
                          .find(zone => zone.zone === selectedZone)?.filteredMonthlyData || []} 
                        margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="colorZoneBulk" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={currentTheme.chartColors.l2Color} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={currentTheme.chartColors.l2Color} stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.chartColors.bgGrid} />
                        <XAxis dataKey="month" tick={{ fill: currentTheme.text, fontSize: 12 }} />
                        <YAxis tick={{ fill: currentTheme.text, fontSize: 12 }} />
                        <Tooltip content={(props) => <CustomTooltip {...props} />} />
                        <Legend wrapperStyle={{ color: currentTheme.text }} />
                        <Area 
                          type="monotone" 
                          dataKey="zoneBulk" 
                          name="Zone Bulk" 
                          stroke={currentTheme.chartColors.l2Color}
                          fillOpacity={1} 
                          fill="url(#colorZoneBulk)"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="zoneL3" 
                          name="Zone Consumption" 
                          stroke={currentTheme.chartColors.l3Color}
                          fill={currentTheme.chartColors.l3Color}
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    ) : (
                      // Multiple zone comparison
                      <BarChart 
                        data={processedData?.zones.map(zone => {
                          const totalZoneBulk = zone.monthlyData.reduce(
                            (sum, month) => sum + month.zoneBulk, 0
                          );
                          
                          const totalZoneL3 = zone.monthlyData.reduce(
                            (sum, month) => sum + month.zoneL3, 0
                          );
                          
                          return {
                            zone: zone.zone,
                            bulk: totalZoneBulk,
                            consumption: totalZoneL3,
                            loss: totalZoneBulk - totalZoneL3
                          };
                        })} 
                        margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.chartColors.bgGrid} />
                        <XAxis dataKey="zone" tick={{ fill: currentTheme.text, fontSize: 12 }} />
                        <YAxis tick={{ fill: currentTheme.text, fontSize: 12 }} />
                        <Tooltip content={(props) => <CustomTooltip {...props} />} />
                        <Legend wrapperStyle={{ color: currentTheme.text }} />
                        <Bar 
                          dataKey="consumption" 
                          name="Consumption" 
                          fill={currentTheme.chartColors.l3Color}
                          stackId="a"
                        />
                        <Bar 
                          dataKey="loss" 
                          name="Loss" 
                          fill={currentTheme.chartColors.lossColor}
                          stackId="a"
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Zone Loss Chart */}
              <div className={`${currentTheme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
                <h3 className={`text-lg font-medium mb-4 ${currentTheme.text}`}>
                  {selectedZone !== 'All' ? `${selectedZone} Loss Analysis` : 'Zone Loss Percentage'}
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {selectedZone !== 'All' ? (
                      // Single zone loss trend
                      <LineChart 
                        data={filteredData.zoneData
                          .find(zone => zone.zone === selectedZone)?.filteredMonthlyData || []} 
                        margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.chartColors.bgGrid} />
                        <XAxis dataKey="month" tick={{ fill: currentTheme.text, fontSize: 12 }} />
                        <YAxis 
                          yAxisId="left"
                          tick={{ fill: currentTheme.text, fontSize: 12 }} 
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          tickFormatter={(value) => `${value}%`}
                          tick={{ fill: currentTheme.chartColors.lossColor, fontSize: 12 }} 
                        />
                        <Tooltip content={(props) => <CustomTooltip {...props} />} />
                        <Legend wrapperStyle={{ color: currentTheme.text }} />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="zoneLoss" 
                          name="Zone Loss (m³)" 
                          stroke={currentTheme.chartColors.lossColor}
                          strokeWidth={2}
                          dot={true}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="zoneLossPercent" 
                          name="Loss Percentage" 
                          stroke={currentTheme.warning}
                          strokeWidth={2}
                          dot={true}
                        />
                      </LineChart>
                    ) : (
                      // Multiple zone loss percentage comparison
                      <BarChart 
                        data={processedData?.zones.map(zone => {
                          const totalZoneBulk = zone.monthlyData.reduce(
                            (sum, month) => sum + month.zoneBulk, 0
                          );
                          
                          const totalZoneL3 = zone.monthlyData.reduce(
                            (sum, month) => sum + month.zoneL3, 0
                          );
                          
                          const totalZoneLoss = totalZoneBulk - totalZoneL3;
                          const zoneLossPercent = totalZoneBulk > 0 
                            ? (totalZoneLoss / totalZoneBulk) * 100 
                            : 0;
                            
                          return {
                            zone: zone.zone,
                            lossPercentage: zoneLossPercent
                          };
                        })} 
                        margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.chartColors.bgGrid} />
                        <XAxis dataKey="zone" tick={{ fill: currentTheme.text, fontSize: 12 }} />
                        <YAxis 
                          tickFormatter={(value) => `${value}%`}
                          tick={{ fill: currentTheme.text, fontSize: 12 }} 
                        />
                        <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Loss Percentage']} />
                        <Legend wrapperStyle={{ color: currentTheme.text }} />
                        <Bar 
                          dataKey="lossPercentage" 
                          name="Loss Percentage" 
                          fill={currentTheme.chartColors.lossColor}
                        >
                          {processedData?.zones.map((entry, index) => {
                            const totalZoneBulk = entry.monthlyData.reduce(
                              (sum, month) => sum + month.zoneBulk, 0
                            );
                            
                            const totalZoneL3 = entry.monthlyData.reduce(
                              (sum, month) => sum + month.zoneL3, 0
                            );
                            
                            const zoneLossPercent = totalZoneBulk > 0 
                              ? ((totalZoneBulk - totalZoneL3) / totalZoneBulk) * 100 
                              : 0;
                            
                            // Color based on loss percentage
                            const color = zoneLossPercent > 30 
                              ? currentTheme.danger 
                              : zoneLossPercent > 15 
                                ? currentTheme.warning 
                                : currentTheme.success;
                                
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Zone meters table */}
            {selectedZone !== 'All' && (
              <div className={`${currentTheme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
                <h3 className={`text-lg font-medium mb-4 ${currentTheme.text}`}>{selectedZone} Meters</h3>
                <div className="overflow-x-auto">
                  <table className={`min-w-full divide-y ${currentTheme.border}`}>
                    <thead className={currentTheme.panelBg}>
                      <tr>
                        <th className={`px-4 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>
                          Meter Label
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>
                          Account #
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>
                          Type
                        </th>
                        <th className={`px-4 py-3 text-right text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>
                          Current Reading
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`${currentTheme.cardBg} divide-y ${currentTheme.border}`}>
                      {rawData && rawData
                        .filter(meter => meter['Zone'] === selectedZone)
                        .map((meter, index) => {
                          // Get the latest reading
                          const latestMonth = processedData?.rawMonths[processedData.rawMonths.length - 1];
                          const reading = meter[latestMonth] || 0;
                          
                          return (
                            <tr key={meter['Acct #']} className={index % 2 === 0 ? currentTheme.cardBg : currentTheme.panelBg}>
                              <td className={`px-4 py-3 whitespace-nowrap text-sm ${currentTheme.text}`}>
                                {meter['Meter Label']}
                              </td>
                              <td className={`px-4 py-3 whitespace-nowrap text-sm ${currentTheme.text}`}>
                                {meter['Acct #']}
                              </td>
                              <td className={`px-4 py-3 whitespace-nowrap text-sm ${currentTheme.text}`}>
                                {meter['Type']}
                              </td>
                              <td className={`px-4 py-3 whitespace-nowrap text-sm ${currentTheme.text} text-right font-medium`}>
                                {formatNumber(reading)} m³
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Type Analysis Tab Content */}
        {selectedTab === 'types' && (
          <>
            {/* Type Distribution Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className={`${currentTheme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
                <h3 className={`text-lg font-medium mb-4 ${currentTheme.text}`}>Consumption by Type</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <Pie 
                        data={processedData?.types.map(type => {
                          const totalReading = type.monthlyData.reduce(
                            (sum, month) => sum + month.reading, 0
                          );
                          
                          return {
                            name: type.type,
                            value: totalReading
                          };
                        })} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={90} 
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({name, percent}) => `${name} (${(percent * 100).toFixed(1)}%)`}
                        labelLine={true}
                      >
                        {processedData?.types.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={currentTheme.typeColors[index % currentTheme.typeColors.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(value, 0) + ' m³'} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Type Trends Chart */}
              <div className={`${currentTheme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
                <h3 className={`text-lg font-medium mb-4 ${currentTheme.text}`}>Consumption Trends by Type</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.chartColors.bgGrid} />
                      <XAxis 
                        dataKey="month"
                        tick={{ fill: currentTheme.text, fontSize: 12 }}
                        type="category"
                        allowDuplicatedCategory={false}
                      />
                      <YAxis tick={{ fill: currentTheme.text, fontSize: 12 }} />
                      <Tooltip content={(props) => <CustomTooltip {...props} />} />
                      <Legend wrapperStyle={{ color: currentTheme.text }} />
                      
                      {processedData?.types
                        .filter(type => ['Retail', 'Residential (Villa)', 'Residential (Apart)', 'IRR_Servies'].includes(type.type))
                        .map((type, index) => (
                          <Line
                            key={type.type}
                            data={type.monthlyData}
                            type="monotone"
                            dataKey="reading"
                            name={type.type}
                            stroke={currentTheme.typeColors[index % currentTheme.typeColors.length]}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Type Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {processedData?.types
                .filter(type => ['Retail', 'Residential (Villa)', 'Residential (Apart)', 'IRR_Servies'].includes(type.type))
                .map((type, index) => {
                  const totalReading = type.monthlyData.reduce(
                    (sum, month) => sum + month.reading, 0
                  );
                  
                  // Calculate percentage of total consumption
                  const totalConsumption = processedData.types.reduce(
                    (sum, t) => sum + t.monthlyData.reduce((s, m) => s + m.reading, 0), 0
                  );
                  
                  const percentage = totalConsumption > 0 
                    ? (totalReading / totalConsumption) * 100 
                    : 0;
                  
                  return (
                    <div 
                      key={type.type}
                      className={`${currentTheme.cardBg} rounded-lg ${currentTheme.shadow} p-6`}
                    >
                      <div className="flex justify-between items-start">
                        <div className={`text-sm font-medium ${currentTheme.textSecondary}`}>{type.type}</div>
                        <div 
                          className="p-2 rounded-full bg-opacity-20" 
                          style={{ 
                            backgroundColor: `${currentTheme.typeColors[index % currentTheme.typeColors.length]}30` 
                          }}
                        >
                          <Activity 
                            size={18} 
                            color={currentTheme.typeColors[index % currentTheme.typeColors.length]} 
                          />
                        </div>
                      </div>
                      <div className="mt-2 flex items-baseline">
                        <div className={`text-3xl font-semibold ${currentTheme.text}`}>{formatNumber(totalReading)}</div>
                        <div className={`ml-1 text-sm ${currentTheme.textSecondary}`}>m³</div>
                      </div>
                      <div className={`mt-1 text-sm ${currentTheme.textSecondary}`}>
                        {percentage.toFixed(1)}% of total consumption
                      </div>
                    </div>
                  );
                })}
            </div>
            
            {/* Type by Zone Grid */}
            <div className={`${currentTheme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
              <h3 className={`text-lg font-medium mb-4 ${currentTheme.text}`}>Type Consumption by Zone</h3>
              <div className="overflow-x-auto">
                <table className={`min-w-full divide-y ${currentTheme.border}`}>
                  <thead className={currentTheme.panelBg}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>
                        Type
                      </th>
                      {processedData?.zones.map(zone => (
                        <th 
                          key={zone.zone}
                          className={`px-4 py-3 text-right text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}
                        >
                          {zone.zone}
                        </th>
                      ))}
                      <th className={`px-4 py-3 text-right text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`${currentTheme.cardBg} divide-y ${currentTheme.border}`}>
                    {processedData?.types.map((type, typeIndex) => {
                      // Calculate consumption by zone for this type
                      const typeByZone = processedData.zones.map(zone => {
                        const meters = rawData?.filter(meter => 
                          meter['Type'] === type.type && 
                          meter['Zone'] === zone.zone
                        ) || [];
                        
                        const totalConsumption = meters.reduce((sum, meter) => {
                          return sum + processedData.rawMonths.reduce(
                            (monthSum, month) => monthSum + (meter[month] || 0), 0
                          );
                        }, 0);
                        
                        return totalConsumption;
                      });
                      
                      const rowTotal = typeByZone.reduce((sum, value) => sum + value, 0);
                      
                      return (
                        <tr key={type.type} className={typeIndex % 2 === 0 ? currentTheme.cardBg : currentTheme.panelBg}>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${currentTheme.text}`}>
                            {type.type}
                          </td>
                          {typeByZone.map((value, zoneIndex) => (
                            <td 
                              key={zoneIndex}
                              className={`px-4 py-3 whitespace-nowrap text-sm ${currentTheme.text} text-right`}
                            >
                              {formatNumber(value)} m³
                            </td>
                          ))}
                          <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${currentTheme.text} text-right`}>
                            {formatNumber(rowTotal)} m³
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        
        {/* Loss Analysis Tab Content */}
        {selectedTab === 'loss' && (
          <>
            {/* Loss KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <KPICard 
                title="Stage 1 Loss" 
                value={kpis.stage1Loss.current} 
                unit="m³" 
                previousValue={kpis.stage1Loss.previous} 
                change={kpis.stage1Loss.change} 
                icon={TrendingDown} 
                color={currentTheme.danger}
              />
              <KPICard 
                title="Stage 2 Loss" 
                value={kpis.stage2Loss.current} 
                unit="m³" 
                previousValue={kpis.stage2Loss.previous} 
                change={kpis.stage2Loss.change} 
                icon={TrendingDown} 
                color={currentTheme.warning}
              />
              <KPICard 
                title="Total Loss" 
                value={kpis.totalLoss.current} 
                unit="m³" 
                previousValue={kpis.totalLoss.previous} 
                change={kpis.totalLoss.change} 
                icon={TrendingDown} 
                color={currentTheme.chartColors.lossColor}
              />
            </div>
            
            {/* Loss Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Loss Trend Chart */}
              <div className={`${currentTheme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
                <h3 className={`text-lg font-medium mb-4 ${currentTheme.text}`}>Loss Trend Analysis</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart 
                      data={filteredData.monthlyData} 
                      margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.chartColors.bgGrid} />
                      <XAxis dataKey="month" tick={{ fill: currentTheme.text, fontSize: 12 }} />
                      <YAxis tick={{ fill: currentTheme.text, fontSize: 12 }} />
                      <Tooltip content={(props) => <CustomTooltip {...props} />} />
                      <Legend wrapperStyle={{ color: currentTheme.text }} />
                      
                      <Bar dataKey="stage1Loss" name="Stage 1 Loss" fill={currentTheme.danger} stackId="a" />
                      <Bar dataKey="stage2Loss" name="Stage 2 Loss" fill={currentTheme.warning} stackId="a" />
                      <Line 
                        type="monotone" 
                        dataKey="totalLoss" 
                        name="Total Loss" 
                        stroke={currentTheme.chartColors.lossColor}
                        strokeWidth={3}
                        dot={true}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Loss Percentage Chart */}
              <div className={`${currentTheme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
                <h3 className={`text-lg font-medium mb-4 ${currentTheme.text}`}>Loss Percentage Analysis</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={filteredData.monthlyData} 
                      margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.chartColors.bgGrid} />
                      <XAxis dataKey="month" tick={{ fill: currentTheme.text, fontSize: 12 }} />
                      <YAxis 
                        tickFormatter={(value) => `${value}%`}
                        tick={{ fill: currentTheme.text, fontSize: 12 }} 
                        domain={[0, dataMax => Math.max(50, dataMax)]}
                      />
                      <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Loss Percentage']} />
                      <Legend wrapperStyle={{ color: currentTheme.text }} />
                      
                      <Line 
                        type="monotone" 
                        dataKey="stage1LossPercent" 
                        name="Stage 1 Loss %" 
                        stroke={currentTheme.danger}
                        strokeWidth={2}
                        dot={true}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="stage2LossPercent" 
                        name="Stage 2 Loss %" 
                        stroke={currentTheme.warning}
                        strokeWidth={2}
                        dot={true}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalLossPercent" 
                        name="Total Loss %" 
                        stroke={currentTheme.chartColors.lossColor}
                        strokeWidth={2}
                        dot={true}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Zone Loss Comparison */}
            <div className={`${currentTheme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
              <h3 className={`text-lg font-medium mb-4 ${currentTheme.text}`}>Zone Loss Analysis</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={processedData?.zones.map(zone => {
                      const totalZoneBulk = zone.monthlyData.reduce(
                        (sum, month) => sum + month.zoneBulk, 0
                      );
                      
                      const totalZoneL3 = zone.monthlyData.reduce(
                        (sum, month) => sum + month.zoneL3, 0
                      );
                      
                      const zoneLoss = totalZoneBulk - totalZoneL3;
                      const zoneLossPercent = totalZoneBulk > 0 
                        ? (zoneLoss / totalZoneBulk) * 100 
                        : 0;
                        
                      return {
                        zone: zone.zone,
                        bulk: totalZoneBulk,
                        consumption: totalZoneL3,
                        loss: zoneLoss,
                        lossPercentage: zoneLossPercent
                      };
                    })}
                    margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.chartColors.bgGrid} />
                    <XAxis type="number" tick={{ fill: currentTheme.text, fontSize: 12 }} />
                    <YAxis 
                      type="category" 
                      dataKey="zone" 
                      tick={{ fill: currentTheme.text, fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip content={(props) => <CustomTooltip {...props} />} />
                    <Legend wrapperStyle={{ color: currentTheme.text }} />
                    <Bar dataKey="consumption" name="Consumption" fill={currentTheme.chartColors.l3Color} stackId="a" />
                    <Bar dataKey="loss" name="Loss" fill={currentTheme.chartColors.lossColor} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Loss Analysis Table */}
            <div className={`${currentTheme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
              <h3 className={`text-lg font-medium mb-4 ${currentTheme.text}`}>Loss Analysis Details</h3>
              <div className="overflow-x-auto">
                <table className={`min-w-full divide-y ${currentTheme.border}`}>
                  <thead className={currentTheme.panelBg}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Month</th>
                      <th className={`px-4 py-3 text-right text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Main Bulk (m³)</th>
                      <th className={`px-4 py-3 text-right text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Total Consumption (m³)</th>
                      <th className={`px-4 py-3 text-right text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Total Loss (m³)</th>
                      <th className={`px-4 py-3 text-right text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}>Loss %</th>
                    </tr>
                  </thead>
                  <tbody className={`${currentTheme.cardBg} divide-y ${currentTheme.border}`}>
                    {filteredData.monthlyData.map((month, index) => (
                      <tr key={`${month.month}-${month.year}`} className={index % 2 === 0 ? currentTheme.cardBg : currentTheme.panelBg}>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${currentTheme.text}`}>
                          {month.month} {month.year}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${currentTheme.text} text-right`}>
                          {formatNumber(month.l1)}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${currentTheme.text} text-right`}>
                          {formatNumber(month.l3dc)}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${currentTheme.text} text-right`}>
                          <span className={month.totalLoss < 0 ? 'text-red-500' : ''}>
                            {formatNumber(month.totalLoss)}
                          </span>
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${currentTheme.text} text-right`}>
                          <span className={
                            month.totalLossPercent > 30 
                              ? 'text-red-500' 
                              : month.totalLossPercent > 15 
                                ? 'text-yellow-500' 
                                : 'text-green-500'
                          }>
                            {month.totalLossPercent.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        
        {/* Settings Tab Content */}
        {selectedTab === 'settings' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Data Management */}
              <div className={`${currentTheme.cardBg} rounded-lg p-6 ${currentTheme.shadow}`}>
                <h3 className={`text-lg font-medium mb-4 ${currentTheme.text}`}>Data Management</h3>
                <div className={`mb-6 ${currentTheme.text}`}>
                  <p className="mb-4">Upload new water consumption data in CSV format.</p>
                  <p className="text-sm mb-2 font-medium">Requirements:</p>
                  <ul className="list-disc pl-5 text-sm mb-4">
                    <li>CSV file should have the same structure as the example data</li>
                    <li>First row should contain column headers</li>
                    <li>Required columns: "Meter Label", "Acct #", "Zone", "Type", "Label"</li>
                    <li>Consumption data should be in columns named with month-year format (e.g., "Jan-24")</li>
                  </ul>
                  <div className="mt-4">
                    <input
                      type="file"
                      id="csv-upload"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button 
                      primary 
                      icon={Upload} 
                      onClick={() => document.getElementById('csv-upload').click()}
                    >
                      Upload CSV File
                    </Button>
                  </div>
                </div>
                
                <div className={`mb-4 ${currentTheme.text}`}>
                  <h4 className="text-md font-medium mb-2">Data Export</h4>
                  <p className="text-sm mb-4">Export current data for backup or external analysis.</p>
                  <Button 
                    icon={Download} 
                    onClick={() => alert("Export functionality to be implemented")}
                  >
                    Export Data
                  </Button>
                </div>
              </div>
              
              {/* Application Settings */}
              <div className={`${currentTheme.cardBg} rounded-lg p-6 ${currentTheme.shadow}`}>
                <h3 className={`text-lg font-medium mb-4 ${currentTheme.text}`}>Application Settings</h3>
                
                <div className="mb-6">
                  <h4 className={`text-md font-medium mb-2 ${currentTheme.text}`}>Theme</h4>
                  <div className={`text-sm mb-4 ${currentTheme.textSecondary}`}>Choose between light and dark mode.</div>
                  <div className="flex items-center">
                    <span className={`mr-2 ${currentTheme.text}`}>Light</span>
                    <div 
                      onClick={() => setDarkMode(!darkMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer transition-colors duration-300 ${darkMode ? 'bg-purple-600' : 'bg-gray-300'}`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} 
                      />
                    </div>
                    <span className={`ml-2 ${currentTheme.text}`}>Dark</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className={`text-md font-medium mb-2 ${currentTheme.text}`}>Loss Threshold Settings</h4>
                  <div className={`text-sm mb-4 ${currentTheme.textSecondary}`}>
                    Configure thresholds for loss percentage warnings.
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                        Warning Threshold (%)
                      </label>
                      <input 
                        type="number" 
                        className={`w-full px-3 py-2 border ${currentTheme.border} rounded-md text-sm ${currentTheme.text} ${currentTheme.cardBg}`}
                        placeholder="15"
                        disabled
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${currentTheme.text} mb-1`}>
                        Critical Threshold (%)
                      </label>
                      <input 
                        type="number" 
                        className={`w-full px-3 py-2 border ${currentTheme.border} rounded-md text-sm ${currentTheme.text} ${currentTheme.cardBg}`}
                        placeholder="30"
                        disabled
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button 
                      onClick={() => alert("Settings functionality to be implemented")}
                    >
                      Save Settings
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h4 className={`text-md font-medium mb-2 ${currentTheme.text}`}>About</h4>
                  <div className={`text-sm ${currentTheme.textSecondary}`}>
                    <p>Water System Dashboard v1.0</p>
                    <p className="mt-1">© 2025 Muscat Bay</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Data Structure Help */}
            <div className={`${currentTheme.cardBg} rounded-lg p-6 ${currentTheme.shadow}`}>
              <h3 className={`text-lg font-medium mb-4 ${currentTheme.text}`}>
                Understanding the Data Structure
              </h3>
              <div className={`${currentTheme.text} text-sm`}>
                <p className="mb-4">
                  This application uses a specific data structure to analyze water flow hierarchy and calculate losses.
                </p>
                
                <h4 className="font-medium mb-2">Water Flow Hierarchy:</h4>
                <ul className="list-disc pl-5 mb-4">
                  <li><strong>L1 (Source):</strong> Main bulk meter measuring total water entering the system.</li>
                  <li><strong>L2 (Zone Bulk):</strong> Meters measuring water entering specific zones.</li>
                  <li><strong>DC (Direct Connection):</strong> Meters measuring direct consumption from the main line.</li>
                  <li><strong>L3 (Individual):</strong> End-user meters within zones measuring final consumption.</li>
                </ul>
                
                <h4 className="font-medium mb-2">Loss Calculations:</h4>
                <ul className="list-disc pl-5 mb-4">
                  <li><strong>Stage 1 Loss:</strong> L1 - (L2 + DC) | Loss between main source and primary distribution.</li>
                  <li><strong>Stage 2 Loss:</strong> L2 - L3 | Loss within zones after L2 measurement.</li>
                  <li><strong>Total Loss:</strong> L1 - (L3 + DC) | Overall system loss (Stage 1 + Stage 2).</li>
                  <li><strong>Zone Loss:</strong> Zone L2 Bulk - Sum of L3 within zone | Loss within a specific zone.</li>
                </ul>
                
                <h4 className="font-medium mb-2">Required Data Structure for Uploads:</h4>
                <p className="mb-2">
                  CSV files must include these columns:
                </p>
                <ul className="list-disc pl-5">
                  <li><strong>Meter Label:</strong> Unique identifier for each meter</li>
                  <li><strong>Acct #:</strong> Account number</li>
                  <li><strong>Zone:</strong> Zone identifier (e.g., Zone_03_A)</li>
                  <li><strong>Type:</strong> Meter type (e.g., Residential, Retail)</li>
                  <li><strong>Parent Meter:</strong> Identifies connection hierarchy</li>
                  <li><strong>Label:</strong> Identifier for level (L1, L2, L3, DC)</li>
                  <li><strong>Monthly data:</strong> One column per month (e.g., Jan-24, Feb-24)</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Footer */}
      <div className={`${currentTheme.cardBg} rounded-lg ${currentTheme.shadow} p-4 md:p-6 transition-colors duration-300`}>
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className={`text-sm ${currentTheme.textSecondary} mb-2 md:mb-0`}>
            Muscat Bay Water Management System
          </div>
          <div className={`text-sm ${currentTheme.textSecondary}`}>
            © 2025 | Updated: April 19, 2025
          </div>
        </div>
      </div>
    </div>
  );
}

export default WaterSystemDashboard;