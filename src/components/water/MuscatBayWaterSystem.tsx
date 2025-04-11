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
        });
        
        return trend;
    };

  // Prepare data for "Consumption by Type" pie chart
  const prepareConsumptionByTypeData = () => {
    if (!calculatedMetrics.consumptionByType) return [];
    
    // Convert the consumptionByType object to an array for the pie chart
    return Object.entries(calculatedMetrics.consumptionByType)
      .map(([type, value]) => ({
        name: type,
        value: Number(value)
      }))
      .filter(item => item.value > 0) // Only include types with consumption > 0
      .sort((a, b) => b.value - a.value); // Sort by consumption (descending)
  };

  // Filter zone meters based on search term
  const filteredZoneMeters = useMemo(() => {
    const meters = getSelectedZoneMeters();
    if (!searchTerm) return meters;
    
    return meters.filter(meter => 
      meter.meterLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meter.acctNum.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedData, selectedZone, searchTerm, selectedPeriod]); // Re-filter when data, zone, search, or period changes

  // --- RENDER LOGIC ---
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Muscat Bay Water System</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock size={18} className="text-gray-500" />
              <span className="text-sm text-gray-600">Last updated: Today, 08:45 AM</span>
            </div>
            <button 
              onClick={handleRefresh}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading || isScriptLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="Jan">January</option>
                    <option value="Feb">February</option>
                    <option value="Mar">March</option>
                    <option value="Apr">April</option>
                    <option value="May">May</option>
                    <option value="Jun">June</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                  <select 
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {[...new Set(processedData.filter(m => m.zone && m.zone !== 'Unknown').map(m => m.zone))].map(zone => (
                      <option key={zone} value={zone}>{zone.replace('Zone_', 'Zone ').replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select 
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="All Types">All Types</option>
                    {[...new Set(processedData.filter(m => m.type).map(m => m.type))].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="ml-auto flex items-center space-x-2">
                  <button className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                    <Filter size={16} />
                    <span>More Filters</span>
                  </button>
                  <button className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                    <Download size={16} />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => handleTabChange('dashboard')}
                    className={`${
                      activeTab === 'dashboard'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => handleTabChange('zone-details')}
                    className={`${
                      activeTab === 'zone-details'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Zone Details
                  </button>
                  <button
                    onClick={() => handleTabChange('type-details')}
                    className={`${
                      activeTab === 'type-details'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Type Details
                  </button>
                  <button
                    onClick={() => handleTabChange('trends')}
                    className={`${
                      activeTab === 'trends'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Trends
                  </button>
                  <button
                    onClick={() => handleTabChange('settings')}
                    className={`${
                      activeTab === 'settings'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Settings
                  </button>
                </nav>
              </div>
            </div>

            {/* Dashboard Tab Content */}
            {activeTab === 'dashboard' && (
              <div>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <KPI_Card
                    title="Total Supply"
                    value={formatNumber(calculatedMetrics.totalL1Supply)}
                    unit="m³"
                    icon={<Droplet size={20} className="text-blue-500" />}
                    trend={null}
                    trendText={null}
                    color="blue"
                  />
                  <KPI_Card
                    title="Total Loss"
                    value={formatNumber(calculatedMetrics.totalLoss)}
                    unit="m³"
                    icon={<ArrowDownRight size={20} className="text-red-500" />}
                    trend={calculatedMetrics.totalLossPercentage}
                    trendText={formatPercentage(calculatedMetrics.totalLossPercentage)}
                    color={getLossStatusColor(calculatedMetrics.totalLossPercentage)}
                    statusText={getLossStatusText(calculatedMetrics.totalLossPercentage)}
                  />
                  <KPI_Card
                    title="Stage 1 Loss"
                    value={formatNumber(calculatedMetrics.stage1Loss)}
                    unit="m³"
                    icon={<Activity size={20} className="text-orange-500" />}
                    trend={calculatedMetrics.stage1LossPercentage}
                    trendText={formatPercentage(calculatedMetrics.stage1LossPercentage)}
                    color={getLossStatusColor(calculatedMetrics.stage1LossPercentage)}
                    statusText={getLossStatusText(calculatedMetrics.stage1LossPercentage)}
                    description="L1 to L2 Loss"
                  />
                  <KPI_Card
                    title="Stage 2 Loss"
                    value={formatNumber(calculatedMetrics.stage2Loss)}
                    unit="m³"
                    icon={<Layers size={20} className="text-purple-500" />}
                    trend={calculatedMetrics.stage2LossPercentage}
                    trendText={formatPercentage(calculatedMetrics.stage2LossPercentage)}
                    color={getLossStatusColor(calculatedMetrics.stage2LossPercentage)}
                    statusText={getLossStatusText(calculatedMetrics.stage2LossPercentage)}
                    description="L2 to L3 Loss"
                  />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Water Flow Diagram */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Water Flow Diagram</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'L1 Supply', value: calculatedMetrics.totalL1Supply },
                            { name: 'Stage 1 Loss', value: calculatedMetrics.stage1Loss },
                            { name: 'L2 Volume', value: calculatedMetrics.totalL2Volume },
                            { name: 'Stage 2 Loss', value: calculatedMetrics.stage2Loss },
                            { name: 'L3 Volume', value: calculatedMetrics.totalL3Volume }
                          ]}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" />
                          <Tooltip formatter={(value) => [`${formatNumber(value)} m³`, '']} />
                          <Legend />
                          <Bar dataKey="value" name="Volume (m³)">
                            {[
                              <Cell key="L1" fill={THEME.accent} />,
                              <Cell key="S1L" fill={THEME.error} />,
                              <Cell key="L2" fill={THEME.secondary} />,
                              <Cell key="S2L" fill={THEME.error} />,
                              <Cell key="L3" fill={THEME.success} />
                            ]}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Consumption by Type */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Consumption by Type</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareConsumptionByTypeData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          >
                            {prepareConsumptionByTypeData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={THEME.chartColors[index % THEME.chartColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${formatNumber(value)} m³`, '']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Losing Zones */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Top Losing Zones</h3>
                    <div className="space-y-4">
                      {calculatedMetrics.topLosingZones.map((zone, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-32 flex-shrink-0">
                            <span className="text-sm font-medium text-gray-900">{zone.name}</span>
                          </div>
                          <div className="flex-1 mx-4">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="h-2.5 rounded-full" 
                                style={{ 
                                  width: `${Math.min(zone.lossPercentage * 2, 100)}%`,
                                  backgroundColor: getLossStatusColor(zone.lossPercentage)
                                }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-20 flex-shrink-0 text-right">
                            <span className="text-sm font-medium" style={{ color: getLossStatusColor(zone.lossPercentage) }}>
                              {formatPercentage(zone.lossPercentage)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Loss Trend */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Loss Trend ({selectedYear})</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={calculateLossTrend()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis tickFormatter={(value) => `${value}%`} />
                          <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, '']} />
                          <Legend />
                          <Line type="monotone" dataKey="totalLossPct" name="Total Loss %" stroke={THEME.error} activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="stage1LossPct" name="Stage 1 Loss %" stroke={THEME.warning} />
                          <Line type="monotone" dataKey="stage2LossPct" name="Stage 2 Loss %" stroke={THEME.secondary} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Zone Details Tab Content */}
            {activeTab === 'zone-details' && (
              <div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Zone Details: {selectedZone.replace('Zone_', 'Zone ').replace('_', ' ')}</h2>
                      <p className="text-sm text-gray-500 mt-1">Detailed analysis of water consumption and loss for the selected zone</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search meters..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pl-10"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Zone KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <KPI_Card
                      title="Zone Bulk Supply"
                      value={formatNumber(calculatedMetrics.zoneMetrics[selectedZone]?.l2Bulk || 0)}
                      unit="m³"
                      icon={<Droplet size={20} className="text-blue-500" />}
                      trend={null}
                      trendText={null}
                      color="blue"
                    />
                    <KPI_Card
                      title="Zone Consumption"
                      value={formatNumber(calculatedMetrics.zoneMetrics[selectedZone]?.l3Sum || 0)}
                      unit="m³"
                      icon={<Check size={20} className="text-green-500" />}
                      trend={null}
                      trendText={null}
                      color="green"
                    />
                    <KPI_Card
                      title="Zone Loss"
                      value={formatNumber(calculatedMetrics.zoneMetrics[selectedZone]?.loss || 0)}
                      unit="m³"
                      icon={<Percent size={20} className="text-red-500" />}
                      trend={calculatedMetrics.zoneMetrics[selectedZone]?.lossPercentage || 0}
                      trendText={formatPercentage(calculatedMetrics.zoneMetrics[selectedZone]?.lossPercentage || 0)}
                      color={getLossStatusColor(calculatedMetrics.zoneMetrics[selectedZone]?.lossPercentage || 0)}
                      statusText={getLossStatusText(calculatedMetrics.zoneMetrics[selectedZone]?.lossPercentage || 0)}
                    />
                  </div>

                  {/* Zone Meters Table */}
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Individual Meters in {selectedZone.replace('Zone_', 'Zone ').replace('_', ' ')}</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meter Label</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account #</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Meter</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Consumption (m³)</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredZoneMeters.map((meter, index) => (
                            <tr key={index} className={meter.acctNum === '4300322' ? 'bg-red-50' : ''}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{meter.meterLabel}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meter.acctNum}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meter.type}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meter.parentMeterLabel}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                                {meter.acctNum === '4300322' ? (
                                  <span className="text-red-500 font-medium">{formatNumber(meter[selectedPeriod])} (excluded)</span>
                                ) : (
                                  formatNumber(meter[selectedPeriod])
                                )}
                              </td>
                            </tr>
                          ))}
                          {filteredZoneMeters.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                No meters found for this zone or search criteria.
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-900">Total Consumption:</td>
                            <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                              {formatNumber(calculatedMetrics.zoneMetrics[selectedZone]?.l3Sum || 0)} m³
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Type Details Tab Content */}
            {activeTab === 'type-details' && (
              <div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Type Details: {selectedType}</h2>
                      <p className="text-sm text-gray-500 mt-1">Analysis of water consumption by property type</p>
                    </div>
                  </div>

                  {/* Type Consumption Chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Consumption by Type</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={prepareConsumptionByTypeData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            >
                              {prepareConsumptionByTypeData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={THEME.chartColors[index % THEME.chartColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${formatNumber(value)} m³`, '']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Consumption by Zone</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={getConsumptionByZoneData()}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} />
                            <Tooltip formatter={(value) => [`${formatNumber(value)} m³`, '']} />
                            <Legend />
                            <Bar dataKey="value" name="Consumption (m³)" fill={THEME.accent} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Type Details Table */}
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Consumption Details by Type</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Consumption (m³)</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Object.entries(calculatedMetrics.consumptionByType || {}).map(([type, value], index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatNumber(value)} m³</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                {formatPercentage(value / calculatedMetrics.totalL3Volume * 100)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">Total:</td>
                            <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                              {formatNumber(calculatedMetrics.totalL3Volume)} m³
                            </td>
                            <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">100%</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trends Tab Content */}
            {activeTab === 'trends' && (
              <div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Water Consumption & Loss Trends</h2>
                      <p className="text-sm text-gray-500 mt-1">Analysis of water consumption and loss trends over time</p>
                    </div>
                  </div>

                  {/* Trends Charts */}
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Loss Percentage Trend ({selectedYear})</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={calculateLossTrend()}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis tickFormatter={(value) => `${value}%`} />
                            <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, '']} />
                            <Legend />
                            <Line type="monotone" dataKey="totalLossPct" name="Total Loss %" stroke={THEME.error} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="stage1LossPct" name="Stage 1 Loss %" stroke={THEME.warning} />
                            <Line type="monotone" dataKey="stage2LossPct" name="Stage 2 Loss %" stroke={THEME.secondary} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Volume Trend by Level ({selectedYear})</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={calculateLossTrend().map(item => ({
                              period: item.period,
                              L1: processedData.find(row => row.label === 'L1')?.[`${item.period}-${selectedYear.substring(2)}`] || 0,
                              L2: processedData.filter(row => row.label === 'L2').reduce((sum, m) => sum + (m[`${item.period}-${selectedYear.substring(2)}`] || 0), 0) +
                                  processedData.filter(row => row.label === 'DC' && row.parentMeterLabel === processedData.find(r => r.label === 'L1')?.meterLabel).reduce((sum, m) => sum + (m[`${item.period}-${selectedYear.substring(2)}`] || 0), 0),
                              L3: (processedData.filter(row => row.label === 'L3').reduce((sum, m) => sum + (m[`${item.period}-${selectedYear.substring(2)}`] || 0), 0) - 
                                  (processedData.find(row => row.acctNum === '4300322')?.[`${item.period}-${selectedYear.substring(2)}`] || 0)) +
                                  processedData.filter(row => row.label === 'DC').reduce((sum, m) => sum + (m[`${item.period}-${selectedYear.substring(2)}`] || 0), 0)
                            }))}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${formatNumber(value)} m³`, '']} />
                            <Legend />
                            <Bar dataKey="L1" name="L1 Supply" fill={THEME.accent} />
                            <Bar dataKey="L2" name="L2 Volume" fill={THEME.secondary} />
                            <Bar dataKey="L3" name="L3 Volume" fill={THEME.success} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab Content */}
            {activeTab === 'settings' && (
              <div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
                      <p className="text-sm text-gray-500 mt-1">Configure water system dashboard settings</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Data Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Data Source</label>
                          <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                            <option>CSV Files</option>
                            <option>API Endpoint</option>
                            <option>Database</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Data Refresh Interval</label>
                          <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                            <option>Manual Only</option>
                            <option>Every Hour</option>
                            <option>Every 6 Hours</option>
                            <option>Daily</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Display Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Default Year</label>
                          <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                            <option>2025</option>
                            <option>2024</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Default Month</label>
                          <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                            <option>January</option>
                            <option>February</option>
                            <option>March</option>
                            <option>April</option>
                            <option>May</option>
                            <option>June</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Default Zone</label>
                          <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                            {[...new Set(processedData.filter(m => m.zone && m.zone !== 'Unknown').map(m => m.zone))].map(zone => (
                              <option key={zone} value={zone}>{zone.replace('Zone_', 'Zone ').replace('_', ' ')}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Threshold Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Warning Threshold (%)</label>
                          <input type="number" defaultValue="10" min="0" max="100" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Critical Threshold (%)</label>
                          <input type="number" defaultValue="20" min="0" max="100" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Excluded Meters</h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input type="checkbox" id="exclude-4300322" defaultChecked className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                          <label htmlFor="exclude-4300322" className="ml-2 block text-sm text-gray-900">
                            Exclude meter 4300322 (Z3-74(3) Building)
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="add-new-exclusion" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                          <label htmlFor="add-new-exclusion" className="ml-2 block text-sm text-gray-900">
                            Add new exclusion
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="pt-5">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Reset to Defaults
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveSettings}
                          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <SettingsIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                          Save Settings
                        </button>
                      </div>
                      {settingsSaved && (
                        <div className="mt-3 text-sm text-green-600 flex items-center">
                          <Check size={16} className="mr-1" />
                          Settings saved successfully
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};


// --- Reusable KPI Card Component ---
const KPI_Card = ({ title, value, unit, icon, trend, trendText, color, statusText, description }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="mt-1 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            <p className="ml-1 text-sm font-medium text-gray-500">{unit}</p>
          </div>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        <div className="p-2 bg-gray-50 rounded-md">{icon}</div>
      </div>
      {trend !== null && (
        <div className="mt-4">
          <div className="flex items-center">
            <div className="flex-1 h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${Math.min(trend * 2, 100)}%`,
                  backgroundColor: color
                }}
              ></div>
            </div>
            <span className="ml-2 text-sm font-medium" style={{ color }}>
              {trendText}
            </span>
          </div>
          {statusText && (
            <p className="mt-1 text-xs" style={{ color }}>
              {statusText}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MuscatBayWaterSystem;
