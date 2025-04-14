
import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import {
  Clock, ArrowDownRight, Filter, Download, RefreshCw, Droplet, Check, Activity, Layers, Percent, MapPin, Type, Settings as SettingsIcon
} from 'lucide-react';

interface ProcessedDataRow {
  meterLabel: string;
  acctNum: string;
  zone: string;
  type: string;
  parentMeterLabel: string | null;
  label: string;
  [key: string]: string | number | null;
}

interface ChartDataItem {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface ZoneMetric {
  l2Bulk: number;
  l3Sum: number;
  loss: number;
  lossPercentage: number;
}

interface TopLosingZone {
  name: string;
  lossPercentage: number;
}

interface CalculatedMetrics {
  totalL1Supply: number;
  totalL2Volume: number;
  totalL3Volume: number;
  stage1Loss: number;
  stage1LossPercentage: number;
  stage2Loss: number;
  stage2LossPercentage: number;
  totalLoss: number;
  totalLossPercentage: number;
  consumptionByType: Record<string, number>;
  zoneMetrics: Record<string, ZoneMetric>;
  topLosingZones: TopLosingZone[];
  debugInfo: {
    l1Count: number;
    l2Count: number;
    dcFromL1Count: number;
    l3ForTotalCount: number;
    dcForTotalCount: number;
    excludedL3Value: number;
  };
}

interface KPICardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  theme: Record<string, string>;
  bgColor: string;
  trend?: number | null;
  trendText?: string | null;
  statusText?: string;
}

const MuscatBayWaterSystem = () => {
  const THEME = {
    primary: '#4E4456',
    secondary: '#A5A0AB',
    accent: '#9AD0D2',
    light: '#E4E2E7',
    white: '#FFFFFF',
    darkText: '#383339',
    lightText: '#7A737F',
    success: '#7CBBA7',
    warning: '#D8BC74',
    error: '#C48B9F',
    chartColors: ['#9AD0D2', '#A5A0AB', '#C48B9F', '#D8BC74', '#7CBBA7', '#B8A9C6']
  };

  const [rawData, setRawData] = useState<any[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedDataRow[]>([]);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState('Mar');
  const [selectedPeriod, setSelectedPeriod] = useState('Mar-25');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedZone, setSelectedZone] = useState('Zone_05');
  const [selectedType, setSelectedType] = useState('All Types');
  const [isLoading, setIsLoading] = useState(true);
  const [isScriptLoading, setIsScriptLoading] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const scriptId = 'papaparse-cdn-script';
    if (document.getElementById(scriptId) || (window as any).Papa) {
        setIsScriptLoading(false);
        return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js';
    script.async = true;
    script.onload = () => {
      console.log("PapaParse loaded from CDN.");
      setIsScriptLoading(false);
    };
    script.onerror = () => {
      console.error("Failed to load PapaParse script from CDN.");
      setIsScriptLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
      }
    };
  }, []);

  useEffect(() => {
    setSelectedPeriod(`${selectedMonth}-${selectedYear.substring(2)}`);
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (isScriptLoading) {
        return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const fileName = selectedYear === '2025'
            ? '2025 Water Consumptions-Master View Water 2025 13.csv'
            : '2024 Water Consumptions-Master View Water 2024 11.csv';

        let fileContent = '';
        try {
             const response = await fetch(fileName);
             if (!response.ok) {
                 throw new Error(`HTTP error! status: ${response.status} for ${fileName}`);
             }
             fileContent = await response.text();
             console.log(`Successfully fetched ${fileName}`);
         } catch (fetchError) {
             console.error(`Error fetching file ${fileName}:`, fetchError);
             console.warn("Using mock CSV data as fallback.");
             fileContent = generateMockCsvContent(selectedYear);
         }

        if (!(window as any).Papa) {
            console.error("PapaParse is not loaded yet!");
            setIsLoading(false);
            return;
        }

        const parsedData = (window as any).Papa.parse(fileContent, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim()
        });

        if (parsedData.errors && parsedData.errors.length > 0) {
            console.error("CSV Parsing Errors:", parsedData.errors);
        }

        setRawData(parsedData.data || []);
        const dataForProcessing = parsedData.data || [];
        const processed = processRawData(dataForProcessing, selectedYear);
        setProcessedData(processed);

        const zones = [...new Set(processed.filter(m => m.zone && m.zone !== 'Unknown').map(m => m.zone))];
        if (zones.length > 0 && !zones.includes(selectedZone)) {
            setSelectedZone(zones[0]);
        } else if (zones.length === 0) {
            setSelectedZone('');
        }

      } catch (error) {
        console.error("Error loading or processing data:", error);
        setRawData([]);
        setProcessedData([]);
      } finally {
          setIsLoading(false);
      }
    };

    loadData();
  }, [selectedYear, isScriptLoading, selectedZone]);

  const generateMockCsvContent = (year: string): string => {
      const headers = "Meter Label,Acct #,Level ,Zone,Type,Parent Meter,Jan-YY,Feb-YY,Mar-YY,Apr-YY,May-YY,Jun-YY";
      const yearSuffix = year.substring(2);
      let csvString = headers.replace(/YY/g, yearSuffix) + "\n";

      const mockData: Record<string, Array<Record<string, any>>> = {
        '2025': [
            { meterLabel: 'Main Bulk (NAMA)', acctNum: 'C43659', label: 'L1', zone: 'Main Bulk', type: 'Main BULK', parentMeterLabel: 'NAMA', 'Jan-25': 32580, 'Feb-25': 44043, 'Mar-25': 34915 },
            { meterLabel: 'ZONE 3A (Bulk Zone 3A)', acctNum: '4300343', label: 'L2', zone: 'Zone_03_(A)', type: 'Zone Bulk', parentMeterLabel: 'Main Bulk (NAMA)', 'Jan-25': 4235, 'Feb-25': 4273, 'Mar-25': 3591 },
            { meterLabel: 'ZONE 5 (Bulk Zone 5)', acctNum: '4300345', label: 'L2', zone: 'Zone_05', type: 'Zone Bulk', parentMeterLabel: 'Main Bulk (NAMA)', 'Jan-25': 4267, 'Feb-25': 4231, 'Mar-25': 3862 },
            { meterLabel: 'Hotel Main Building', acctNum: '4300334', label: 'DC', zone: 'Direct Connection ', type: 'Retail', parentMeterLabel: 'Main Bulk (NAMA)', 'Jan-25': 18048, 'Feb-25': 19482, 'Mar-25': 22151 },
            { meterLabel: 'Z3-42 (Villa)', acctNum: '4300002', label: 'L3', zone: 'Zone_03_(A)', type: 'Residential (Villa)', parentMeterLabel: 'ZONE 3A (BULK ZONE 3A)', 'Jan-25': 32, 'Feb-25': 46, 'Mar-25': 19 },
            { meterLabel: 'Z5-17', acctNum: '4300001', label: 'L3', zone: 'Zone_05', type: 'Residential (Villa)', parentMeterLabel: 'ZONE 5 (Bulk Zone 5)', 'Jan-25': 112, 'Feb-25': 80, 'Mar-25': 81 },
            { meterLabel: 'Z3-74(3) (Building)', acctNum: '4300322', label: 'L3', zone: 'Zone_03_(A)', type: 'Residential (Apart)', parentMeterLabel: 'ZONE 3A (BULK ZONE 3A)', 'Jan-25': null, 'Feb-25': null, 'Mar-25': 19 },
        ],
        '2024': [
             { meterLabel: 'Main Bulk (NAMA)', acctNum: 'C43659', label: 'L1', zone: 'Main Bulk', type: 'Main BULK', parentMeterLabel: 'NAMA', 'Jan-24': 32803, 'Feb-24': 27996, 'Mar-24': 23860, 'Apr-24': 31869, 'May-24': 30737, 'Jun-24': 41953 },
             { meterLabel: 'ZONE 3A (Bulk Zone 3A)', acctNum: '4300343', label: 'L2', zone: 'Zone_03_(A)', type: 'Zone Bulk', parentMeterLabel: 'Main Bulk (NAMA)', 'Jan-24': 1234, 'Feb-24': 1099, 'Mar-24': 1297, 'Apr-24': 1892, 'May-24': 2254, 'Jun-24': 2227 },
             { meterLabel: 'ZONE 5 (Bulk Zone 5)', acctNum: '4300345', label: 'L2', zone: 'Zone_05', type: 'Zone Bulk', parentMeterLabel: 'Main Bulk (NAMA)', 'Jan-24': 4286, 'Feb-24': 3897, 'Mar-24': 4127, 'Apr-24': 4911, 'May-24': 2639, 'Jun-24': 4992 },
             { meterLabel: 'Hotel Main Building', acctNum: '4300334', label: 'DC', zone: 'Direct Connection ', type: 'Retail', parentMeterLabel: 'Main Bulk (NAMA)', 'Jan-24': 14012, 'Feb-24': 12880, 'Mar-24': 11222, 'Apr-24': 13217, 'May-24': 13980, 'Jun-24': 15385 },
             { meterLabel: 'Z3-42 (Villa)', acctNum: '4300002', label: 'L3', zone: 'Zone_03_(A)', type: 'Residential (Villa)', parentMeterLabel: 'ZONE 3A (BULK ZONE 3A)', 'Jan-24': 61, 'Feb-24': 33, 'Mar-24': 36, 'Apr-24': 47, 'May-24': 39, 'Jun-24': 42 },
             { meterLabel: 'Z5-17', acctNum: '4300001', label: 'L3', zone: 'Zone_05', type: 'Residential (Villa)', parentMeterLabel: 'ZONE 5 (Bulk Zone 5)', 'Jan-24': 99, 'Feb-24': 51, 'Mar-24': 53, 'Apr-24': 62, 'May-24': 135, 'Jun-24': 140 },
        ]
      };

      const data = mockData[year] || [];
      data.forEach(row => {
          const monthKeys = Object.keys(row).filter(k => k.includes(`-${yearSuffix}`));
          const values = [
              row.meterLabel, row.acctNum, row.label, row.zone || '', row.type, row.parentMeterLabel || ''
          ];
          monthKeys.forEach(key => values.push(row[key] || 0));

          const safeValues = values.map(v => (v === undefined || v === null) ? '' : `"${String(v).replace(/"/g, '""')}"`);
          csvString += safeValues.join(',') + "\n";
      });
      return csvString;
  };

  const processRawData = (rawDataArray: any[], year: string): ProcessedDataRow[] => {
       const requiredHeaders = ['Meter Label', 'Acct #', 'Zone', 'Type', 'Parent Meter', 'Label', 'Level '];
       const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
       const yearSuffix = year.substring(2);

       return rawDataArray.map(row => {
           if (!row) return {} as ProcessedDataRow;
           
           const processedRow: ProcessedDataRow = {
             meterLabel: '',
             acctNum: '',
             zone: '',
             type: '',
             parentMeterLabel: null,
             label: '',
           };

           processedRow.meterLabel = String(row['Meter Label'] || row.meterLabel || 'Unknown').trim();
           processedRow.acctNum = String(row['Acct #'] || row.acctNum || 'Unknown').trim();
           processedRow.zone = String(row.Zone || 'Unknown').trim();
           processedRow.type = String(row.Type || 'Unknown').trim();
           processedRow.parentMeterLabel = String(row['Parent Meter'] || row.parentMeterLabel || '').trim() || null;

           let labelValue = row.Label || row['Level '] || 'Unknown';
           processedRow.label = String(labelValue).trim();

           if (processedRow.zone === 'Direct Connection') processedRow.zone = 'Direct Connection ';
           if (processedRow.zone === 'Zone_03_(A)') processedRow.zone = 'Zone_03_(A)';
           if (processedRow.zone === 'Zone_03_(B)') processedRow.zone = 'Zone_03_(B)';

           months.forEach(month => {
               const key = `${month}-${yearSuffix}`;
               const monthValue = row[key];
               processedRow[key] = typeof monthValue === 'number' ? monthValue : 0;
           });

           return processedRow;
       }).filter(row => row.meterLabel !== 'Unknown');
  };

  const calculatedMetrics = useMemo<CalculatedMetrics>(() => {
    const defaultMetrics: CalculatedMetrics = {
        totalL1Supply: 0, totalL2Volume: 0, totalL3Volume: 0,
        stage1Loss: 0, stage1LossPercentage: 0,
        stage2Loss: 0, stage2LossPercentage: 0,
        totalLoss: 0, totalLossPercentage: 0,
        consumptionByType: {}, zoneMetrics: {}, topLosingZones: [],
        debugInfo: { l1Count: 0, l2Count: 0, dcFromL1Count: 0, l3ForTotalCount: 0, dcForTotalCount: 0, excludedL3Value: 0 }
    };

    if (!processedData || processedData.length === 0 || !selectedPeriod) {
      return defaultMetrics;
    }

    const dataForPeriod = processedData;
    const debugInfo = { ...defaultMetrics.debugInfo };

    const l1Meter = dataForPeriod.find(row => row.label === 'L1');
    const totalL1Supply = l1Meter ? (Number(l1Meter[selectedPeriod]) || 0) : 0;
    debugInfo.l1Count = l1Meter ? 1 : 0;

    const l2Meters = dataForPeriod.filter(row => row.label === 'L2');
    const dcMetersFromL1 = dataForPeriod.filter(row => row.label === 'DC' && row.parentMeterLabel === l1Meter?.meterLabel);
    const l2SumFromL2Labels = l2Meters.reduce((sum, m) => sum + (Number(m[selectedPeriod]) || 0), 0);
    const l2SumFromDCLabels = dcMetersFromL1.reduce((sum, m) => sum + (Number(m[selectedPeriod]) || 0), 0);
    const totalL2Volume = l2SumFromL2Labels + l2SumFromDCLabels;
    debugInfo.l2Count = l2Meters.length;
    debugInfo.dcFromL1Count = dcMetersFromL1.length;

    const l3MetersForTotal = dataForPeriod.filter(row => row.label === 'L3');
    const dcMetersForTotal = dataForPeriod.filter(row => row.label === 'DC');
    const excludedMeter = dataForPeriod.find(row => row.acctNum === '4300322');
    const excludedValue = excludedMeter ? (Number(excludedMeter[selectedPeriod]) || 0) : 0;

    const l3SumFromL3Labels = l3MetersForTotal.reduce((sum, m) => sum + (Number(m[selectedPeriod]) || 0), 0);
    const l3SumFromDCLabels = dcMetersForTotal.reduce((sum, m) => sum + (Number(m[selectedPeriod]) || 0), 0);

    const totalL3Volume = (l3SumFromL3Labels - excludedValue) + l3SumFromDCLabels;

    debugInfo.l3ForTotalCount = l3MetersForTotal.length;
    debugInfo.dcForTotalCount = dcMetersForTotal.length;
    debugInfo.excludedL3Value = excludedValue;

    const stage1Loss = totalL1Supply - totalL2Volume;
    const stage2Loss = totalL2Volume - totalL3Volume;
    const totalLoss = totalL1Supply - totalL3Volume;
    const stage1LossPercentage = totalL1Supply > 0 ? (stage1Loss / totalL1Supply) * 100 : 0;
    const stage2LossPercentage = totalL2Volume > 0 ? (stage2Loss / totalL2Volume) * 100 : 0;
    const totalLossPercentage = totalL1Supply > 0 ? (totalLoss / totalL1Supply) * 100 : 0;

    const consumptionByType: Record<string, number> = {};
    
    dataForPeriod
        .filter(m => (m.label === 'L3' || m.label === 'DC'))
        .forEach(meter => {
            const value = Number(meter[selectedPeriod]) || 0;
            const effectiveValue = (meter.acctNum === '4300322') ? 0 : value;
            const type = meter.type || 'Unknown';
            consumptionByType[type] = (consumptionByType[type] || 0) + effectiveValue;
        });

    const zoneMetrics: Record<string, ZoneMetric> = {};
    const zones = [...new Set(dataForPeriod.filter(m => m.zone && m.zone !== 'Unknown' && !m.zone.toLowerCase().includes('direct connection')).map(m => m.zone))];

    zones.forEach(zoneName => {
        const zoneL2Meters = l2Meters.filter(m => m.zone === zoneName);
        const l2BulkReading = zoneL2Meters.reduce((sum, m) => sum + (Number(m[selectedPeriod]) || 0), 0);

        const l3MetersInZone = dataForPeriod.filter(m => m.label === 'L3' && m.zone === zoneName);

        const l3SumInZone = l3MetersInZone.reduce((sum, m) => {
            let value = Number(m[selectedPeriod]) || 0;
            if (zoneName === 'Zone_03_(A)' && m.acctNum === '4300322') {
                value = 0;
            }
            return sum + value;
        }, 0);

        const internalLoss = l2BulkReading - l3SumInZone;
        const internalLossPercentage = l2BulkReading > 0 ? (internalLoss / l2BulkReading) * 100 : 0;

        zoneMetrics[zoneName] = {
            l2Bulk: l2BulkReading,
            l3Sum: l3SumInZone,
            loss: internalLoss,
            lossPercentage: internalLossPercentage
        };
    });

    const topLosingZones: TopLosingZone[] = Object.entries(zoneMetrics)
        .map(([name, data]) => ({
            name: name.replace('Zone_', '').replace(/_/g, ' ').replace('(A)', ' A').replace('(B)', ' B').replace('(FM)', ' FM'),
            lossPercentage: data.lossPercentage
        }))
        .filter(z => z.lossPercentage !== undefined && !isNaN(z.lossPercentage))
        .sort((a, b) => b.lossPercentage - a.lossPercentage)
        .slice(0, 5);

    return {
        totalL1Supply, totalL2Volume, totalL3Volume,
        stage1Loss, stage1LossPercentage,
        stage2Loss, stage2LossPercentage,
        totalLoss, totalLossPercentage,
        consumptionByType, zoneMetrics, topLosingZones,
        debugInfo
    };
  }, [processedData, selectedPeriod]);

  const formatNumber = (num: number): string => { return isNaN(num) || num === null || num === undefined ? '0' : Math.round(num).toLocaleString(); };
  const formatPercentage = (value: number, decimals = 1): string => { 
    if (isNaN(value) || value === null || value === undefined) return '0.0%'; 
    const factor = Math.pow(10, decimals); 
    const roundedValue = Math.round(value * factor) / factor; 
    return `${roundedValue.toFixed(decimals)}%`; 
  };
  const getLossStatusColor = (lossPercentage: number): string => { 
    if (isNaN(lossPercentage) || lossPercentage === null || lossPercentage === undefined) return THEME.secondary; 
    if (lossPercentage > 20) return THEME.error; 
    if (lossPercentage > 10) return THEME.warning; 
    if (lossPercentage >= 0) return THEME.success; 
    return THEME.accent; 
  };
  const getLossStatusText = (lossPercentage: number): string => { 
    if (isNaN(lossPercentage) || lossPercentage === null || lossPercentage === undefined) return 'Unknown'; 
    if (lossPercentage > 20) return 'High Loss'; 
    if (lossPercentage > 10) return 'Medium Loss'; 
    if (lossPercentage >= 0) return 'Good'; 
    return 'Gain'; 
  };

  const handleTabChange = (tab: string) => setActiveTab(tab);
  const handleSaveSettings = () => { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 3000); console.log("Settings saved (simulated)"); };
  const handleRefresh = () => { 
    setIsLoading(true); 
    const currentYear = selectedYear; 
    const loadData = async () => { 
      try { 
        const fileName = currentYear === '2025' ? '2025 Water Consumptions-Master View Water 2025 13.csv' : '2024 Water Consumptions-Master View Water 2024 11.csv'; 
        let fileContent = ''; 
        try { 
          const response = await fetch(fileName); 
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); 
          fileContent = await response.text(); 
        } catch (fetchError) { 
          console.error(`Error fetching ${fileName} on refresh:`, fetchError); 
          fileContent = generateMockCsvContent(currentYear); 
        } 
        if (!(window as any).Papa) { 
          console.error("PapaParse not ready for refresh!"); 
          setIsLoading(false); 
          return; 
        } 
        const parsedData = (window as any).Papa.parse(fileContent, { 
          header: true, 
          dynamicTyping: true, 
          skipEmptyLines: true, 
          transformHeader: (header: string) => header.trim() 
        }); 
        if (parsedData.errors && parsedData.errors.length > 0) 
          console.error("CSV Parsing Errors on refresh:", parsedData.errors); 
        setRawData(parsedData.data); 
        const dataForProcessing = parsedData.data || []; 
        const processed = processRawData(dataForProcessing, currentYear); 
        setProcessedData(processed); 
        setIsLoading(false); 
        console.log("Data refreshed"); 
      } catch (error) { 
        console.error("Error refreshing data:", error); 
        setRawData([]); 
        setProcessedData([]); 
        setIsLoading(false); 
      } 
    }; 
    setTimeout(loadData, 500); 
  };

  const getSelectedZoneMeters = () => {
      if (!processedData || !selectedZone) return [];
      return processedData.filter(row =>
          row.zone === selectedZone &&
          row.label === 'L3'
      );
  };

  const getConsumptionByZoneData = (): ChartDataItem[] => {
      if (!processedData || !selectedPeriod) return [];
      const zoneConsumption: Record<string, number> = {};
      processedData.forEach(row => {
          if (selectedType !== 'All Types' && row.type !== selectedType) return;

          if ((row.label === 'L3' || row.label === 'DC') && row.zone && row.zone !== 'Unknown' && !row.zone.toLowerCase().includes('direct connection')) {
              const value = Number(row[selectedPeriod]) || 0;
              const effectiveValue = (row.acctNum === '4300322') ? 0 : value;
              const zoneName = row.zone;
              if (!zoneConsumption[zoneName]) zoneConsumption[zoneName] = 0;
              zoneConsumption[zoneName] += effectiveValue;
          }
      });
      return Object.entries(zoneConsumption)
          .filter(([zone, value]) => value > 0)
          .map(([zone, value]) => ({
              name: zone.replace('Zone_', '').replace(/_/g, ' ').replace('(A)', ' A').replace('(B)', ' B').replace('(FM)', ' FM'),
              value
          }))
          .sort((a, b) => b.value - a.value);
  };

  const calculateLossTrend = () => {
      if (!processedData || processedData.length === 0) return [];
      const yearSuffix = selectedYear.substring(2);
      const monthsInYear = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const availableMonths = monthsInYear.filter(month => processedData.some(row => row[`${month}-${yearSuffix}`] !== undefined));

      return availableMonths.map(month => {
          const periodKey = `${month}-${yearSuffix}`;

          const l1Meter = processedData.find(row => row.label === 'L1');
          const totalL1 = l1Meter ? (Number(l1Meter[periodKey]) || 0) : 0;

          const l2Meters = processedData.filter(row => row.label === 'L2');
          const dcMetersFromL1 = processedData.filter(row => row.label === 'DC' && row.parentMeterLabel === l1Meter?.meterLabel);
          const totalL2 = l2Meters.reduce((sum, m) => sum + (Number(m[periodKey]) || 0), 0) + dcMetersFromL1.reduce((sum, m) => sum + (Number(m[periodKey]) || 0), 0);

          const l3Meters = processedData.filter(row => row.label === 'L3');
          const dcMeters = processedData.filter(row => row.label === 'DC');
          const excludedMeter = processedData.find(row => row.acctNum === '4300322');
          const excludedVal = excludedMeter ? (Number(excludedMeter[periodKey]) || 0) : 0;
          const totalL3 = (l3Meters.reduce((sum, m) => sum + (Number(m[periodKey]) || 0), 0) - excludedVal) + dcMeters.reduce((sum, m) => sum + (Number(m[periodKey]) || 0), 0);

          const stage1Loss = totalL1 - totalL2;
          const stage2Loss = totalL2 - totalL3;
          const totalLoss = totalL1 - totalL3;
          const stage1LossPct = totalL1 > 0 ? (stage1Loss / totalL1 * 100) : 0;
          const stage2LossPct = totalL2 > 0 ? (stage2Loss / totalL2 * 100) : 0;
          const totalLossPct = totalL1 > 0 ? (totalLoss / totalL1 * 100) : 0;

          return {
              month,
              stage1Loss,
              stage2Loss,
              totalLoss,
              stage1LossPct,
              stage2LossPct,
              totalLossPct
          };
      });
  };

  const consumptionByTypeData: ChartDataItem[] = useMemo(() => {
    const { consumptionByType } = calculatedMetrics;
    return Object.entries(consumptionByType)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [calculatedMetrics]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4 text-muscat-primary">Muscat Bay Water System Dashboard</h1>

      {/* Top Filters and Actions */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <select
            className="p-2 border rounded"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>

          <select
            className="p-2 border rounded"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>

          <select
            className="p-2 border rounded"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="All Types">All Types</option>
            {[...new Set(processedData.map(m => m.type))].map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            className="p-2 border rounded"
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            disabled={processedData.length === 0}
          >
            {processedData.length === 0 ? (
              <option value="">No Zones Available</option>
            ) : (
              <>
                <option value="All Zones">All Zones</option>
                {[...new Set(processedData
                  .filter(m => m.zone && m.zone !== 'Unknown' && !m.zone.toLowerCase().includes('direct connection'))
                  .map(m => m.zone))]
                  .map(zone => (
                    <option key={zone} value={zone}>{zone.replace('Zone_', '').replace(/_/g, ' ').replace('(A)', ' A').replace('(B)', ' B')}</option>
                  ))}
              </>
            )}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="p-2 border rounded flex items-center text-sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </button>
          <button
            className="p-2 border rounded flex items-center text-sm"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </button>
        </div>
      </div>

      {/* Placeholder for the main content */}
      <div className="bg-gray-100 p-8 rounded-lg mb-4 text-center">
        <p>Water System Dashboard Content Will Be Displayed Here</p>
        <p className="text-sm text-gray-500">Currently selected period: {selectedPeriod}</p>
      </div>
    </div>
  );
};

export default MuscatBayWaterSystem;
