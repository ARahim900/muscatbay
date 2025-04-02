import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, FileSpreadsheet, Calendar, Download, LineChart, PieChart, BarChart, Activity, Clock, Package, Building, Landmark, Wrench, AlertTriangle, Zap, Droplets, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useAssets } from '@/hooks/useAssets';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const mockYearlyData = [
  { year: '2021', balance: 52636, contribution: 52636, expenditure: 0 }, 
  { year: '2022', balance: 106324, contribution: 52899, expenditure: 0 }, 
  { year: '2023', balance: 161082, contribution: 53163, expenditure: 0 }, 
  { year: '2024', balance: 216927, contribution: 53429, expenditure: 0 }, 
  { year: '2025', balance: 273878, contribution: 53696, expenditure: 0 }, 
  { year: '2026', balance: 331951, contribution: 53965, expenditure: 0 }, 
  { year: '2027', balance: 391164, contribution: 54235, expenditure: 0 }, 
  { year: '2028', balance: 451538, contribution: 54506, expenditure: 0 }, 
  { year: '2029', balance: 513089, contribution: 54778, expenditure: 0 }, 
  { year: '2030', balance: 559944, contribution: 55052, expenditure: 15893 }, 
  { year: '2031', balance: 619783, contribution: 55327, expenditure: 3888 }, 
  { year: '2032', balance: 541103, contribution: 55604, expenditure: 143581 }, 
  { year: '2033', balance: 452039, contribution: 55882, expenditure: 153062 }, 
  { year: '2034', balance: 509909, contribution: 56161, expenditure: 5072 }, 
  { year: '2035', balance: 305725, contribution: 56442, expenditure: 268275 }, 
  { year: '2036', balance: 254388, contribution: 56725, expenditure: 112647 }, 
  { year: '2037', balance: 285738, contribution: 57008, expenditure: 29474 }, 
  { year: '2038', balance: 125242, contribution: 57293, expenditure: 222075 }, 
  { year: '2039', balance: 184700, contribution: 57580, expenditure: 0 }, 
  { year: '2040', balance: 34961, contribution: 57868, expenditure: 210377 }
];

const mockZoneBalances = [
  { name: 'Master Community', value: 798352, color: '#4E4456' }, 
  { name: 'Typical Buildings', value: 227018, color: '#6D5D7B' }, 
  { name: 'Zone 3 (Al Zaha)', value: 63604, color: '#8F7C9B' }, 
  { name: 'Zone 5 (Al Nameer)', value: 63581, color: '#AD9BBD' }, 
  { name: 'Zone 8 (Al Wajd)', value: 37884, color: '#CBB9DB' }, 
  { name: 'Staff Accommodation', value: 273878, color: '#E9D7F5' }
];

const mockAssetCategories = [
  { name: 'Infrastructure', value: 2000000, color: '#4E4456' }, 
  { name: 'MEP Systems', value: 1500000, color: '#6D5D7B' }, 
  { name: 'Finishes/Structure', value: 500000, color: '#8F7C9B' }, 
  { name: 'Landscaping', value: 500000, color: '#CBB9DB' }
];

const mockUpcomingReplacements = [
  { component: 'Helipad Electrical Works', location: 'Master Community', year: 2025, cost: 10920 }, 
  { component: 'Fire Extinguishers', location: 'Typical Buildings', year: 2026, cost: 129 }, 
  { component: 'Lagoon Infrastructure', location: 'Master Community', year: 2027, cost: 42000 }, 
  { component: 'Elevator Wire Ropes', location: 'Typical Buildings', year: 2027, cost: 2450 }, 
  { component: 'External Wall Paint', location: 'Typical Buildings', year: 2028, cost: 1465 }, 
  { component: 'Tree Uplighters', location: 'Zone 3', year: 2031, cost: 1120 }
];

const mockZones = [
  { id: '3', name: 'Zone 3 (Al Zaha)', propertyTypes: ['Apartment', 'Villa'] }, 
  { id: '5', name: 'Zone 5 (Al Nameer)', propertyTypes: ['Villa'] }, 
  { id: '8', name: 'Zone 8 (Al Wajd)', propertyTypes: ['Villa'] }, 
  { id: 'staff', name: 'Staff Accommodation', propertyTypes: ['Staff Accommodation'] }
];

const mockBuildings = {
  '3': {
    'Apartment': [
      'D44', 'D45', 'D46', 'D47', 'D48', 'D49', 'D50', 'D51', 'D52', 'D53',
      'D54', 'D55', 'D56', 'D57', 'D58', 'D59', 'D60', 'D61', 'D62', 'D74', 'D75'
    ]
  },
  'staff': {
    'Staff Accommodation': ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'CIF']
  }
};

const mockUnits = {
  '3': {
    'Villa': [
      { id: 'Z3-001', unitNo: 'Z3 001', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-002', unitNo: 'Z3 002', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-003', unitNo: 'Z3 003', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-004', unitNo: 'Z3 004', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-005', unitNo: 'Z3 005', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-006', unitNo: 'Z3 006', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-007', unitNo: 'Z3 007', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-008', unitNo: 'Z3 008', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-009', unitNo: 'Z3 009', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-010', unitNo: 'Z3 010', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-011', unitNo: 'Z3 011', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-012', unitNo: 'Z3 012', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-013', unitNo: 'Z3 013', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-014', unitNo: 'Z3 014', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-015', unitNo: 'Z3 015', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-016', unitNo: 'Z3 016', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-017', unitNo: 'Z3 017', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-018', unitNo: 'Z3 018', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-019', unitNo: 'Z3 019', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-020', unitNo: 'Z3 020', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-021', unitNo: 'Z3 021', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-022', unitNo: 'Z3 022', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-023', unitNo: 'Z3 023', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-024', unitNo: 'Z3 024', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-025', unitNo: 'Z3 025', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-026', unitNo: 'Z3 026', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-027', unitNo: 'Z3 027', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-028', unitNo: 'Z3 028', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-029', unitNo: 'Z3 029', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-030', unitNo: 'Z3 030', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-031', unitNo: 'Z3 031', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-032', unitNo: 'Z3 032', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-033', unitNo: 'Z3 033', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-034', unitNo: 'Z3 034', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-035', unitNo: 'Z3 035', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-036', unitNo: 'Z3 036', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-037', unitNo: 'Z3 037', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-038', unitNo: 'Z3 038', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-039', unitNo: 'Z3 039', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-040', unitNo: 'Z3 040', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-041', unitNo: 'Z3 041', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-042', unitNo: 'Z3 042', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-043', unitNo: 'Z3 043', type: '4 Bedroom Zaha Villa', bua: 422 },
    ],
    'Apartment': {
      'D44': [
        { id: 'Z3-044-1', unitNo: 'Z3 044(1)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-044-2', unitNo: 'Z3 044(2)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-044-3', unitNo: 'Z3 044(3)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-044-4', unitNo: 'Z3 044(4)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-044-5', unitNo: 'Z3 044(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-044-6', unitNo: 'Z3 044(6)', type: '3 Bedroom Zaha Apartment', bua: 361 },
      ],
      'D45': [
        { id: 'Z3-045-1', unitNo: 'Z3 045(1)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-045-2', unitNo: 'Z3 045(2)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-045-3', unitNo: 'Z3 045(3)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-045-4', unitNo: 'Z3 045(4)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-045-5', unitNo: 'Z3 045(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-045-6', unitNo: 'Z3 045(6)', type: '3 Bedroom Zaha Apartment', bua: 361 },
      ],
      'D46': [],
      'D47': [],
      'D48': [],
      'D49': [],
      'D50': [],
      'D51': [],
      'D52': [],
      'D53': [],
      'D54': [],
      'D55': [],
      'D56': [],
      'D57': [],
      'D58': [],
      'D59': [],
      'D60': [],
      'D61': [],
      'D62': [],
      'D74': [],
      'D75': []
    }
  },
  '5': {
    'Villa': [
      { id: 'Z5-001', unitNo: 'Z5 001', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-002', unitNo: 'Z5 002', type: '3 Bedroom Nameer Villa', bua: 427 },
      { id: 'Z5-003', unitNo: 'Z5 003', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-004', unitNo: 'Z5 004', type: '3 Bedroom Nameer Villa', bua: 427 },
      { id: 'Z5-005', unitNo: 'Z5 005', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-006', unitNo: 'Z5 006', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-007', unitNo: 'Z5 007', type: '3 Bedroom Nameer Villa', bua: 427 },
      { id: 'Z5-008', unitNo: 'Z5 008', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-009', unitNo: 'Z5 009', type: '3 Bedroom Nameer Villa', bua: 427 },
      { id: 'Z5-010', unitNo: 'Z5 010', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-011', unitNo: 'Z5 011', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-012', unitNo: 'Z5 012', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-013', unitNo: 'Z5 013', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-014', unitNo: 'Z5 014', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-015', unitNo: 'Z5 015', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-016', unitNo: 'Z5 016', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-017', unitNo: 'Z5 017', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-018', unitNo: 'Z5 018', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-019', unitNo: 'Z5 019', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-020', unitNo: 'Z5 020', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-021', unitNo: 'Z5 021', type: '3 Bedroom Nameer Villa', bua: 427 },
      { id: 'Z5-022', unitNo: 'Z5 022', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-023', unitNo: 'Z5 023', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-024', unitNo: 'Z5 024', type: '3 Bedroom Nameer Villa', bua: 427 },
      { id: 'Z5-025', unitNo: 'Z5 025', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-026', unitNo: 'Z5 026', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-027', unitNo: 'Z5 027', type: '3 Bedroom Nameer Villa', bua: 427 },
      { id: 'Z5-028', unitNo: 'Z5 028', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-029', unitNo: 'Z5 029', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-030', unitNo: 'Z5 030', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-031', unitNo: 'Z5 031', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-032', unitNo: 'Z5 032', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-033', unitNo: 'Z5 033', type: '4 Bedroom Nameer Villa', bua: 498 },
    ]
  },
  '8': {
    'Villa': [
      { id: 'Z8-001', unitNo: 'Z8 001', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-002', unitNo: 'Z8 002', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-003', unitNo: 'Z8 003', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-004', unitNo: 'Z8 004', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-005', unitNo: 'Z8 005', type: '5 Bedroom Wajd Villa', bua: 943 },
      { id: 'Z8-006', unitNo: 'Z8 006', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-007', unitNo: 'Z8 007', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-008', unitNo: 'Z8 008', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-009', unitNo: 'Z8 009', type: '5 Bedroom Wajd Villa', bua: 1187 },
      { id: 'Z8-010', unitNo: 'Z8 010', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-011', unitNo: 'Z8 011', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-012', unitNo: 'Z8 012', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-013', unitNo: 'Z8 013', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-014', unitNo: 'Z8 014', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-015', unitNo: 'Z8 015', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-016', unitNo: 'Z8 016', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-017', unitNo: 'Z8 017', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-018', unitNo: 'Z8 018', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-019', unitNo: 'Z8 019', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-020', unitNo: 'Z8 020', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-021', unitNo: 'Z8 021', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-022', unitNo: 'Z8 022', type: 'King Villa', bua: 1845 },
    ]
  },
  'staff': {
    'Staff Accommodation': {
      'B1': [],
      'B2': [],
      'B3': [],
      'B4': [],
      'B5': [],
      'B6': [],
      'B7': [],
      'B8': [],
      'CIF': []
    }
  }
};

const rates2025 = {
  masterCommunity: 1.75,
  typicalBuilding: 1.65,
  zone3: 0.44,
  zone5: 1.10,
  zone8: 0.33,
  staffAccommodation: 3.95
};

const Transition = ({ show, enter, enterFrom, enterTo, leave, leaveFrom, leaveTo, children, className, unmount = true }) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [transitionState, setTransitionState] = useState(show ? 'enterTo' : 'leaveTo');

  useEffect(() => {
    let timeoutId;
    if (show) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setTransitionState('enterFrom');
        requestAnimationFrame(() => {
           setTransitionState('enterTo');
        });
      });
    } else {
      setTransitionState('leaveFrom');
      timeoutId = setTimeout(() => {
        setTransitionState('leaveTo');
        if (unmount) {
             setShouldRender(false);
        }
      }, 300); // Match transition duration
    }
    return () => clearTimeout(timeoutId);
  }, [show, unmount]);

  if (!shouldRender) {
    return null;
  }

  let currentTransitionClasses = '';
  switch (transitionState) {
    case 'enterFrom': currentTransitionClasses = `${enter} ${enterFrom}`; break;
    case 'enterTo': currentTransitionClasses = `${enter} ${enterTo}`; break;
    case 'leaveFrom': currentTransitionClasses = `${leave} ${leaveFrom}`; break;
    case 'leaveTo': currentTransitionClasses = `${leave} ${leaveTo}`; break;
    default: break;
  }

  return (
    <div className={`${className || ''} ${currentTransitionClasses}`}>
      {children}
    </div>
  );
};

const KpiCard = ({ title, value, description, trend, icon, compactView = false, darkMode }) => {
  return (
    <div className={`overflow-hidden shadow-md rounded-lg transform transition-transform hover:scale-[1.02] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`p-5 ${compactView ? 'p-4' : 'p-5'}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{title}</h3>
            <div className="mt-1 flex items-baseline">
              <p className={`${compactView ? 'text-xl' : 'text-2xl'} font-semibold ${darkMode ? 'text-white' : 'text-[#4E4456]'}`}>{value}</p>
              {trend && (
                <span className={`ml-2 flex items-center text-xs font-medium ${trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {trend === 'up' ? (
                    <svg className="self-center flex-shrink-0 h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  ) : (
                    <svg className="self-center flex-shrink-0 h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                </span>
              )}
            </div>
            <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
          </div>
          <div className={`rounded-md p-3 ${darkMode ? 'bg-[#4E4456]/30 text-[#AD9BBD]' : 'bg-[#4E4456]/10 text-[#4E4456]'}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, children, darkMode }) => {
  return (
    <div className={`overflow-hidden shadow-md rounded-lg transform transition-all hover:shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h3 className={`text-lg font-medium ${darkMode ? 'text-[#AD9BBD]' : 'text-[#4E4456]'}`}>{title}</h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

const GlobalStyles = () => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  const trackColor = isDarkMode ? '#1f2937' : '#f1f1f1';
  const thumbColor = isDarkMode ? '#4b5563' : '#888';
  const thumbHoverColor = isDarkMode ? '#6b7280' : '#555';
  
  return (
    <style>{`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .animate-fadeIn {
        animation: fadeIn 0.5s ease-out forwards;
      }
      
      .dark {
        color-scheme: dark;
      }
      
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: ${trackColor};
        border-radius: 10px;
      }
      
      ::-webkit-scrollbar-thumb {
        background: ${thumbColor};
        border-radius: 10px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: ${thumbHoverColor};
      }
    `}</style>
  );
};

const ALM = () => {
  const [show, setShow] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [year, setYear] = useState("2025");
  const [zone, setZone] = useState("all");
  const [category, setCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  const { 
    assets, 
    categorySummary, 
    locationSummary, 
    criticalAssets, 
    assetConditions,
    maintenanceSchedule,
    lifecycleForecast,
    loading, 
    error 
  } = useAssets();

  const yearOptions = [
    { value: "2024", label: "2024" },
    { value: "2025", label: "2025" },
    { value: "2026", label: "2026" },
    { value: "2027", label: "2027" },
    { value: "2028", label: "2028" },
  ];

  const zoneOptions = [
    { value: "all", label: "All Zones" },
    { value: "master", label: "Master Community" },
    { value: "typical", label: "Typical Buildings" },
    { value: "zone3", label: "Zone 3 (Al Zaha)" },
    { value: "zone5", label: "Zone 5 (Al Nameer)" },
    { value: "zone8", label: "Zone 8 (Al Wajd)" },
    { value: "staff", label: "Staff Accommodation" },
  ];

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "infrastructure", label: "Infrastructure" },
    { value: "mep", label: "MEP Systems" },
    { value: "finishes", label: "Finishes/Structure" },
    { value: "landscaping", label: "Landscaping" },
  ];

  const summaryStats = useMemo(() => {
    if (loading) return {
      totalAssets: 0,
      criticalCount: 0,
      upcomingMaintenance: 0,
      totalReplacementCost: 0
    };

    return {
      totalAssets: assets?.length || 0,
      criticalCount: criticalAssets?.length || 0,
      upcomingMaintenance: maintenanceSchedule?.filter(m => 
        m.status === 'Scheduled' || m.status === 'Overdue'
      ).length || 0,
      totalReplacementCost: lifecycleForecast?.reduce((sum, item) => 
        sum + (item.replacementCost || 0), 0) || 0
    };
  }, [assets, criticalAssets, maintenanceSchedule, lifecycleForecast, loading]);

  const filteredReplacements = useMemo(() => {
    return mockUpcomingReplacements.filter(item => 
      (year === "all" || parseInt(year) === item.year) &&
      (zone === "all" || 
        (zone === "master" && item.location === "Master Community") ||
        (zone === "typical" && item.location === "Typical Buildings") ||
        (zone === "zone3" && item.location === "Zone 3") ||
        (zone === "zone5" && item.location === "Zone 5") ||
        (zone === "zone8" && item.location === "Zone 8") ||
        (zone === "staff" && item.location === "Staff Accommodation"))
    );
  }, [year, zone]);

  const assetCategoryData = useMemo(() => {
    return mockAssetCategories.filter(item => 
      category === "all" || 
      (category === "infrastructure" && item.name === "Infrastructure") ||
      (category === "mep" && item.name === "MEP Systems") ||
      (category === "finishes" && item.name === "Finishes/Structure") ||
      (category === "landscaping" && item.name === "Landscaping")
    );
  }, [category]);

  const zoneBalancesData = useMemo(() => {
    return mockZoneBalances.filter(item => 
      zone === "all" || 
      (zone === "master" && item.name === "Master Community") ||
      (zone === "typical" && item.name === "Typical Buildings") ||
      (zone === "zone3" && item.name === "Zone 3 (Al Zaha)") ||
      (zone === "zone5" && item.name === "Zone 5 (Al Nameer)") ||
      (zone === "zone8" && item.name === "Zone 8 (Al Wajd)") ||
      (zone === "staff" && item.name === "Staff Accommodation")
    );
  }, [zone]);

  const reserveFundData = useMemo(() => {
    return mockYearlyData.filter(item => parseInt(item.year) <= parseInt(year) + 5);
  }, [year]);

  const handleYearChange = (newYear) => {
    setYear(newYear);
  };

  const handleZoneChange = (newZone) => {
    setZone(newZone);
  };

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
  };

  const handleExport = () => {
    toast.success("Exporting data to Excel...");
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <GlobalStyles />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div className="flex items-center">
          <div className="bg-primary/10 p-2 rounded-lg mr-3">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Asset Lifecycle Management</h1>
            <p className="text-sm text-muted-foreground">Manage and monitor all assets across Muscat Bay</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="flex space-x-3">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Year</label>
              <Select value={year} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Zone</label>
              <Select value={zone} onValueChange={handleZoneChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Zone" />
                </SelectTrigger>
                <SelectContent>
                  {zoneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="whitespace-nowrap" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export Data
          </Button>
        </div>
      </div>
      
      <Tabs 
        defaultValue="overview" 
        className="w-full mb-6"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid grid-cols-3 md:grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>
        
        <div className="mt-2 text-sm text-muted-foreground">
          Showing: {activeTab === "overview" ? "Overview dashboard" : 
                    activeTab === "analysis" ? "Asset performance analysis" :
                    activeTab === "categories" ? "Asset categories breakdown" :
                    activeTab === "zones" ? "Zones breakdown" : "Maintenance schedule"}
        </div>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard 
              title="Total Assets" 
              value={summaryStats.totalAssets.toLocaleString()} 
              description="Total assets under management" 
              icon={<Package className="h-5 w-5" />}
              darkMode={darkMode}
              trend="neutral"
              compactView={false}
            />
            <KpiCard 
              title="Critical Assets" 
              value={summaryStats.criticalCount.toLocaleString()} 
              description="Assets requiring immediate attention" 
              trend="up" 
              icon={<AlertTriangle className="h-5 w-5" />}
              darkMode={darkMode}
              compactView={false}
            />
            <KpiCard 
              title="Upcoming Maintenance" 
              value={summaryStats.upcomingMaintenance.toLocaleString()} 
              description={`Scheduled in ${year}`} 
              icon={<Wrench className="h-5 w-5" />}
              darkMode={darkMode}
              trend="neutral"
              compactView={false}
            />
            <KpiCard 
              title="Total Replacement Value" 
              value={`${Math.round(summaryStats.totalReplacementCost/1000).toLocaleString()} K`} 
              description="Estimated asset replacement cost" 
              icon={<Landmark className="h-5 w-5" />}
              darkMode={darkMode}
              trend="neutral"
              compactView={false}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartCard title="Reserve Fund Projection" darkMode={darkMode}>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={reserveFundData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}K`} />
                  <Tooltip formatter={(value) => [`${value.toLocaleString()} OMR`, ""]} />
                  <Legend />
                  <Line type="monotone" dataKey="balance" name="Balance" stroke="#4E4456" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="contribution" name="Contribution" stroke="#9F7AEA" />
                  <Line type="monotone" dataKey="expenditure" name="Expenditure" stroke="#F56565" />
                </RechartsLineChart>
              </ResponsiveContainer>
            </ChartCard>
          
            <ChartCard title="Asset Allocation by Category" darkMode={darkMode}>
              <div className="flex items-center justify-center h-[300px]">
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsPieChart>
                    <Pie
                      data={assetCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {assetCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString()} OMR`} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Upcoming Asset Replacements" darkMode={darkMode}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Component</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Year</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cost (OMR)</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredReplacements.length > 0 ? (
                    filteredReplacements.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.component}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.year}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.cost.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No replacements scheduled for the selected filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </TabsContent>
        
        <TabsContent value="analysis" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            <ChartCard title="Asset Performance Analysis" darkMode={darkMode}>
              <div className="p-4 text-muted-foreground text-center">
                Detailed asset performance analysis by category and condition
              </div>
            </ChartCard>
          </div>
        </TabsContent>
        
        <TabsContent value="categories" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            <ChartCard title="Asset Categories" darkMode={darkMode}>
              <div className="flex items-center justify-center h-[300px]">
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsPieChart>
                    <Pie
                      data={assetCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {assetCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString()} OMR`} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </TabsContent>
        
        <TabsContent value="zones" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            <ChartCard title="Zone Allocation" darkMode={darkMode}>
              <div className="flex items-center justify-center h-[300px]">
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsPieChart>
                    <Pie
                      data={zoneBalancesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {zoneBalancesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString()} OMR`} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </TabsContent>
        
        <TabsContent value="maintenance" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            <ChartCard title="Maintenance Schedule" darkMode={darkMode}>
              <div className="p-4 text-muted-foreground text-center">
                Scheduled maintenance activities and asset replacement plans
              </div>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 my-6">
        <Link to="/water-system" className="group">
          <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="rounded-full bg-blue-50 p-3">
                <Droplets className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium group-hover:text-blue-600 transition-colors">Water System</h3>
                <p className="text-xs text-muted-foreground">Manage water distribution assets</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/electricity-system" className="group">
          <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="rounded-full bg-amber-50 p-3">
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-medium group-hover:text-amber-600 transition-colors">Electricity System</h3>
                <p className="text-xs text-muted-foreground">Manage electrical distribution assets</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/reserve-fund-calculator" className="group">
          <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="rounded-full bg-purple-50 p-3">
                <Calculator className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-medium group-hover:text-purple-600 transition-colors">Reserve Fund Calculator</h3>
                <p className="text-xs text-muted-foreground">Calculate required reserve fund contributions</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default ALM;
