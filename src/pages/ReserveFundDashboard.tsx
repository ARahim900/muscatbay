import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title, Chart,
  ChartOptions
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Landmark, Search, Bell, UserCircle, LayoutDashboard, Calculator,
  Building2, Play, Globe2, MapPin, Ruler, Banknote, Scale
} from 'lucide-react';

// Register Chart.js components needed
ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// --- DATA ---
const ratesOMRPerSqm2025 = {
  masterCommunity: 1.75,
  typicalBuilding: 1.65,
  zone3: 0.44,
  zone5: 1.10,
  zone8: 0.33,
  zone1: 3.95,
  zone2: 0.0,
};

const propertyDatabase = [
  { id: "FM-B1", unitNo: "FM B1", sector: "FM", zone: '1', propertyType: "Staff Accommodation", unitTypeDetail: "Staff Building B1", buaSqm: 1615.44, plot: "FM-101", status: "Occupied", ownerName: "Muscat Bay" },
  { id: "FM-B2", unitNo: "FM B2", sector: "FM", zone: '1', propertyType: "Staff Accommodation", unitTypeDetail: "Staff Building B2", buaSqm: 1615.44, plot: "FM-102", status: "Occupied", ownerName: "Muscat Bay" },
  { id: "FM-B3", unitNo: "FM B3", sector: "FM", zone: '1', propertyType: "Staff Accommodation", unitTypeDetail: "Staff Building B3", buaSqm: 1615.44, plot: "FM-103", status: "Occupied", ownerName: "Muscat Bay" },
  { id: "FM-B4", unitNo: "FM B4", sector: "FM", zone: '1', propertyType: "Staff Accommodation", unitTypeDetail: "Staff Building B4", buaSqm: 1615.44, plot: "FM-104", status: "Occupied", ownerName: "Muscat Bay" },
  { id: "FM-B5", unitNo: "FM B5", sector: "FM", zone: '1', propertyType: "Staff Accommodation", unitTypeDetail: "Staff Building B5", buaSqm: 1615.44, plot: "FM-105", status: "Occupied", ownerName: "Muscat Bay" },
  { id: "FM-B6", unitNo: "FM B6", sector: "FM", zone: '1', propertyType: "Staff Accommodation", unitTypeDetail: "Staff Building B6", buaSqm: 1615.44, plot: "FM-106", status: "Occupied", ownerName: "Muscat Bay" },
  { id: "FM-B7", unitNo: "FM B7", sector: "FM", zone: '1', propertyType: "Staff Accommodation", unitTypeDetail: "Staff Building B7", buaSqm: 1615.44, plot: "FM-107", status: "Occupied", ownerName: "Muscat Bay" },
  { id: "FM-B8", unitNo: "FM B8", sector: "FM", zone: '1', propertyType: "Staff Accommodation", unitTypeDetail: "Staff Building B8", buaSqm: 1615.44, plot: "FM-108", status: "Occupied", ownerName: "Muscat Bay" },
  { id: "FM-CIF", unitNo: "FM CIF", sector: "FM", zone: '1', propertyType: "Staff Accommodation", unitTypeDetail: "CIF Building", buaSqm: 548.5, plot: "FM-109", status: "Occupied", ownerName: "Muscat Bay" },
  { id: "Z2-VS-01", unitNo: "Z2 VS-01", sector: "Village Square", zone: '2', propertyType: "Commercial", unitTypeDetail: "Commercial Unit (e.g., Spar)", buaSqm: 150, plot: "VS-01", status: "Operational", ownerName: "Tenant A" },
  { id: "Z2-VS-02", unitNo: "Z2 VS-02", sector: "Village Square", zone: '2', propertyType: "Commercial", unitTypeDetail: "Commercial Unit (e.g., Laundry)", buaSqm: 80, plot: "VS-02", status: "Operational", ownerName: "Tenant B" },
  { id: "Z2-VS-03", unitNo: "Z2 VS-03", sector: "Village Square", zone: '2', propertyType: "Commercial", unitTypeDetail: "Commercial Unit (e.g., Gym)", buaSqm: 200, plot: "VS-03", status: "Operational", ownerName: "Tenant C" },
  { id: "Z3 061(1A)", unitNo: "Z3 061(1A)", sector: "Zaha", zone: '3', propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, plot: "1232", status: "Sold", ownerName: "Abdullah Al-Farsi" },
  { id: "Z3 054(4A)", unitNo: "Z3 054(4A)", sector: "Zaha", zone: '3', propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, plot: "1275", status: "Sold", ownerName: "Fatima Al-Balushi" },
  { id: "Z3 057(5)", unitNo: "Z3 057(5)", sector: "Zaha", zone: '3', propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 355.07, plot: "1290", status: "Sold", ownerName: "Mohammed Al-Habsi" },
  { id: "Z3 050(1)", unitNo: "Z3 050(1)", sector: "Zaha", zone: '3', propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, plot: "1144", status: "Sold", ownerName: "Aisha Al-Riyami" },
  { id: "Z3 019", unitNo: "Z3 019", sector: "Zaha", zone: '3', propertyType: "Villa", unitTypeDetail: "3 Bedroom Zaha Villa", buaSqm: 357.12, plot: "471", status: "Sold", ownerName: "Khalid Al-Maskari" },
  { id: "Z5 019", unitNo: "Z5 019", sector: "Nameer", zone: '5', propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, plot: "769", status: "Sold", ownerName: "Hamad Al-Rawahi" },
  { id: "Z5 018", unitNo: "Z5 018", sector: "Nameer", zone: '5', propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, plot: "769", status: "Sold", ownerName: "Alya Al-Sinani" },
  { id: "Z5 020", unitNo: "Z5 020", sector: "Nameer", zone: '5', propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, plot: "770", status: "Sold", ownerName: "Qais Al-Khusaibi" },
  { id: "Z8 002", unitNo: "Z8 002", sector: "Wajd", zone: '8', propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 750.35, plot: "1418.7", status: "Inventory", ownerName: "Muscat Bay Holding" },
  { id: "Z8 003", unitNo: "Z8 003", sector: "Wajd", zone: '8', propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 750.35, plot: "1373", status: "Sold", ownerName: "Owner Name 003" },
  { id: "Z8 005", unitNo: "Z8 005", sector: "Wajd", zone: '8', propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 943, plot: "1684.4", status: "Sold", ownerName: "Owner Name 005" },
  { id: "3C", unitNo: "3C", sector: "C Sector", zone: 'MC', propertyType: "Development Land", unitTypeDetail: "Development Land", buaSqm: 5656, plot: "N/A", status: "Sold" },
];

// Component
const ReserveFundDashboard: React.FC = () => {
  // --- State ---
  const [activeView, setActiveView] = useState<'dashboard' | 'calculator' | 'assets'>('dashboard');
  const [dashboardData, setDashboardData] = useState({
    totalUnits: 261,
    totalContribution: 580000,
    totalBUA: 34000,
    sectors: {
      'Zaha': 200000,
      'Nameer': 180000,
      'Wajd': 120000,
      'C Sector': 80000
    },
    types: {
      'Apartment': 250000,
      'Villa': 200000,
      'Commercial': 130000
    }
  });

  // --- Refs for Charts ---
  const sectorChartRef = useRef<HTMLCanvasElement | null>(null);
  const typeChartRef = useRef<HTMLCanvasElement | null>(null);

  // --- Effects ---
  useEffect(() => {
    // Simulate fetching dashboard data
    setTimeout(() => {
      setDashboardData({
        totalUnits: 261,
        totalContribution: 580000,
        totalBUA: 34000,
        sectors: {
          'Zaha': 200000,
          'Nameer': 180000,
          'Wajd': 120000,
          'C Sector': 80000
        },
        types: {
          'Apartment': 250000,
          'Villa': 200000,
          'Commercial': 130000
        }
      });
    }, 500);
  }, []);

  // --- Gradient helper ---
  const createChartGradient = (context: CanvasRenderingContext2D, colors: string[]) => {
    if (!context || !context.canvas) return colors[0];
    
    const chartHeight = context.canvas.height;
    const chartWidth = context.canvas.width;
    
    const gradient = context.createLinearGradient(0, chartHeight, 0, 0);
    gradient.addColorStop(0, colors[1]); // Lighter
    gradient.addColorStop(1, colors[0]); // Darker
    return gradient;
  };

  // --- Utility functions ---
  const formatOMR = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      currency: 'OMR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Enhanced color palette
  const enhancedColors = {
    purple: {
      main: '#8764f8',
      light: '#a78dfb',
      gradient: ['#8764f8', '#a78dfb']
    },
    teal: {
      main: '#16b8a0',
      light: '#47d6c2',
      gradient: ['#16b8a0', '#47d6c2']
    },
    orange: {
      main: '#ff9747',
      light: '#ffb77b',
      gradient: ['#ff9747', '#ffb77b']
    },
    blue: {
      main: '#4886fc',
      light: '#70a1fd',
      gradient: ['#4886fc', '#70a1fd']
    },
    sectors: {
      'Zaha': ['#8764f8', '#a78dfb'],     // Purple
      'Nameer': ['#16b8a0', '#47d6c2'],   // Teal
      'Wajd': ['#ff9747', '#ffb77b'],     // Orange
      'C Sector': ['#4886fc', '#70a1fd']  // Blue
    },
    types: {
      'Apartment': ['#8764f8', '#a78dfb'],      // Purple
      'Villa': ['#16b8a0', '#47d6c2'],          // Teal
      'Commercial': ['#ff9747', '#ffb77b']      // Orange
    }
  };

  // Type-safe chart options
  const pieChartOptions: ChartOptions<'pie'> = {
    responsive: true, 
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom' as const, 
        labels: { 
          padding: 20, 
          usePointStyle: true, 
          font: { 
            family: "'Inter', sans-serif", 
            size: 13 
          } 
        } 
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)', // slate-800
        titleFont: { size: 14, family: "'Inter', sans-serif" }, 
        bodyFont: { size: 13, family: "'Inter', sans-serif" },
        padding: 12, 
        boxPadding: 5,
        callbacks: { 
          label: function(context) {
            return `${context.label || ''}: ${formatOMR(context.parsed as number)}`;
          }
        }
      }
    }
  };

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { 
          display: true,
          color: 'rgba(210, 210, 210, 0.3)'
        }, 
        ticks: { 
          callback: function(value) {
            return formatOMR(value as number);
          }, 
          font: { 
            family: "'Inter', sans-serif", 
            size: 12 
          } 
        } 
      },
      x: { 
        grid: { 
          display: false 
        }, 
        ticks: { 
          font: { 
            family: "'Inter', sans-serif", 
            size: 12 
          } 
        } 
      }
    },
    plugins: {
      legend: { 
        display: false 
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)', // slate-800
        titleFont: { size: 14, family: "'Inter', sans-serif" }, 
        bodyFont: { size: 13, family: "'Inter', sans-serif" },
        padding: 12, 
        boxPadding: 5,
        callbacks: { 
          label: function(context) {
            return `${context.dataset.label || ''}: ${formatOMR(context.parsed.y)}`;
          }
        }
      }
    }
  };

  // --- Render ---
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Dashboard header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Reserve Fund Dashboard</h1>
          <p className="text-gray-500 mt-1">Projections and analytics for 2025</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 bg-white rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50">
            <Play className="h-3.5 w-3.5" />
            <span>2025</span>
          </button>
          <button className="flex items-center gap-1 bg-white rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50">
            <MapPin className="h-3.5 w-3.5" />
            <span>All Zones</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
            activeView === 'dashboard' 
              ? 'text-primary border-b-2 border-primary bg-primary/5' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
          onClick={() => setActiveView('dashboard')}
        >
          <div className="flex items-center gap-1.5">
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
            activeView === 'calculator' 
              ? 'text-primary border-b-2 border-primary bg-primary/5' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
          onClick={() => setActiveView('calculator')}
        >
          <div className="flex items-center gap-1.5">
            <Calculator className="h-4 w-4" />
            <span>Calculator</span>
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
            activeView === 'assets' 
              ? 'text-primary border-b-2 border-primary bg-primary/5' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
          onClick={() => setActiveView('assets')}
        >
          <div className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            <span>Assets</span>
          </div>
        </button>
      </div>

      {/* Dashboard View */}
      <div className={activeView !== 'dashboard' ? 'hidden' : ''}>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Dashboard Overview (2025 Projections)</h2>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {/* Total Properties Card */}
          <div className="bg-gradient-to-br from-[#8764f8] to-[#a78dfb] rounded-lg shadow-md overflow-hidden text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium mb-1">Total Properties</p>
                  <p className="text-3xl font-bold">{dashboardData.totalUnits || 261}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Landmark className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Total Contribution Card */}
          <div className="bg-gradient-to-br from-[#4886fc] to-[#70a1fd] rounded-lg shadow-md overflow-hidden text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium mb-1">Total 2025 Contribution</p>
                  <p className="text-3xl font-bold">OMR {formatOMR(dashboardData.totalContribution)}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Banknote className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Average Contribution Card */}
          <div className="bg-gradient-to-br from-[#16b8a0] to-[#47d6c2] rounded-lg shadow-md overflow-hidden text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium mb-1">Avg. Contribution / Unit</p>
                  <p className="text-3xl font-bold">OMR {dashboardData.totalUnits ? formatOMR(dashboardData.totalContribution / dashboardData.totalUnits) : '0.00'}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Scale className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Total BUA Card */}
          <div className="bg-gradient-to-br from-[#ff9747] to-[#ffb77b] rounded-lg shadow-md overflow-hidden text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium mb-1">Total BUA (sqm)</p>
                  <p className="text-3xl font-bold">{formatNumber(dashboardData.totalBUA)}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Ruler className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Chart 1: Contribution by Sector */}
          <div className="bg-white rounded-lg shadow-md p-5 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Contribution by Sector</h3>
            <div className="h-72">
              <Pie 
                data={{
                  labels: Object.keys(dashboardData.sectors),
                  datasets: [{
                    data: Object.values(dashboardData.sectors),
                    backgroundColor: Object.keys(dashboardData.sectors).map(
                      (sector) => enhancedColors.sectors[sector as keyof typeof enhancedColors.sectors]?.[0] || '#8764f8'
                    ),
                    borderColor: Object.keys(dashboardData.sectors).map(
                      (sector) => enhancedColors.sectors[sector as keyof typeof enhancedColors.sectors]?.[0] || '#8764f8'
                    ),
                    borderWidth: 1,
                    hoverOffset: 10
                  }]
                }}
                options={pieChartOptions}
              />
            </div>
          </div>
          
          {/* Chart 2: Contribution by Property Type */}
          <div className="bg-white rounded-lg shadow-md p-5 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Contribution by Property Type</h3>
            <div className="h-72">
              <Bar 
                data={{
                  labels: Object.keys(dashboardData.types),
                  datasets: [{
                    label: 'Contribution (OMR)',
                    data: Object.values(dashboardData.types),
                    backgroundColor: Object.keys(dashboardData.types).map(
                      (type) => enhancedColors.types[type as keyof typeof enhancedColors.types]?.[0] || '#8764f8'
                    ),
                    borderRadius: 6,
                    maxBarThickness: 70
                  }]
                }}
                options={barChartOptions}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Calculator View */}
      <div className={activeView !== 'calculator' ? 'hidden' : ''}>
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Calculator View</h2>
          <p className="text-gray-500">This section is under development.</p>
        </div>
      </div>
      
      {/* Assets View */}
      <div className={activeView !== 'assets' ? 'hidden' : ''}>
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Assets View</h2>
          <p className="text-gray-500">This section is under development.</p>
        </div>
      </div>
    </div>
  );
};

export default ReserveFundDashboard;
