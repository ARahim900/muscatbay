import React, { useState, useEffect, useMemo } from 'react';
// Import necessary components from recharts
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
// Import icons from lucide-react
import {
  Clock, ArrowDownRight, Filter, Download, RefreshCw, Droplet, Check, Activity, Layers, Percent, MapPin, Type, Settings as SettingsIcon
} from 'lucide-react';
// REMOVED: import Papa from 'papaparse'; - Will load from CDN instead

// Main App Component: MuscatBayWaterSystem
const MuscatBayWaterSystem = () => {
  // --- THEME Definition ---
  const THEME = {
    primary: '#4E4456',   // Dark purple-grey
    secondary: '#A5A0AB', // Lighter grey
    accent: '#9AD0D2',    // Light teal/cyan
    light: '#E4E2E7',     // Very light grey/off-white background
    white: '#FFFFFF',     // White
    darkText: '#383339',  // Dark text color
    lightText: '#7A737F', // Lighter text color (for secondary info)
    success: '#7CBBA7',   // Green for success/good status
    warning: '#D8BC74',   // Yellow/Orange for warnings
    error: '#C48B9F',     // Red/Pink for errors/high loss
    chartColors: ['#9AD0D2', '#A5A0AB', '#C48B9F', '#D8BC74', '#7CBBA7', '#B8A9C6'] // Colors for charts
  };

  // --- State Variables ---
  const [rawData, setRawData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState('Mar');
  const [selectedPeriod, setSelectedPeriod] = useState('Mar-25');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedZone, setSelectedZone] = useState('Zone_05'); // Default to a likely existing zone
  const [selectedType, setSelectedType] = useState('All Types');
  const [isLoading, setIsLoading] = useState(true);
  const [isScriptLoading, setIsScriptLoading] = useState(true); // State for PapaParse script loading
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');


  // --- Load PapaParse Script from CDN ---
  useEffect(() => {
    const scriptId = 'papaparse-cdn-script';
    // Check if the script already exists
    if (document.getElementById(scriptId) || window.Papa) {
        setIsScriptLoading(false); // Already loaded or exists
        return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js'; // PapaParse CDN URL
    script.async = true;
    script.onload = () => {
      console.log("PapaParse loaded from CDN.");
      setIsScriptLoading(false); // Set script loading state to false
    };
    script.onerror = () => {
      console.error("Failed to load PapaParse script from CDN.");
      setIsScriptLoading(false); // Still set to false on error to potentially show an error message
      // Handle script loading error (e.g., show a message to the user)
    };
    document.body.appendChild(script);

    // Cleanup function to remove script if component unmounts
    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        // Optional: Remove script on unmount, or leave it for potential reuse
        // document.body.removeChild(existingScript);
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Data Loading and Processing Effect ---
  useEffect(() => {
    setSelectedPeriod(`${selectedMonth}-${selectedYear.substring(2)}`);
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    // Wait for both script and data loading
    if (isScriptLoading) {
        // console.log("Waiting for PapaParse script to load...");
        return; // Don't load data until PapaParse script is ready
    }

    const loadData = async () => {
      setIsLoading(true); // Set loading state for data fetching
      try {
        // Determine filename based on selected year
        const fileName = selectedYear === '2025'
            ? '2025 Water Consumptions-Master View Water 2025 13.csv' // Use the provided 2025 file name
            : '2024 Water Consumptions-Master View Water 2024 11.csv'; // Use the provided 2024 file name

        let fileContent = '';
        // --- File Reading Placeholder (Replace with actual Electron/Node.js file reading if applicable) ---
        // This example uses fetch for web context. Adjust if using Electron's fs.
        try {
             const response = await fetch(fileName); // Assumes files are in the public folder or accessible via URL
             if (!response.ok) {
                 throw new Error(`HTTP error! status: ${response.status} for ${fileName}`);
             }
             fileContent = await response.text();
             console.log(`Successfully fetched ${fileName}`);
         } catch (fetchError) {
             console.error(`Error fetching file ${fileName}:`, fetchError);
             console.warn("Using mock CSV data as fallback.");
             fileContent = generateMockCsvContent(selectedYear); // Use mock data if fetch fails
         }
        // --- End File Reading ---

        // Check if PapaParse is loaded
        if (!window.Papa) {
            console.error("PapaParse is not loaded yet!");
            setIsLoading(false);
            // Optionally set an error state here
            return;
        }

        // Parse CSV using window.Papa
        const parsedData = window.Papa.parse(fileContent, {
          header: true,
          dynamicTyping: true, // Attempts to convert numbers/booleans
          skipEmptyLines: true,
          transformHeader: header => header.trim() // Trim whitespace from headers
        });

        if (parsedData.errors && parsedData.errors.length > 0) {
            console.error("CSV Parsing Errors:", parsedData.errors);
            // Handle parsing errors, maybe show a notification
        }

        setRawData(parsedData.data); // Store raw parsed data if needed
        const dataForProcessing = parsedData.data || [];
        const processed = processRawData(dataForProcessing, selectedYear);
        setProcessedData(processed);

        // Auto-select first available zone if default 'Zone_05' is not present
         const zones = [...new Set(processed.filter(m => m.zone && m.zone !== 'Unknown').map(m => m.zone))];
         if (zones.length > 0 && !zones.includes(selectedZone)) {
             setSelectedZone(zones[0]);
         } else if (zones.length === 0) {
             setSelectedZone(''); // No zones available
         }


      } catch (error) {
        console.error("Error loading or processing data:", error);
        setRawData([]);
        setProcessedData([]);
        // Optionally set an error state here
      } finally {
          setIsLoading(false); // Turn off data loading indicator
      }
    };

    loadData();
  }, [selectedYear, isScriptLoading]); // Reload data when year changes or script finishes loading


  // --- Mock CSV Data Generation (Fallback) ---
  const generateMockCsvContent = (year) => {
      const headers = "Meter Label,Acct #,Level ,Zone,Type,Parent Meter,Jan-YY,Feb-YY,Mar-YY,Apr-YY,May-YY,Jun-YY"; // Replace YY later
      const yearSuffix = year.substring(2);
      let csvString = headers.replace(/YY/g, yearSuffix) + "\n";

      const mockData = {
        '2025': [
            { meterLabel: 'Main Bulk (NAMA)', acctNum: 'C43659', label: 'L1', zone: 'Main Bulk', type: 'Main BULK', parentMeterLabel: 'NAMA', 'Jan-25': 32580, 'Feb-25': 44043, 'Mar-25': 34915 },
            { meterLabel: 'ZONE 3A (Bulk Zone 3A)', acctNum: '4300343', label: 'L2', zone: 'Zone_03_(A)', type: 'Zone Bulk', parentMeterLabel: 'Main Bulk (NAMA)', 'Jan-25': 4235, 'Feb-25': 4273, 'Mar-25': 3591 },
            { meterLabel: 'ZONE 5 (Bulk Zone 5)', acctNum: '4300345', label: 'L2', zone: 'Zone_05', type: 'Zone Bulk', parentMeterLabel: 'Main Bulk (NAMA)', 'Jan-25': 4267, 'Feb-25': 4231, 'Mar-25': 3862 },
            { meterLabel: 'Hotel Main Building', acctNum: '4300334', label: 'DC', zone: 'Direct Connection ', type: 'Retail', parentMeterLabel: 'Main Bulk (NAMA)', 'Jan-25': 18048, 'Feb-25': 19482, 'Mar-25': 22151 },
            { meterLabel: 'Z3-42 (Villa)', acctNum: '4300002', label: 'L3', zone: 'Zone_03_(A)', type: 'Residential (Villa)', parentMeterLabel: 'ZONE 3A (BULK ZONE 3A)', 'Jan-25': 32, 'Feb-25': 46, 'Mar-25': 19 },
            { meterLabel: 'Z5-17', acctNum: '4300001', label: 'L3', zone: 'Zone_05', type: 'Residential (Villa)', parentMeterLabel: 'ZONE 5 (Bulk Zone 5)', 'Jan-25': 112, 'Feb-25': 80, 'Mar-25': 81 },
            { meterLabel: 'Z3-74(3) (Building)', acctNum: '4300322', label: 'L3', zone: 'Zone_03_(A)', type: 'Residential (Apart)', parentMeterLabel: 'ZONE 3A (BULK ZONE 3A)', 'Jan-25': null, 'Feb-25': null, 'Mar-25': 19 }, // Anomaly
            // Add more mock rows as needed
        ],
        '2024': [
            // ... similar structure for 2024 mock data ...
             { meterLabel: 'Main Bulk (NAMA)', acctNum: 'C43659', label: 'L1', zone: 'Main Bulk', type: 'Main BULK', parentMeterLabel: 'NAMA', 'Jan-24': 32803, 'Feb-24': 27996, 'Mar-24': 23860, 'Apr-24': 31869, 'May-24': 30737, 'Jun-24': 41953 },
             { meterLabel: 'ZONE 3A (Bulk Zone 3A)', acctNum: '4300343', label: 'L2', zone: 'Zone_03_(A)', type: 'Zone Bulk', parentMeterLabel: 'Main Bulk (NAMA)', 'Jan-24': 1234, 'Feb-24': 1099, 'Mar-24': 1297, 'Apr-24': 1892, 'May-24': 2254, 'Jun-24': 2227 },
             { meterLabel: 'ZONE 5 (Bulk Zone 5)', acctNum: '4300345', label: 'L2', zone: 'Zone_05', type: 'Zone Bulk', parentMeterLabel: 'Main Bulk (NAMA)', 'Jan-24': 4286, 'Feb-24': 3897, 'Mar-24': 4127, 'Apr-24': 4911, 'May-24': 2639, 'Jun-24': 4992 },
             { meterLabel: 'Hotel Main Building', acctNum: '4300334', label: 'DC', zone: 'Direct Connection ', type: 'Retail', parentMeterLabel: 'Main Bulk (NAMA)', 'Jan-24': 14012, 'Feb-24': 12880, 'Mar-24': 11222, 'Apr-24': 13217, 'May-24': 13980, 'Jun-24': 15385 },
             { meterLabel: 'Z3-42 (Villa)', acctNum: '4300002', label: 'L3', zone: 'Zone_03_(A)', type: 'Residential (Villa)', parentMeterLabel: 'ZONE 3A (BULK ZONE 3A)', 'Jan-24': 61, 'Feb-24': 33, 'Mar-24': 36, 'Apr-24': 47, 'May-24': 39, 'Jun-24': 42 },
             { meterLabel: 'Z5-17', acctNum: '4300001', label: 'L3', zone: 'Zone_05', type: 'Residential (Villa)', parentMeterLabel: 'ZONE 5 (Bulk Zone 5)', 'Jan-24': 99, 'Feb-24': 51, 'Mar-24': 53, 'Apr-24': 62, 'May-24': 135, 'Jun-24': 140 },
            // Note: Acct 4300322 does not exist in 2024 data, so no need for anomaly row here
        ]
      };

      const data = mockData[year] || [];
      data.forEach(row => {
          // Dynamically get month keys for the selected year
          const monthKeys = Object.keys(row).filter(k => k.includes(`-${yearSuffix}`));
          const values = [
              row.meterLabel, row.acctNum, row.label, row.zone || '', row.type, row.parentMeterLabel || ''
          ];
          monthKeys.forEach(key => values.push(row[key] || 0));

          // Ensure all values exist before joining, handle potential undefined values
          const safeValues = values.map(v => (v === undefined || v === null) ? '' : `"${String(v).replace(/"/g, '""')}"`); // Basic CSV escaping
          csvString += safeValues.join(',') + "\n";
      });
      return csvString;
  };


  // --- Process Raw Data Function ---
   const processRawData = (rawDataArray, year) => {
       const requiredHeaders = ['Meter Label', 'Acct #', 'Zone', 'Type', 'Parent Meter', 'Label', 'Level ']; // Include both possible label headers
       const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
       const yearSuffix = year.substring(2);

       return rawDataArray.map(row => {
           const processedRow = {};

           // Handle different potential header names and trim values
           processedRow.meterLabel = String(row['Meter Label'] || row.meterLabel || 'Unknown').trim();
           processedRow.acctNum = String(row['Acct #'] || row.acctNum || 'Unknown').trim();
           processedRow.zone = String(row.Zone || 'Unknown').trim();
           processedRow.type = String(row.Type || 'Unknown').trim();
           processedRow.parentMeterLabel = String(row['Parent Meter'] || row.parentMeterLabel || '').trim() || null; // Null if empty

           // Prioritize 'Label' then 'Level '
           let labelValue = row.Label || row['Level '] || 'Unknown';
           processedRow.label = String(labelValue).trim();

           // Clean up common zone/label variations (optional but good practice)
           if (processedRow.zone === 'Direct Connection') processedRow.zone = 'Direct Connection '; // Ensure trailing space if needed by logic/data
           if (processedRow.zone === 'Zone_03_(A)') processedRow.zone = 'Zone_03_(A)'; // Normalize
           if (processedRow.zone === 'Zone_03_(B)') processedRow.zone = 'Zone_03_(B)'; // Normalize

           // Process monthly data
           months.forEach(month => {
               const key = `${month}-${yearSuffix}`;
               // Use Number() for conversion, default to 0 if NaN or missing
               processedRow[key] = Number(row[key]) || 0;
           });

           return processedRow;
       }).filter(row => row.meterLabel !== 'Unknown'); // Filter out rows without a meter label
   };


  // --- Calculation Logic (useMemo - UPDATED) ---
  const calculatedMetrics = useMemo(() => {
    // console.log(`Recalculating metrics for period: ${selectedPeriod}`);
    // console.log(`Processed data length: ${processedData?.length}`);

    // Default structure for metrics
    const defaultMetrics = {
        totalL1Supply: 0, totalL2Volume: 0, totalL3Volume: 0,
        stage1Loss: 0, stage1LossPercentage: 0,
        stage2Loss: 0, stage2LossPercentage: 0,
        totalLoss: 0, totalLossPercentage: 0,
        consumptionByType: {}, zoneMetrics: {}, topLosingZones: [],
        debugInfo: { l1Count: 0, l2Count: 0, dcFromL1Count: 0, l3ForTotalCount: 0, dcForTotalCount: 0, excludedL3Value: 0 }
    };

    if (!processedData || processedData.length === 0 || !selectedPeriod) {
      // console.log("No data or period selected, returning default metrics.");
      return defaultMetrics;
    }

    const dataForPeriod = processedData; // Use the already processed data
    const debugInfo = { ...defaultMetrics.debugInfo };

    // --- L1 Calculation ---
    const l1Meter = dataForPeriod.find(row => row.label === 'L1');
    const totalL1Supply = l1Meter ? (l1Meter[selectedPeriod] || 0) : 0;
    debugInfo.l1Count = l1Meter ? 1 : 0;
    // if (!l1Meter) console.warn("L1 meter not found!");

    // --- L2 Calculation ---
    const l2Meters = dataForPeriod.filter(row => row.label === 'L2');
    const dcMetersFromL1 = dataForPeriod.filter(row => row.label === 'DC' && row.parentMeterLabel === l1Meter?.meterLabel);
    const l2SumFromL2Labels = l2Meters.reduce((sum, m) => sum + (m[selectedPeriod] || 0), 0);
    const l2SumFromDCLabels = dcMetersFromL1.reduce((sum, m) => sum + (m[selectedPeriod] || 0), 0);
    const totalL2Volume = l2SumFromL2Labels + l2SumFromDCLabels;
    debugInfo.l2Count = l2Meters.length;
    debugInfo.dcFromL1Count = dcMetersFromL1.length;

    // --- L3 Calculation (Applying Final Logic) ---
    const l3MetersForTotal = dataForPeriod.filter(row => row.label === 'L3');
    const dcMetersForTotal = dataForPeriod.filter(row => row.label === 'DC');
    const excludedMeter = dataForPeriod.find(row => row.acctNum === '4300322'); // Find the meter to exclude
    const excludedValue = excludedMeter ? (excludedMeter[selectedPeriod] || 0) : 0;

    const l3SumFromL3Labels = l3MetersForTotal.reduce((sum, m) => sum + (m[selectedPeriod] || 0), 0);
    const l3SumFromDCLabels = dcMetersForTotal.reduce((sum, m) => sum + (m[selectedPeriod] || 0), 0);

    // Apply exclusion SPECIFICALLY to the L3 sum part
    const totalL3Volume = (l3SumFromL3Labels - excludedValue) + l3SumFromDCLabels;

    debugInfo.l3ForTotalCount = l3MetersForTotal.length;
    debugInfo.dcForTotalCount = dcMetersForTotal.length;
    debugInfo.excludedL3Value = excludedValue;

    // --- Loss Calculations ---
    const stage1Loss = totalL1Supply - totalL2Volume;
    const stage2Loss = totalL2Volume - totalL3Volume;
    const totalLoss = totalL1Supply - totalL3Volume;
    const stage1LossPercentage = totalL1Supply > 0 ? (stage1Loss / totalL1Supply) * 100 : 0;
    const stage2LossPercentage = totalL2Volume > 0 ? (stage2Loss / totalL2Volume) * 100 : 0;
    const totalLossPercentage = totalL1Supply > 0 ? (totalLoss / totalL1Supply) * 100 : 0;

    // --- Consumption by Type Calculation ---
    // Includes L3 and DC meters, applies the exclusion 4300322
    const consumptionByType = dataForPeriod
        .filter(m => (m.label === 'L3' || m.label === 'DC'))
        .reduce((acc, meter) => {
            const value = meter[selectedPeriod] || 0;
            // Apply exclusion only if it's the specific meter
            const effectiveValue = (meter.acctNum === '4300322') ? 0 : value;
            const type = meter.type || 'Unknown';
            acc[type] = (acc[type] || 0) + effectiveValue;
            return acc;
        }, {});


    // --- Zone Metrics (Internal Loss) Calculation ---
    const zoneMetrics = {};
    const zones = [...new Set(dataForPeriod.filter(m => m.zone && m.zone !== 'Unknown' && !m.zone.toLowerCase().includes('direct connection')).map(m => m.zone))];

    zones.forEach(zoneName => {
        // Find the L2 Bulk meter(s) for this zone
        const zoneL2Meters = l2Meters.filter(m => m.zone === zoneName);
        // Sum readings if multiple L2 meters found for a zone (unlikely based on data, but safe)
        const l2BulkReading = zoneL2Meters.reduce((sum, m) => sum + (m[selectedPeriod] || 0), 0);

        // Find L3 meters within this zone
        const l3MetersInZone = dataForPeriod.filter(m => m.label === 'L3' && m.zone === zoneName);

        // Calculate L3 sum for the zone, applying the exclusion *only* if it's Zone_03_(A)
        const l3SumInZone = l3MetersInZone.reduce((sum, m) => {
            let value = m[selectedPeriod] || 0;
            // Apply exclusion *only* for Zone 3A internal calculation
            if (zoneName === 'Zone_03_(A)' && m.acctNum === '4300322') {
                value = 0; // Exclude this meter's value from Zone 3A's L3 sum
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

    // Calculate Top Losing Zones based on internal loss percentage
    const topLosingZones = Object.entries(zoneMetrics)
        .map(([name, data]) => ({
            name: name.replace('Zone_', '').replace(/_/g, ' ').replace('(A)', ' A').replace('(B)', ' B').replace('(FM)', ' FM'), // Clean up name for display
            lossPercentage: data.lossPercentage
        }))
        .filter(z => z.lossPercentage !== undefined && !isNaN(z.lossPercentage)) // Ensure valid percentage
        .sort((a, b) => b.lossPercentage - a.lossPercentage)
        .slice(0, 5); // Get top 5

    // console.log("Calculated Metrics:", { totalL1Supply, totalL2Volume, totalL3Volume, stage1LossPercentage, stage2LossPercentage, totalLossPercentage });
    // console.log("Zone Metrics:", zoneMetrics);

    return {
        totalL1Supply, totalL2Volume, totalL3Volume,
        stage1Loss, stage1LossPercentage,
        stage2Loss, stage2LossPercentage,
        totalLoss, totalLossPercentage,
        consumptionByType, zoneMetrics, topLosingZones,
        debugInfo // Include debug info if needed
    };
  }, [processedData, selectedPeriod]); // Dependencies: run when data or period changes


  // --- Helper Functions (unchanged) ---
   const formatNumber = (num) => { return isNaN(num) || num === null || num === undefined ? '0' : Math.round(num).toLocaleString(); };
   const formatPercentage = (value, decimals = 1) => { if (isNaN(value) || value === null || value === undefined) return '0.0%'; const factor = Math.pow(10, decimals); const roundedValue = Math.round(value * factor) / factor; return `${roundedValue.toFixed(decimals)}%`; };
   const getLossStatusColor = (lossPercentage) => { if (isNaN(lossPercentage) || lossPercentage === null || lossPercentage === undefined) return THEME.secondary; if (lossPercentage > 20) return THEME.error; if (lossPercentage > 10) return THEME.warning; if (lossPercentage >= 0) return THEME.success; return THEME.accent; }; // Accent for Gain
   const getLossStatusText = (lossPercentage) => { if (isNaN(lossPercentage) || lossPercentage === null || lossPercentage === undefined) return 'Unknown'; if (lossPercentage > 20) return 'High Loss'; if (lossPercentage > 10) return 'Medium Loss'; if (lossPercentage >= 0) return 'Good'; return 'Gain'; };

  // --- Event Handlers (unchanged) ---
   const handleTabChange = (tab) => setActiveTab(tab);
   const handleSaveSettings = () => { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 3000); console.log("Settings saved (simulated)"); };
   const handleRefresh = () => { setIsLoading(true); const currentYear = selectedYear; const loadData = async () => { try { const fileName = currentYear === '2025' ? '2025 Water Consumptions-Master View Water 2025 13.csv' : '2024 Water Consumptions-Master View Water 2024 11.csv'; let fileContent = ''; try { const response = await fetch(fileName); if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); fileContent = await response.text(); } catch (fetchError) { console.error(`Error fetching ${fileName} on refresh:`, fetchError); fileContent = generateMockCsvContent(currentYear); } if (!window.Papa) { console.error("PapaParse not ready for refresh!"); setIsLoading(false); return; } const parsedData = window.Papa.parse(fileContent, { header: true, dynamicTyping: true, skipEmptyLines: true, transformHeader: header => header.trim() }); if (parsedData.errors && parsedData.errors.length > 0) console.error("CSV Parsing Errors on refresh:", parsedData.errors); setRawData(parsedData.data); const dataForProcessing = parsedData.data || []; const processed = processRawData(dataForProcessing, currentYear); setProcessedData(processed); setIsLoading(false); console.log("Data refreshed"); } catch (error) { console.error("Error refreshing data:", error); setRawData([]); setProcessedData([]); setIsLoading(false); } }; setTimeout(loadData, 500); };


   // --- Data Preparation Functions for Tabs ---
    // Get L3 meters for the selected zone, applying the specific exclusion for Zone 3A display if needed (though main calc handles logic)
    const getSelectedZoneMeters = () => {
        if (!processedData || !selectedZone) return [];
        return processedData.filter(row =>
            row.zone === selectedZone &&
            row.label === 'L3'
            // No need to exclude 4300322 here for display purposes, just show all L3s in the zone.
            // The internal loss calculation correctly excludes it for Zone 3A already.
        );
    };

    // Prepare data for "Consumption by Zone" chart in Type Details tab
    const getConsumptionByZoneData = () => {
        if (!processedData || !selectedPeriod) return [];
        const zoneConsumption = {};
        processedData.forEach(row => {
            // Filter by selected type if not 'All Types'
            if (selectedType !== 'All Types' && row.type !== selectedType) return;

            // Include L3 and DC meters for consumption, apply exclusion 4300322
            if ((row.label === 'L3' || row.label === 'DC') && row.zone && row.zone !== 'Unknown' && !row.zone.toLowerCase().includes('direct connection')) {
                const value = row[selectedPeriod] || 0;
                // Apply exclusion only if it's the specific meter
                const effectiveValue = (row.acctNum === '4300322') ? 0 : value;
                const zoneName = row.zone;
                if (!zoneConsumption[zoneName]) zoneConsumption[zoneName] = 0;
                zoneConsumption[zoneName] += effectiveValue;
            }
        });
        return Object.entries(zoneConsumption)
            .filter(([zone, value]) => value > 0) // Show only zones with consumption > 0 for the selected type
            .map(([zone, value]) => ({
                name: zone.replace('Zone_', '').replace(/_/g, ' ').replace('(A)', ' A').replace('(B)', ' B').replace('(FM)', ' FM'), // Clean name
                value
            }))
            .sort((a, b) => b.value - a.value); // Sort by consumption descending
    };

    // Calculate loss trends over available months of the selected year
    const calculateLossTrend = () => {
        if (!processedData || processedData.length === 0) return [];
        const yearSuffix = selectedYear.substring(2);
        const monthsInYear = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        // Find which months actually have data in the processed dataset
        const availableMonths = monthsInYear.filter(month => processedData.some(row => row[`${month}-${yearSuffix}`] !== undefined));

        const trend = availableMonths.map(month => {
            const periodKey = `${month}-${yearSuffix}`;

            // Recalculate L1, L2, L3 for *this* periodKey
            const l1Meter = processedData.find(row => row.label === 'L1');
            const totalL1 = l1Meter ? (l1Meter[periodKey] || 0) : 0;

            const l2Meters = processedData.filter(row => row.label === 'L2');
            const dcMetersFromL1 = processedData.filter(row => row.label === 'DC' && row.parentMeterLabel === l1Meter?.meterLabel);
            const totalL2 = l2Meters.reduce((sum, m) => sum + (m[periodKey] || 0), 0) + dcMetersFromL1.reduce((sum, m) => sum + (m[periodKey] || 0), 0);

            const l3Meters = processedData.filter(row => row.label === 'L3');
            const dcMeters = processedData.filter(row => row.label === 'DC');
            const excludedMeter = processedData.find(row => row.acctNum === '4300322');
            const excludedVal = excludedMeter ? (excludedMeter[periodKey] || 0) : 0;
            const totalL3 = (l3Meters.reduce((sum, m) => sum + (m[periodKey] || 0), 0) - excludedVal) + dcMeters.reduce((sum, m) => sum + (m[periodKey] || 0), 0);

            // Calculate losses for this month
            const stage1Loss = totalL1 - totalL2;
            const stage2Loss = totalL2 - totalL3;
            const totalLoss = totalL1 - totalL3;

            // Calculate percentages
            const stage1LossPct = totalL1 > 0 ? (stage1Loss / totalL1 * 100) : 0;
            const stage2LossPct = totalL2 > 0 ? (stage2Loss / totalL2 * 100) : 0;
            const totalLossPct = totalL1 > 0 ? (totalLoss / totalL1 * 100) : 0;

            return { period: month, stage1LossPct, stage2LossPct, totalLossPct };
