
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, FileSpreadsheet, Calendar, Download, LineChart, PieChart, BarChart, Activity, Clock, Package, Building, Landmark, Wrench, AlertTriangle, Zap, Droplets, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAssets } from '@/hooks/useAssets';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ALMDashboard from '@/components/alm/ALMDashboard';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { AssetLifecycleIcon } from '@/components/layout/sidebar/CustomIcons';

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
    <StandardPageLayout
      title="Asset Lifecycle Management"
      description="Track and manage all assets across Muscat Bay"
      icon={<AssetLifecycleIcon className="h-6 w-6" />}
      headerColor="bg-gradient-to-r from-purple-50/40 to-purple-100/20 dark:from-purple-900/20 dark:to-purple-800/10"
    >
      <div className="container mx-auto">
        <ALMDashboard
          summaryStats={summaryStats}
          year={year}
          zone={zone}
          category={category}
          activeTab={activeTab}
          darkMode={darkMode}
          filteredReplacements={filteredReplacements}
          assetCategoryData={assetCategoryData}
          zoneBalancesData={zoneBalancesData}
          reserveFundData={reserveFundData}
          handleYearChange={handleYearChange}
          handleZoneChange={handleZoneChange}
          handleCategoryChange={handleCategoryChange}
          handleExport={handleExport}
          setActiveTab={setActiveTab}
          yearOptions={yearOptions}
          zoneOptions={zoneOptions}
          categoryOptions={categoryOptions}
        />
      </div>
    </StandardPageLayout>
  );
};

export default ALM;
