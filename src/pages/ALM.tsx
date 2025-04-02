import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, FileSpreadsheet, Calendar, Download, LineChart, PieChart, BarChart, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';

// --- Mock Data ---
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

const KpiCard = ({ title, value, description, trend, icon, compactView, darkMode }) => {
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

  return (
    <div>
      <GlobalStyles />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ALM Dashboard</h1>
        <button onClick={() => setShow(!show)} className="p-2 rounded-md bg-gray-200 hover:bg-gray-300">
          {show ? <Calendar /> : <Calendar />}
        </button>
      </div>
      <div className="mt-4">
        {show && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Add your KPI cards and charts here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default ALM;
