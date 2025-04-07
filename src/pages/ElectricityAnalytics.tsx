import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from "recharts";
import { Zap, Download, Filter, BarChart as BarChartIcon, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { electricityRecords2024 } from "@/data/electricityData";

// --- Configuration ---
// Color Palette
const COLORS = {
  primary: "#8BBABB", 
  secondary: "#4E4456", 
  accentTeal: "#6A8D92", 
  accentAmber: "#F59E0B",
  accentSky: "#38BDF8", 
  danger: "#EF4444", 
  success: "#10B981", 
  bgBase: "#F8FAFC",
  bgCard: "#FFFFFF", 
  bgSubtle: "#F1F5F9", 
  bgHeader: "#4E4456", 
  textDark: "#1E293B",
  textMedium: "#475569", 
  textLight: "#64748B", 
  textWhite: "#FFFFFF", 
  textHeader: "#F1F5F9",
  textHeaderSecondary: "#CBD5E1", 
  chartGrid: "#E2E8F0", 
  axisLine: "#CBD5E1", 
  axisText: "#475569",
  chartColors: ["#8BBABB", "#6A8D92", "#F59E0B", "#38BDF8", "#A4BFBF", "#5E7B7F", "#CBD5E1", "#EF4444", "#10B981", "#4E4456"],
};

// --- Constants ---
const ELECTRICITY_COST_RATE = 0.025; // OMR per kWh

// --- Utility Functions ---
const formatNumber = (num: number | undefined | null, decimals = 0) => {
  if (num === undefined || num === null || isNaN(num)) { 
    return (0).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }); 
  }
  return num.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const formatCurrency = (num: number | undefined | null) => {
  if (num === undefined || num === null || isNaN(num)) { 
    return formatNumber(0, 3); 
  } 
  return formatNumber(num, 3);
};

// --- Types ---
interface ElectricityRecord {
  sl: number;
  zone: string;
  type: string;
  name: string;
  meter: string;
  jan25: number;
  feb25: number;
  mar25: number;
}

interface ElectricityRecord2024 {
  id: number;
  name: string;
  type: string;
  meterAccountNo: string;
  consumption: {
    jan2024: number;
    feb2024: number;
    mar2024: number;
    apr2024: number;
    may2024: number;
    jun2024: number;
    jul2024: number;
    aug2024: number;
    sep2024: number;
    oct2024: number;
    nov2024: number;
    dec2024: number;
  };
}

// --- Reusable Components ---
const CustomTooltip = ({ 
  active, 
  payload, 
  label, 
  valueFormatter = (val: number) => formatNumber(val, 1), 
  unit = "kWh", 
  showCost = false 
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  valueFormatter?: (val: number) => string;
  unit?: string;
  showCost?: boolean;
}) => {
  if (active && payload && payload.length) { 
    const cost = showCost ? (payload[0].value || 0) * ELECTRICITY_COST_RATE : null; 
    
    return (
      <div className="bg-white/90 backdrop-blur-sm p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
        <p className="font-bold text-gray-700 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center py-0.5">
            <span 
              className="inline-block w-2.5 h-2.5 mr-2 rounded-full" 
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="font-medium text-gray-600 mr-1">{`${entry.name}: `}</span>
            <span className="text-gray-800 font-semibold">
              {`${valueFormatter(entry.value)} ${entry.unit || unit}`}
            </span>
          </p>
        ))}
        {cost !== null && (
          <p className="flex items-center py-0.5 mt-1 pt-1 border-t border-gray-200/60">
            <span className="inline-block w-2.5 h-2.5 mr-2 rounded-full bg-green-500" />
            <span className="font-medium text-gray-600 mr-1">Est. Cost: </span>
            <span className="text-gray-800 font-semibold">{`${formatCurrency(cost)} OMR`}</span>
          </p>
        )}
      </div>
    ); 
  } 
  return null;
};

const KpiCard = ({ 
  title, 
  value, 
  unit, 
  color, 
  icon, 
  isCurrency = false 
}: {
  title: string;
  value: string | number;
  unit?: string;
  color: string;
  icon: React.ReactNode;
  isCurrency?: boolean;
}) => {
  const displayValue = (value !== undefined && value !== null) 
    ? (isCurrency ? formatCurrency(Number(value)) : value) 
    : "N/A"; 
    
  return (
    <div className="bg-bgCard rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 border border-gray-100 hover:border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div 
            className="flex-shrink-0 bg-opacity-10 rounded-md p-3" 
            style={{ backgroundColor: `${color}30` }}
          >
            {icon}
          </div>
          <div className="ml-4 sm:ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-textLight truncate">{title}</dt>
              <dd>
                <div className="text-xl font-semibold text-textDark">
                  {isCurrency && displayValue !== "N/A" && 
                    <span className="text-sm font-medium text-textLight mr-1">OMR</span>
                  }
                  {displayValue}
                  {!isCurrency && unit && 
                    <span className="text-xs font-medium text-textLight ml-1">{unit}</span>
                  }
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Data Definition ---
const electricityRawData: ElectricityRecord[] = [
  { sl: 1, zone: "Infrastructure", type: "Pumping Station", name: "Pumping Station 01", meter: "R52330", jan25: 1903, feb25: 2095, mar25: 3032 },
  { sl: 2, zone: "Infrastructure", type: "Pumping Station", name: "Pumping Station 03", meter: "RS2329", jan25: 32.5, feb25: 137.2, mar25: 130.7 },
  { sl: 3, zone: "Infrastructure", type: "Pumping Station", name: "Pumping Station 04", meter: "852327", jan25: 245.1, feb25: 869.5, mar25: 646.1 },
  { sl: 4, zone: "Infrastructure", type: "Pumping Station", name: "Pumping Station 05", meter: "R52325", jan25: 2069, feb25: 2521, mar25: 2601 },
  { sl: 5, zone: "Infrastructure", type: "Lifting Station", name: "Lifting Station 02", meter: "R52328", jan25: 0, feb25: 0, mar25: 0 },
  { sl: 6, zone: "Infrastructure", type: "Lifting Station", name: "Lifting Station 03", meter: "R52333", jan25: 28, feb25: 40, mar25: 58 },
  { sl: 7, zone: "Infrastructure", type: "Lifting Station", name: "Lifting Station 04", meter: "R52324", jan25: 701, feb25: 638, mar25: 572 },
  { sl: 8, zone: "Infrastructure", type: "Lifting Station", name: "Lifting Station 05", meter: "R52332", jan25: 2873, feb25: 3665, mar25: 3069 },
  { sl: 9, zone: "Infrastructure", type: "Irrigation Tank", name: "Irrigation Tank 01", meter: "R52324 (RS2326)", jan25: 1689, feb25: 2214, mar25: 1718 },
  { sl: 10, zone: "Infrastructure", type: "Irrigation Tank", name: "Irrigation Tank 02", meter: "R52331", jan25: 983, feb25: 1124, mar25: 1110 },
  { sl: 11, zone: "Infrastructure", type: "Irrigation Tank", name: "Irrigation Tank 03", meter: "R52323", jan25: 840, feb25: 1009, mar25: 845 },
  { sl: 12, zone: "Infrastructure", type: "Irrigation Tank", name: "Irrigation Tank 04", meter: "R53195", jan25: 39.7, feb25: 233.2, mar25: 234.9 },
  { sl: 13, zone: "Infrastructure", type: "Actuator DB", name: "Actuator DB 01 (28)", meter: "R53196", jan25: 7.3, feb25: 27.7, mar25: 24.4 },
  { sl: 14, zone: "Infrastructure", type: "Actuator DB", name: "Actuator DB 02", meter: "R51900", jan25: 33, feb25: 134, mar25: 138.5 },
  { sl: 15, zone: "Infrastructure", type: "Actuator DB", name: "Actuator DB 03", meter: "R51904", jan25: 55.7, feb25: 203.3, mar25: 196 },
  { sl: 16, zone: "Infrastructure", type: "Actuator DB", name: "Actuator DB 04", meter: "R51901", jan25: 186, feb25: 161, mar25: 227 },
  { sl: 17, zone: "Infrastructure", type: "Actuator DB", name: "Actuator DB 05", meter: "R51907", jan25: 42, feb25: 17.8, mar25: 14 },
  { sl: 18, zone: "Infrastructure", type: "Actuator DB", name: "Actuator DB 06", meter: "R51909", jan25: 47, feb25: 45, mar25: 38 },
  { sl: 19, zone: "Infrastructure", type: "Street Light", name: "Street Light FP 01 (28)", meter: "R53197", jan25: 787, feb25: 3228, mar25: 2663 },
  { sl: 20, zone: "Infrastructure", type: "Street Light", name: "Street Light FP 02", meter: "R51906", jan25: 633, feb25: 2298, mar25: 1812 },
  { sl: 21, zone: "Infrastructure", type: "Street Light", name: "Street Light FP 03", meter: "R51905", jan25: 1868, feb25: 1974, mar25: 1562 },
  { sl: 22, zone: "Infrastructure", type: "Street Light", name: "Street Light FP 04", meter: "R51908", jan25: 325, feb25: 1406, mar25: 1401 },
  { sl: 23, zone: "Infrastructure", type: "Street Light", name: "Street Light FP 05", meter: "R51902", jan25: 449, feb25: 2069.9, mar25: 1870.1 },
  { sl: 24, zone: "Infrastructure", type: "Beachwell", name: "Beachwell", meter: "R51903", jan25: 38168, feb25: 18422, mar25: 40 },
  { sl: 25, zone: "Infrastructure", type: "Helipad", name: "Helipad", meter: "R52334", jan25: 0, feb25: 0, mar25: 0 },
  { sl: 26, zone: "Central Park", type: "Park", name: "Central Park", meter: "R54672", jan25: 22819, feb25: 19974, mar25: 14190 },
  { sl: 27, zone: "Ancillary", type: "Building", name: "Guard House", meter: "R53651", jan25: 798, feb25: 936, mar25: 879 },
  { sl: 28, zone: "Ancillary", type: "Building", name: "Security Building", meter: "R53649", jan25: 5559, feb25: 5417, mar25: 4504 },
  { sl: 29, zone: "Ancillary", type: "Building", name: "ROP Building", meter: "R53648", jan25: 2090, feb25: 2246, mar25: 1939 },
  { sl: 30, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D44", meter: "R53705", jan25: 647, feb25: 657, mar25: 650 },
  { sl: 31, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D45", meter: "R53665", jan25: 670, feb25: 556, mar25: 608 },
  { sl: 32, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D46", meter: "R53700", jan25: 724, feb25: 690, mar25: 752 },
  { sl: 33, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D47", meter: "R53690", jan25: 887, feb25: 738, mar25: 792 },
  { sl: 34, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D48", meter: "R53666", jan25: 826, feb25: 676, mar25: 683 },
  { sl: 35, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D49", meter: "R53715", jan25: 860, feb25: 837, mar25: 818 },
  { sl: 36, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D50", meter: "R53672", jan25: 765, feb25: 785, mar25: 707 },
  { sl: 37, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D51", meter: "853657", jan25: 661, feb25: 682, mar25: 642 },
  { sl: 38, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D52", meter: "R53699", jan25: 979, feb25: 896, mar25: 952 },
  { sl: 39, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D53", meter: "R54782", jan25: 693, feb25: 732, mar25: 760 },
  { sl: 40, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D54", meter: "R54793", jan25: 681, feb25: 559, mar25: 531 },
  { sl: 41, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D55", meter: "R54804", jan25: 677, feb25: 616, mar25: 719 },
  { sl: 42, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D56", meter: "R54815", jan25: 683, feb25: 731, mar25: 765 },
  { sl: 43, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D57", meter: "R54826", jan25: 990, feb25: 846, mar25: 795 },
  { sl: 44, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D58", meter: "R54836", jan25: 593, feb25: 535, mar25: 594 },
  { sl: 45, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D59", meter: "R54847", jan25: 628, feb25: 582, mar25: 697 },
  { sl: 46, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D60", meter: "R54858", jan25: 674, feb25: 612, mar25: 679 },
  { sl: 47, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D61", meter: "R54869", jan25: 767, feb25: 800, mar25: 719 },
  { sl: 48, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D62", meter: "R53717", jan25: 715, feb25: 677, mar25: 595 },
  { sl: 49, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D74", meter: "R53675", jan25: 639, feb25: 566, mar25: 463 },
  { sl: 50, zone: "Zone 3", type: "Apartment Common", name: "SB3 Common Meter D75", meter: "R53668", jan25: 475, feb25: 508, mar25: 554 },
  { sl: 51, zone: "Village Square", type: "Common Area", name: "Village Square Common", meter: "R56628", jan25: 3304, feb25: 3335, mar25: 3383 },
  { sl: 52, zone: "Zone 3", type: "Landscape Light", name: "FP-17", meter: "R54872", jan25: 0, feb25: 0, mar25: 0 },
  { sl: 53, zone: "Zone 3", type: "Landscape Light", name: "FP-21", meter: "R54873", jan25: 12.9, feb25: 56.6, mar25: 46.5 },
  { sl: 54, zone: "Zone 3", type: "Landscape Light", name: "FP-22", meter: "R54874", jan25: 0, feb25: 0, mar25: 0 },
  { sl: 55, zone: "Bank Muscat", type: "Bank", name: "Bank Muscat", meter: "", jan25: 59, feb25: 98, mar25: 88 },
  { sl: 56, zone: "CIF Kitchen", type: "Kitchen", name: "CIF kitchen", meter: "", jan25: 16788, feb25: 16154, mar25: 14971 },
];

// Function to process raw data
const processElectricityData = (rawData: ElectricityRecord[]): ProcessedElectricityData => {
  const monthlyTotals = { jan25: 0, feb25: 0, mar25: 0 };
  const categoryTotalsMar: Record<string, number> = {};
  const typeTotalsMar: Record<string, number> = {};
  const meterDetails = [];
  const uniqueCategories = new Set<string>();
  const uniqueTypes = new Set<string>();
  const typesByCategory: Record<string, string[]> = {};

  rawData.forEach(item => {
    const jan = parseFloat(item.jan25.toString()) || 0;
    const feb = parseFloat(item.feb25.toString()) || 0;
    const mar = parseFloat(item.mar25.toString()) || 0;
    
    monthlyTotals.jan25 += jan;
    monthlyTotals.feb25 += feb;
    monthlyTotals.mar25 += mar;
    
    const category = item.zone || "Unknown";
    const type = item.type || "Unknown";
    
    uniqueCategories.add(category);
    uniqueTypes.add(type);
    
    categoryTotalsMar[category] = (categoryTotalsMar[category] || 0) + mar;
    typeTotalsMar[type] = (typeTotalsMar[type] || 0) + mar;
    
    // Group types by category
    if (!typesByCategory[category]) {
      typesByCategory[category] = [];
    }
    if (!typesByCategory[category].includes(type)) {
      typesByCategory[category].push(type);
    }
    
    meterDetails.push({
      id: item.meter || `SL-${item.sl}`,
      zone: category,
      type: type,
      name: item.name || `Meter ${item.meter || item.sl}`,
      consumptionJan25: jan,
      consumptionFeb25: feb,
      consumption: mar,
      cost: mar * ELECTRICITY_COST_RATE,
    });
  });

  const formatBreakdown = (totals: Record<string, number>) => {
    return Object.entries(totals)
      .map(([name, value], index) => ({
        name: name,
        value: value,
        color: COLORS.chartColors[index % COLORS.chartColors.length] || COLORS.primary
      }))
      .sort((a, b) => b.value - a.value);
  };

  const totalMar = monthlyTotals.mar25;
  const meterCount = meterDetails.length;
  const avgMar = meterCount > 0 ? totalMar / meterCount : 0;
  const totalCostMar = totalMar * ELECTRICITY_COST_RATE;
  const peakMeterMar = [...meterDetails].sort((a, b) => b.consumption - a.consumption)[0] || { name: 'N/A', consumption: 0 };

  return {
    monthlyConsumption: [
      { month: "Jan-25", kWh: monthlyTotals.jan25 },
      { month: "Feb-25", kWh: monthlyTotals.feb25 },
      { month: "Mar-25", kWh: monthlyTotals.mar25 },
    ],
    marchData: {
      totalKWh: totalMar,
      totalCost: totalCostMar,
      averageKWh: avgMar,
      peakMeter: peakMeterMar,
      breakdownByCategory: formatBreakdown(categoryTotalsMar),
      breakdownByType: formatBreakdown(typeTotalsMar),
    },
    meterDetails: meterDetails,
    categories: Array.from(uniqueCategories).sort(),
    types: Array.from(uniqueTypes).sort(),
    typesByCategory: typesByCategory,
  };
};

// Function to process 2024 data
const process2024ElectricityData = (rawData: ElectricityRecord2024[]): ProcessedElectricityData => {
  const monthlyTotals = { jan24: 0, feb24: 0, mar24: 0 };
  const categoryTotalsMar: Record<string, number> = {};
  const typeTotalsMar: Record<string, number> = {};
  const meterDetails = [];
  const uniqueCategories = new Set<string>();
  const uniqueTypes = new Set<string>();
  const typesByCategory: Record<string, string[]> = {};

  rawData.forEach(item => {
    const jan = item.consumption.jan2024 || 0;
    const feb = item.consumption.feb2024 || 0;
    const mar = item.consumption.mar2024 || 0;
    
    monthlyTotals.jan24 += jan;
    monthlyTotals.feb24 += feb;
    monthlyTotals.mar24 += mar;
    
    // Extract category from name or use type as fallback
    let category = "Infrastructure";
    if (item.name.includes("Zone")) {
      category = "Zone";
    } else if (item.name.includes("Village")) {
      category = "Village Square";
    } else if (item.name.includes("Central")) {
      category = "Central Park";
    } else if (item.type === "Kitchen" || item.type === "Bank") {
      category = "Ancillary";
    }
    
    const type = item.type || "Unknown";
    
    uniqueCategories.add(category);
    uniqueTypes.add(type);
    
    categoryTotalsMar[category] = (categoryTotalsMar[category] || 0) + mar;
    typeTotalsMar[type] = (typeTotalsMar[type] || 0) + mar;
    
    // Group types by category
    if (!typesByCategory[category]) {
      typesByCategory[category] = [];
    }
    if (!typesByCategory[category].includes(type)) {
      typesByCategory[category].push(type);
    }
    
    meterDetails.push({
      id: item.meterAccountNo || `SL-${item.id}`,
      zone: category,
      type: type,
      name: item.name,
      consumptionJan25: jan,
      consumptionFeb25: feb,
      consumption: mar,
      cost: mar * ELECTRICITY_COST_RATE,
    });
  });

  const formatBreakdown = (totals: Record<string, number>) => {
    return Object.entries(totals)
      .map(([name, value], index) => ({
        name: name,
        value: value,
        color: COLORS.chartColors[index % COLORS.chartColors.length] || COLORS.primary
      }))
      .sort((a, b) => b.value - a.value);
  };

  const totalMar = monthlyTotals.mar24;
  const meterCount = meterDetails.length;
  const avgMar = meterCount > 0 ? totalMar / meterCount : 0;
  const totalCostMar = totalMar * ELECTRICITY_COST_RATE;
  const peakMeterMar = [...meterDetails].sort((a, b) => b.consumption - a.consumption)[0] || { name: 'N/A', consumption: 0 };

  return {
    monthlyConsumption: [
      { month: "Jan-24", kWh: monthlyTotals.jan24 },
      { month: "Feb-24", kWh: monthlyTotals.feb24 },
      { month: "Mar-24", kWh: monthlyTotals.mar24 },
    ],
    marchData: {
      totalKWh: totalMar,
      totalCost: totalCostMar,
      averageKWh: avgMar,
      peakMeter: peakMeterMar,
      breakdownByCategory: formatBreakdown(categoryTotalsMar),
      breakdownByType: formatBreakdown(typeTotalsMar),
    },
    meterDetails: meterDetails,
    categories: Array.from(uniqueCategories).sort(),
    types: Array.from(uniqueTypes).sort(),
    typesByCategory: typesByCategory,
  };
};

// Process the raw data
const electricityData2025 = processElectricityData(electricityRawData);
const electricityData2024 = process2024ElectricityData(electricityRecords2024);

// --- Main Dashboard Component ---
const ElectricityAnalytics: React.FC = () => {
  // --- State Variables ---
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "consumption", direction: "desc" });
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedYear, setSelectedYear] = useState(2025);
  const [availableTypes, setAvailableTypes] = useState<string[]>(electricityData2025.types);

  // Get current data based on selected year
  const electricityData = useMemo(() => {
    return selectedYear === 2025 ? electricityData2025 : electricityData2024;
  }, [selectedYear]);

  // Update available types when category changes
  useEffect(() => {
    if (selectedCategory === "All") {
      setAvailableTypes(electricityData.types);
    } else {
      setAvailableTypes(electricityData.typesByCategory[selectedCategory] || []);
    }
    
    // Reset type selection if the current selection isn't available in the new category
    if (selectedCategory !== "All" && selectedType !== "All") {
      const typesInCategory = electricityData.typesByCategory[selectedCategory] || [];
      if (!typesInCategory.includes(selectedType)) {
        setSelectedType("All");
      }
    }
  }, [selectedCategory, electricityData]);

  // --- Memoized Data Processing ---
  const filteredMeterDetails = useMemo(() => {
    const filtered = electricityData.meterDetails.filter(
      (item) => 
        (selectedCategory === "All" || item.zone === selectedCategory) && 
        (selectedType === "All" || item.type === selectedType) && 
        (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         item.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
         item.zone.toLowerCase().includes(searchTerm.toLowerCase()) || 
         item.type.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a];
      const bValue = b[sortConfig.key as keyof typeof b];
      
      const valA = sortConfig.key === 'cost' ? (a.consumption * ELECTRICITY_COST_RATE) : aValue;
      const valB = sortConfig.key === 'cost' ? (b.consumption * ELECTRICITY_COST_RATE) : bValue;
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        if (valA.toLowerCase() < valB.toLowerCase()) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA.toLowerCase() > valB.toLowerCase()) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      } else {
        const numA = parseFloat(valA as string) || 0;
        const numB = parseFloat(valB as string) || 0;
        if (numA < numB) return sortConfig.direction === "asc" ? -1 : 1;
        if (numA > numB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      }
    });
  }, [searchTerm, sortConfig, selectedCategory, selectedType, electricityData]);

  const filteredTrendData = useMemo(() => {
    const monthlySums = { jan: 0, feb: 0, mar: 0 };
    
    filteredMeterDetails.forEach(meter => {
      monthlySums.jan += meter.consumptionJan25 || 0;
      monthlySums.feb += meter.consumptionFeb25 || 0;
      monthlySums.mar += meter.consumption || 0;
    });
    
    return [
      { month: `Jan-${selectedYear.toString().substring(2)}`, kWh: monthlySums.jan },
      { month: `Feb-${selectedYear.toString().substring(2)}`, kWh: monthlySums.feb },
      { month: `Mar-${selectedYear.toString().substring(2)}`, kWh: monthlySums.mar },
    ];
  }, [filteredMeterDetails, selectedYear]);

  const topFilteredMeters = useMemo(() => {
    return filteredMeterDetails
      .slice()
      .sort((a, b) => b.consumption - a.consumption)
      .slice(0, 5);
  }, [filteredMeterDetails]);

  // --- Event Handlers ---
  const requestSort = (key: string) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };
  
  const resetFilters = () => {
    setSelectedCategory("All");
    setSelectedType("All");
    setSearchTerm("");
  };
  
  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    console.log("Selected Year:", year);
  };

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  // --- Common Chart Styles ---
  const commonAxisStyle = { 
    tick: { fill: COLORS.axisText, fontSize: 11 }, 
    axisLine: { stroke: COLORS.axisLine }, 
    tickLine: { stroke: COLORS.axisLine, opacity: 0.6 } 
  };
  
  const commonLegendStyle = { 
    wrapperStyle: { paddingTop: 15, fontSize: 11, color: COLORS.textMedium } 
  };
  
  const commonChartMargin = { top: 10, right: 20, left: 5, bottom: 0 };

  // --- JSX Rendering ---
  return (
    <StandardPageLayout
      title="Electricity Monitoring System"
      description="Advanced analytics and monitoring for electricity consumption"
      icon={<Zap className="h-5 w-5" />}
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Period Selection */}
        <div className="flex flex-wrap gap-3 mb-2">
          <Select 
            value={selectedYear.toString()} 
            onValueChange={(value) => handleYearSelect(parseInt(value))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-gray-500 mt-2">
            Showing data for Q1 {selectedYear}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          <KpiCard 
            title={`Total Consumption (Q1 ${selectedYear})`} 
            value={formatNumber(electricityData.marchData.totalKWh, 0)} 
            unit="kWh" 
            color={COLORS.primary} 
            icon={<Zap size={24} color={COLORS.primary} />}
          />
          
          <KpiCard 
            title={`Total Est. Cost (Q1 ${selectedYear})`} 
            value={electricityData.marchData.totalCost} 
            isCurrency={true} 
            color={COLORS.success} 
            icon={<Activity size={24} color={COLORS.success} />}
          />
          
          <KpiCard 
            title={`Avg. per Meter (Mar ${selectedYear})`} 
            value={formatNumber(electricityData.marchData.averageKWh, 1)} 
            unit="kWh" 
            color={COLORS.secondary} 
            icon={<BarChartIcon size={24} color={COLORS.secondary} />}
          />
          
          <KpiCard 
            title={`Peak Meter (Mar ${selectedYear})`} 
            value={electricityData.marchData.peakMeter.name} 
            unit={`(${formatNumber(electricityData.marchData.peakMeter.consumption, 0)} kWh)`} 
            color={COLORS.accentAmber} 
            icon={<Activity size={24} color={COLORS.accentAmber} />}
          />
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="category">Category Breakdown</TabsTrigger>
            <TabsTrigger value="type">Type Breakdown</TabsTrigger>
            <TabsTrigger value="meters">Meter Details</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Monthly Consumption Trend (Q1 {selectedYear})
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={electricityData.monthlyConsumption} 
                      margin={commonChartMargin}
                    >
                      <defs>
                        <linearGradient id="colorKWh" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.7}/>
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.5} stroke={COLORS.chartGrid} />
                      <XAxis dataKey="month" {...commonAxisStyle} />
                      <YAxis {...commonAxisStyle} />
                      <Tooltip 
                        content={
                          <CustomTooltip 
                            valueFormatter={(v) => formatNumber(v, 0)} 
                            showCost={true}
                          />
                        } 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="kWh" 
                        name="Total Consumption" 
                        stroke={COLORS.primary} 
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#colorKWh)" 
                        activeDot={{ r: 5, strokeWidth: 1, stroke: COLORS.primary }} 
                        dot={{ r: 3, fill: COLORS.primary, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Category Breakdown Tab */}
          <TabsContent value="category" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Consumption by Category (March {selectedYear})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={electricityData.marchData.breakdownByCategory} 
                          cx="50%" 
                          cy="50%" 
                          labelLine={false} 
                          outerRadius={110} 
                          innerRadius={50} 
                          paddingAngle={1} 
                          dataKey="value" 
                          nameKey="name" 
                          label={({ percent }) => (percent > 0.03 ? `${(percent * 100).toFixed(0)}%` : '')}
                        >
                          {electricityData.marchData.breakdownByCategory.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color || COLORS.chartColors[index % COLORS.chartColors.length]} 
                              stroke={COLORS.bgCard} 
                              strokeWidth={1} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={
                            <CustomTooltip 
                              valueFormatter={(v) => formatNumber(v, 0)} 
                              showCost={true}
                            />
                          } 
                        />
                        <Legend 
                          iconType="circle" 
                          layout="vertical" 
                          verticalAlign="middle" 
                          align="right" 
                          {...commonLegendStyle} 
                          wrapperStyle={{...commonLegendStyle.wrapperStyle, paddingLeft: "10px"}}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={electricityData.marchData.breakdownByCategory} 
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }} 
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.5} stroke={COLORS.chartGrid}/>
                        <XAxis type="number" {...commonAxisStyle} />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={120} 
                          {...commonAxisStyle} 
                          style={{fontSize: '11px'}}
                        />
                        <Tooltip 
                          content={
                            <CustomTooltip 
                              valueFormatter={(v) => formatNumber(v, 0)} 
                              showCost={true}
                            />
                          } 
                        />
                        <Bar 
                          dataKey="value" 
                          name="Consumption (kWh)" 
                          background={{ fill: COLORS.bgSubtle, radius: 4 }} 
                          radius={[0, 4, 4, 0]}
                        >
                          {electricityData.marchData.breakdownByCategory.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color || COLORS.chartColors[index % COLORS.chartColors.length]} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Type Breakdown Tab */}
          <TabsContent value="type" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Consumption by Type (March {selectedYear})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={electricityData.marchData.breakdownByType} 
                          cx="50%" 
                          cy="50%" 
                          labelLine={false} 
                          outerRadius={110} 
                          innerRadius={50} 
                          paddingAngle={1} 
                          dataKey="value" 
                          nameKey="name" 
                          label={({ percent }) => (percent > 0.02 ? `${(percent * 100).toFixed(0)}%` : '')}
                        >
                          {electricityData.marchData.breakdownByType.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color || COLORS.chartColors[index % COLORS.chartColors.length]} 
                              stroke={COLORS.bgCard} 
                              strokeWidth={1} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={
                            <CustomTooltip 
                              valueFormatter={(v) => formatNumber(v, 0)} 
                              showCost={true}
                            />
                          } 
                        />
                        <Legend 
                          iconType="circle" 
                          layout="vertical" 
                          verticalAlign="middle" 
                          align="right" 
                          {...commonLegendStyle} 
                          wrapperStyle={{...commonLegendStyle.wrapperStyle, paddingLeft: "10px", fontSize: '10px'}}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={electricityData.marchData.breakdownByType} 
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }} 
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.5} stroke={COLORS.chartGrid}/>
                        <XAxis type="number" {...commonAxisStyle} />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={130} 
                          {...commonAxisStyle} 
                          style={{fontSize: '11px'}}
                        />
                        <Tooltip 
                          content={
                            <CustomTooltip 
                              valueFormatter={(v) => formatNumber(v, 0)} 
                              showCost={true}
                            />
                          } 
                        />
                        <Bar 
                          dataKey="value" 
                          name="Consumption (kWh)" 
                          background={{ fill: COLORS.bgSubtle, radius: 4 }} 
                          radius={[0, 4, 4, 0]}
                        >
                          {electricityData.marchData.breakdownByType.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color || COLORS.chartColors[index % COLORS.chartColors.length]} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Meter Details Tab */}
          <TabsContent value="meters" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Category Filters */}
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-600 mr-2 flex-shrink-0">Category:</span>
                    <Button 
                      size="sm" 
                      variant={selectedCategory === 'All' ? 'default' : 'outline'} 
                      onClick={() => handleCategoryChange("All")}
                      className="rounded-full text-xs h-8"
                    >
                      All
                    </Button>
                    {electricityData.categories.map(cat => (
                      <Button 
                        key={cat} 
                        size="sm"
                        variant={selectedCategory === cat ? 'default' : 'outline'}
                        onClick={() => handleCategoryChange(cat)}
                        className="rounded-full text-xs h-8"
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Type Filters - Now filtered based on selected category */}
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-600 mr-2 flex-shrink-0">Type:</span>
                    <Button 
                      size="sm" 
                      variant={selectedType === 'All' ? 'default' : 'outline'} 
                      onClick={() => setSelectedType("All")}
                      className="rounded-full text-xs h-8"
                    >
                      All
                    </Button>
                    {availableTypes.map(type => (
                      <Button 
                        key={type} 
                        size="sm"
                        variant={selectedType === type ? 'default' : 'outline'}
                        onClick={() => setSelectedType(type)}
                        className="rounded-full text-xs h-8"
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Search and Reset */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <div className="relative flex-grow">
                      <label htmlFor="searchFilter" className="sr-only">Search</label>
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                      </span>
                      <input 
                        id="searchFilter" 
                        type="text" 
                        placeholder="Search meters..." 
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 text-sm" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button 
                      variant="outline"
                      onClick={resetFilters}
                      className="flex-shrink-0"
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>
                
                {/* Meter Details Table */}
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {[
                          { key: "name", label: "Meter Name" },
                          { key: "id", label: "Meter ID" },
                          { key: "zone", label: "Category/Zone" },
                          { key: "type", label: "Type" },
                          { key: "consumption", label: `Consumption (Mar ${selectedYear})` },
                          { key: "cost", label: `Est. Cost (Mar ${selectedYear})` }
                        ].map(col => (
                          <th 
                            key={col.key} 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => requestSort(col.key)}
                          >
                            {col.label} {sortConfig.key === col.key && (
                              <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMeterDetails.length > 0 && selectedYear === 2025 ? (
                        filteredMeterDetails.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.zone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                              {formatNumber(item.consumption, 1)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                              {formatCurrency(item.cost)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td 
                            colSpan={6} 
                            className="text-center py-6 text-gray-500 text-sm"
                          >
                            {selectedYear === 2024 
                              ? "Select 2025 to view data." 
                              : "No meters found matching your criteria."
                            }
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StandardPageLayout>
  );
};

export default ElectricityAnalytics;
