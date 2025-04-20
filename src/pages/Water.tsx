import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, ReferenceLine,
  ComposedChart, Label // Imported Label for custom labels
} from 'recharts';
// Import lucide-react icons
import {
  LayoutDashboard, Droplet, TrendingUp, TrendingDown, Map, BarChart3, PieChart as PieChartIcon,
  AlertTriangle, Building, Download, Moon, Sun, Settings, Home, Filter, CalendarDays, CheckCircle, XCircle, MinusCircle, Clock, Split, Network, UploadCloud, FileText, UserCog // Added UploadCloud, FileText, UserCog
} from 'lucide-react';

// --- Local Storage Key ---
const LOCAL_STORAGE_KEY = 'uploadedDashboardData';

// --- Sample Data ---
// Initial sample data for first load (used only if nothing in localStorage)
const sampleCSVData = `Label\tMeter Label\tAcct #\tZone\tType\tParent Meter\tJan-24\tFeb-24\tMar-24\tApr-24\tMay-24\tJun-24\tJul-24\tAug-24\tSep-24\tOct-24\tNov-24\tDec-24\tJan-25\tFeb-25\tMar-25
L1\tMAIN BULK METER L1\t10000\t\tBULK\t\t10000\t10100\t10200\t10300\t10400\t10500\t10600\t10700\t10800\t10900\t11000\t11100\t11200\t11300\t11500
L2\tZONE A BULK L2\t20001\tZone A\tBULK\tMAIN BULK METER L1\t3000\t3050\t3100\t3150\t3200\t3250\t3300\t3350\t3400\t3450\t3500\t3550\t3600\t3650\t3700
L2\tZONE B BULK L2\t20002\tZone B\tBULK\tMAIN BULK METER L1\t4000\t4040\t4080\t4120\t4160\t4200\t4240\t4280\t4320\t4360\t4400\t4440\t4480\t4520\t4600
L2\tZONE C BULK L2\t20003\tZone C\tBULK\tMAIN BULK METER L1\t2500\t2520\t2540\t2560\t2580\t2600\t2620\t2640\t2660\t2680\t2700\t2720\t2740\t2760\t2800
DC\tDirect Connection 1\t25001\t\tDirect\tMAIN BULK METER L1\t400\t400\t400\t400\t400\t400\t400\t400\t400\t400\t400\t400\t400\t400\t500
L3\tMeter A1\t30001\tZone A\tResidential (Villa)\tZONE A BULK L2\t500\t510\t520\t530\t540\t550\t560\t570\t580\t590\t600\t610\t620\t630\t640
L3\tMeter A2\t30002\tZone A\tResidential (Apart)\tZONE A BULK L2\t1000\t1010\t1020\t1030\t1040\t1050\t1060\t1070\t1080\t1090\t1100\t1110\t1120\t1130\t1150
L3\tMeter A3\t30003\tZone A\tRetail\tZONE A BULK L2\t300\t305\t310\t315\t320\t325\t330\t335\t340\t345\t350\t355\t360\t365\t370
L3\tMeter B1\t30004\tZone B\tResidential (Villa)\tZONE B BULK L2\t1500\t1510\t1520\t1530\t1540\t1550\t1560\t1570\t1580\t1590\t1600\t1610\t1620\t1630\t1650
L3\tMeter B2\t30005\tZone B\tIRR_Servies\tZONE B BULK L2\t1200\t1210\t1220\t1230\t1240\t1250\t1260\t1270\t1280\t1290\t1300\t1310\t1320\t1330\t1350
L3\tMeter C1\t30006\tZone C\tResidential (Apart)\tZONE C BULK L2\t800\t810\t820\t830\t840\t850\t860\t870\t880\t890\t900\t910\t920\t930\t950
L3\tMeter C2\t30007\tZone C\tRetail\tZONE C BULK L2\t600\t605\t610\t615\t620\t625\t630\t635\t640\t645\t650\t655\t660\t665\t680
DC\tDirect Connection 2\t4300322\t\tDirect\t\t100\t100\t100\t100\t100\t100\t100\t100\t100\t100\t100\t100\t100\t100\t100
`;

// --- Custom Components ---

// Enhanced Circular Progress with Gradient (No changes)
const CircularProgress = ({ value, color = "text-indigo-500", size = 'md', label }) => {
  const sizeClasses = { sm: "w-16 h-16", md: "w-24 h-24", lg: "w-32 h-32" };
  const radius = size === 'sm' ? 28 : (size === 'md' ? 42 : 56);
  const strokeWidth = size === 'sm' ? 6 : (size === 'md' ? 8 : 10);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  const colorName = color.split('-')[1] || 'indigo';
  const gradientId = `grad-${colorName}`;

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
      <svg className="w-full h-full transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" className={`stop-color-${colorName}-400`} />
            <stop offset="100%" className={`stop-color-${colorName}-600`} />
          </linearGradient>
        </defs>
        <circle className="text-gray-200 dark:text-gray-700" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx="50%" cy="50%" />
        <circle strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" stroke={`url(#${gradientId})`} fill="transparent" r={radius} cx="50%" cy="50%" style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className={`text-xl md:text-2xl font-bold ${color}`}>{value}%</span>
        {label && <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">{label}</span>}
      </div>
    </div>
  );
};


// Enhanced Card Component (No changes needed for this request)
const Card = ({ title, value, unit, trend, icon, className = '', lossPercent, secondaryValue, secondaryUnit }) => {
  const trendColor = trend > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400';
  const TrendIcon = trend > 0 ? TrendingUp : TrendingDown;
  // Default classes if not overridden by specific loss card classes
  const defaultClasses = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';

  return (
    // Apply passed className, falling back to default if className doesn't specify bg/border
    <div className={`rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300 border ${className || defaultClasses}`}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        {icon && <div className="text-indigo-500 dark:text-indigo-400">{icon}</div>}
      </div>
      <div className="flex items-baseline mb-1">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</h3>
        {unit && <span className="ml-1.5 text-lg text-gray-500 dark:text-gray-400">{unit}</span>}
      </div>
      {secondaryValue !== undefined && secondaryValue !== null && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            ({secondaryValue} {secondaryUnit})
        </p>
      )}
      {trend !== null && trend !== undefined && (
        <div className={`text-xs flex items-center ${trendColor}`}>
          <TrendIcon size={14} className="mr-1" />
          <span>{Math.abs(trend)}% {trend > 0 ? 'Increase' : 'Decrease'}</span>
          <span className="ml-1 text-gray-400 dark:text-gray-500">vs last period</span>
        </div>
      )}
    </div>
  );
};

// Enhanced Stat Card Component (No changes)
const StatCard = ({ title, value, icon, colorClass = "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400" }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex items-center hover:shadow-lg transition-shadow duration-300">
    <div className={`rounded-full p-3 ${colorClass}`}>
      {icon}
    </div>
    <div className="ml-4">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  </div>
);

// --- Custom Label for Charts ---
const CustomizedLabel = (props) => {
    const { x, y, stroke, value, index } = props;
    // Only render label for specific points to avoid clutter, e.g., every 3rd point
    if (index % 3 !== 0 || value === null || value === undefined) {
       return null;
    }

    return (
        <foreignObject x={x - 20} y={y - 25} width="40" height="20">
            <div xmlns="http://www.w3.org/1999/xhtml"
                 className="px-1.5 py-0.5 rounded text-center shadow bg-gray-800 bg-opacity-70 dark:bg-gray-100 dark:bg-opacity-70">
                <span className="text-[10px] font-medium text-white dark:text-gray-900">
                    {`${value}%`}
                </span>
            </div>
        </foreignObject>
    );
};


// --- Main Dashboard Component ---

const DashboardApp = () => {
  // Core state
  const [data, setData] = useState(null); // Holds the processed data object
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedZone, setSelectedZone] = useState('All Zones');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // General data processing/loading error

  // UI state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Admin Upload state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(''); // e.g., 'success', 'error', ''
  const [uploadError, setUploadError] = useState(''); // Specific error message for upload
  const fileInputRef = useRef(null); // Ref for the file input

  // Dark Mode Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Data Fetching and Processing Effect (Loads initial data from localStorage or sample)
  useEffect(() => {
    const loadInitialData = () => {
      let initialDataContent = sampleCSVData; // Default to sample data
      let loadedFromStorage = false;
      try {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
          initialDataContent = storedData; // Use stored data if available
          loadedFromStorage = true;
          console.log("Loaded data from localStorage.");
        }
      } catch (storageError) {
        console.error("Error reading from localStorage:", storageError);
        // Proceed with sample data if localStorage fails
      }

      try {
        setIsLoading(true);
        setError(null);
        const processedData = processDataFromCSV(initialDataContent);
        setData(processedData);
        if (processedData.periods && processedData.periods.length > 0) {
          setSelectedPeriod(processedData.periods[processedData.periods.length - 1]);
        }
        setIsLoading(false);
        if (loadedFromStorage) {
            // Optionally notify user that stored data was loaded
            // setUploadStatus('info');
            // setUploadError('Loaded previously uploaded data from browser storage.');
        }
      } catch (err) {
        console.error('Error processing initial data:', err);
        setError(`Failed to load initial dashboard data. ${err.message}`);
        setIsLoading(false);
         // If stored data failed to parse, clear it to prevent future errors
         if (loadedFromStorage) {
            try {
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                console.log("Removed invalid data from localStorage.");
            } catch (removeError) {
                console.error("Error removing invalid data from localStorage:", removeError);
            }
         }
      }
    };
    loadInitialData();
  }, []); // Run only once on mount


  // Process the CSV data (More robust error handling)
  const processDataFromCSV = (csvText) => {
    if (!csvText || typeof csvText !== 'string') {
        throw new Error("No data provided to process.");
    }
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
        throw new Error("Data must have at least a header and one data row.");
    }

    const headers = lines[0].split('\t').map(h => h.trim());
    const requiredHeaders = ['Label', 'Meter Label', 'Acct #', 'Zone', 'Type', 'Parent Meter'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}. Please ensure the file is tab-separated.`);
    }

    // --- (Rest of the processing logic remains the same as previous version) ---
    const labelIndex = headers.indexOf('Label');
    const meterLabelIndex = headers.indexOf('Meter Label');
    const acctNumIndex = headers.indexOf('Acct #');
    const zoneIndex = headers.indexOf('Zone');
    const typeIndex = headers.indexOf('Type');
    const parentMeterIndex = headers.indexOf('Parent Meter');

    const periodIndices = {};
    const periods = [];
    headers.forEach((header, index) => {
      if (/^\w{3}-\d{2}$/.test(header)) {
        periodIndices[header] = index;
        periods.push(header);
      }
    });

    if (periods.length === 0) {
        throw new Error("No valid period columns (e.g., 'Jan-24') found in headers.");
    }
    periods.sort((a, b) => {
        const [m1, y1] = a.split('-'); const [m2, y2] = b.split('-');
        const yearDiff = parseInt(y1) - parseInt(y2);
        if (yearDiff !== 0) return yearDiff;
        const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return monthOrder.indexOf(m1) - monthOrder.indexOf(m2);
    });

    const meters = [];
    const processingErrors = []; // Collect row-specific errors
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split('\t').map(v => v.trim());

      if (values.length !== headers.length) {
          processingErrors.push(`Row ${i + 1}: Incorrect number of columns (${values.length} found, ${headers.length} expected).`);
          continue; // Skip this row
      }

      // Validate required fields basic presence (can add more specific validation)
      if (!values[labelIndex] || !values[meterLabelIndex]) {
          processingErrors.push(`Row ${i + 1}: Missing required 'Label' or 'Meter Label'.`);
          continue;
      }

      const isBulkMeter = values[meterLabelIndex]?.includes('Bulk') || values[typeIndex]?.includes('BULK') || values[labelIndex] === 'L1' || values[labelIndex] === 'L2';
      const hasAllZeroReadings = Object.values(periodIndices).every(index => parseFloat(values[index] || '0') === 0);

      if (hasAllZeroReadings && !isBulkMeter && values[labelIndex] !== 'DC') continue;

      const meter = {
        meterLabel: values[meterLabelIndex], acctNum: values[acctNumIndex] || 'N/A', zone: values[zoneIndex] || 'Unassigned',
        type: values[typeIndex] || 'Unknown', parentMeter: values[parentMeterIndex] || null, label: values[labelIndex], readings: {}
      };

      let rowHasInvalidReading = false;
      Object.entries(periodIndices).forEach(([period, index]) => {
        const rawValue = values[index];
        let reading = parseFloat(rawValue);

        // Check if reading is a valid number, otherwise treat as 0 and log warning
        if (isNaN(reading)) {
            if (rawValue && rawValue.trim() !== '') { // Only warn if it wasn't empty
                 processingErrors.push(`Row ${i + 1}, Meter ${meter.meterLabel}, Period ${period}: Invalid reading '${rawValue}', treated as 0.`);
            }
            reading = 0;
        }

        // Handle potential zero readings for bulk meters
        if (reading <= 0 && isBulkMeter) {
          const periodKeys = periods; const currentIndex = periodKeys.indexOf(period);
          const prevReading = currentIndex > 0 ? parseFloat(values[periodIndices[periodKeys[currentIndex - 1]]] || '0') : 0;
          const nextReading = currentIndex < periodKeys.length - 1 ? parseFloat(values[periodIndices[periodKeys[currentIndex + 1]]] || '0') : 0;
          if (prevReading > 0 && nextReading > 0) reading = (prevReading + nextReading) / 2;
          else if (prevReading > 0) reading = prevReading;
          else if (nextReading > 0) reading = nextReading;
          else { const firstNonZero = periodKeys.slice(0, currentIndex).reverse().map(p => parseFloat(values[periodIndices[p]] || '0')).find(r => r > 0); reading = firstNonZero || 1; }
        }
        meter.readings[period] = Math.max(0, reading);
      });
      meters.push(meter);
    }

     // Report processing errors if any occurred
    if (processingErrors.length > 0) {
        console.warn("Data processing warnings:\n" + processingErrors.join("\n"));
        // Optionally, throw an error or return warnings to UI
        // throw new Error(`Data processing issues found. First issue: ${processingErrors[0]}`);
    }

    // Calculate stats for each period
    const stats = {};
    periods.forEach(period => {
      const l1Meter = meters.find(m => m.label === 'L1');
      const l1Supply = l1Meter ? l1Meter.readings[period] : 0;
      const l2Meters = meters.filter(m => m.label === 'L2');
      const dcMetersOnL1 = meters.filter(m => m.label === 'DC' && m.parentMeter === l1Meter?.meterLabel);
      const l2Volume = l2Meters.reduce((sum, m) => sum + (m.readings[period] || 0), 0) + dcMetersOnL1.reduce((sum, m) => sum + (m.readings[period] || 0), 0);
      const l3Meters = meters.filter(m => m.label === 'L3' && m.acctNum !== '4300322');
      const allDcMeters = meters.filter(m => m.label === 'DC');
      const l3Volume = l3Meters.reduce((sum, m) => sum + (m.readings[period] || 0), 0) + allDcMeters.reduce((sum, m) => sum + (m.readings[period] || 0), 0);
      const stage1Loss = l1Supply > 0 ? Math.max(0, l1Supply - l2Volume) : 0;
      const stage2Loss = l2Volume > 0 ? Math.max(0, l2Volume - l3Volume) : 0;
      const totalLoss = l1Supply > 0 ? Math.max(0, l1Supply - l3Volume) : 0;
      const stage1LossPercent = l1Supply > 0 ? (stage1Loss / l1Supply) * 100 : 0;
      const stage2LossPercent = l2Volume > 0 ? (stage2Loss / l2Volume) * 100 : 0;
      const totalLossPercent = l1Supply > 0 ? (totalLoss / l1Supply) * 100 : 0;
      const zoneStats = {};
      const uniqueZones = [...new Set(meters.filter(m => m.zone && m.zone !== 'Unassigned').map(m => m.zone))];
      uniqueZones.forEach(zone => {
        const zoneBulkMeter = meters.find(m => m.label === 'L2' && m.zone === zone);
        const zoneBulkReading = zoneBulkMeter ? (zoneBulkMeter.readings[period] || 0) : 0;
        const zoneL3Meters = meters.filter(m => m.label === 'L3' && m.zone === zone && m.acctNum !== '4300322');
        const zoneDCMeters = meters.filter(m => m.label === 'DC' && m.zone === zone);
        const zoneL3Sum = zoneL3Meters.reduce((sum, m) => sum + (m.readings[period] || 0), 0) + zoneDCMeters.reduce((sum, m) => sum + (m.readings[period] || 0), 0);
        const zoneLoss = zoneBulkReading > 0 ? Math.max(0, zoneBulkReading - zoneL3Sum) : 0;
        const zoneLossPercent = zoneBulkReading > 0 ? (zoneLoss / zoneBulkReading) * 100 : 0;
        zoneStats[zone] = { bulkReading: zoneBulkReading, l3Sum: zoneL3Sum, loss: zoneLoss, lossPercent: zoneLossPercent, meterCount: zoneL3Meters.length + zoneDCMeters.length };
      });
      const typeConsumption = {};
      const uniqueTypes = [...new Set(meters.filter(m => m.type && m.type !== 'Unknown' && m.type !== 'BULK').map(m => m.type))];
      uniqueTypes.forEach(type => {
        const typeMeters = meters.filter(m => (m.label === 'L3' || m.label === 'DC') && m.type === type && m.acctNum !== '4300322');
        const typeVolume = typeMeters.reduce((sum, m) => sum + (m.readings[period] || 0), 0);
        typeConsumption[type] = typeVolume;
      });
      stats[period] = { l1Supply, l2Volume, l3Volume, stage1Loss, stage2Loss, totalLoss, stage1LossPercent, stage2LossPercent, totalLossPercent, zoneStats, typeConsumption };
    });

    return { meters, periods, stats, uniqueZones: [...new Set(meters.filter(m => m.zone && m.zone !== 'Unassigned').map(m => m.zone))], uniqueTypes: [...new Set(meters.filter(m => m.type && m.type !== 'Unknown' && m.type !== 'BULK').map(m => m.type))] };
    // --- (End of processing logic) ---
  };

  // --- Admin Upload Handlers ---
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Basic validation for TSV/TXT MIME types (adjust as needed)
      if (file.type === 'text/tab-separated-values' || file.type === 'text/plain' || file.name.endsWith('.tsv') || file.name.endsWith('.txt')) {
         setUploadedFile(file);
         setUploadStatus(''); // Clear previous status
         setUploadError('');
      } else {
          setUploadedFile(null);
          setUploadStatus('error');
          setUploadError('Invalid file type. Please upload a .tsv or .txt file.');
      }
    }
  };

  const handleFileUpload = () => {
    if (!uploadedFile) {
      setUploadError('Please select a file first.');
      setUploadStatus('error');
      return;
    }

    setUploadStatus('loading'); // Indicate processing
    setUploadError('');

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const fileContent = event.target.result;
        const processedData = processDataFromCSV(fileContent); // Process the uploaded content

        // Update the main data state
        setData(processedData);

        // Update selected period to the latest from the new data
        if (processedData.periods && processedData.periods.length > 0) {
          setSelectedPeriod(processedData.periods[processedData.periods.length - 1]);
        } else {
            // Handle case where new data might have no periods (edge case)
            setSelectedPeriod('');
        }

        // Save the raw file content to localStorage for persistence
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, fileContent);
            console.log("Saved uploaded data to localStorage.");
            setUploadStatus('success'); // Set success only after saving
        } catch (storageError) {
            console.error("Error saving data to localStorage:", storageError);
            setUploadStatus('error');
            // Check for QuotaExceededError specifically
            if (storageError.name === 'QuotaExceededError') {
                 setUploadError('Error: Could not save data. Browser storage limit exceeded. Data will be used for this session only.');
            } else {
                 setUploadError('Error: Could not save data to browser storage. Data will be used for this session only.');
            }
            // Data is still loaded in `setData` above, so the session will use it.
        }

        setUploadedFile(null); // Clear the selected file
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Clear the file input visually
        }

      } catch (err) {
        console.error('Error processing uploaded file:', err);
        setUploadStatus('error');
        setUploadError(`Error processing file: ${err.message}`);
        // Clear potentially bad data from storage if processing failed
        try {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch (removeError) {
             console.error("Error removing item from localStorage after processing error:", removeError);
        }
      }
    };

    reader.onerror = (event) => {
      console.error('Error reading file:', event.target.error);
      setUploadStatus('error');
      setUploadError('Error reading the selected file.');
    };

    reader.readAsText(uploadedFile); // Read the file as text
  };


  // --- Loading and Error States ---
  if (isLoading) {
    return ( /* Loading spinner - unchanged */
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 dark:text-gray-300">Loading Water Analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data || !selectedPeriod || !data.stats[selectedPeriod]) {
     // Check if data exists but selectedPeriod is invalid before showing full error
     if (data && data.periods && data.periods.length > 0 && !data.stats[selectedPeriod]) {
         // Attempt to reset to the latest valid period if current one is bad
         const latestPeriod = data.periods[data.periods.length - 1];
         if (data.stats[latestPeriod]) {
             setSelectedPeriod(latestPeriod);
             // Re-render will happen, no need to show error yet
             return null; // Or a minimal loading indicator
         }
     }
     // Show error if data is truly missing or resetting period didn't work
    return ( /* Error display - unchanged */
      <div className="min-h-screen bg-red-50 dark:bg-red-900/50 flex items-center justify-center p-4">
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md">
           <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
           <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">Dashboard Error</h2>
           <p className="text-gray-600 dark:text-gray-300">{error || 'Could not load or process dashboard data for the selected period. Please check the data source or try again later.'}</p>
        </div>
      </div>
      );
  }

  // --- Data Preparation for Rendering (Recalculate based on current data state) ---
  const currentStats = data.stats[selectedPeriod];
  const previousPeriodIndex = data.periods.indexOf(selectedPeriod) - 1;
  const previousPeriod = previousPeriodIndex >= 0 ? data.periods[previousPeriodIndex] : null;
  const previousStats = previousPeriod ? data.stats[previousPeriod] : null;

  // Calculate trends safely
  const calculateTrend = (current, previous) => {
    if (previous === null || previous === undefined || previous === 0) return null;
    if (current === null || current === undefined) return null;
    const trend = ((current - previous) / previous) * 100;
    return parseFloat(trend.toFixed(1));
  };

  const l1Trend = calculateTrend(currentStats.l1Supply, previousStats?.l1Supply);
  const l2Trend = calculateTrend(currentStats.l2Volume, previousStats?.l2Volume);
  const l3Trend = calculateTrend(currentStats.l3Volume, previousStats?.l3Volume);
  const stage1LossTrend = calculateTrend(currentStats.stage1LossPercent, previousStats?.stage1LossPercent);
  const stage2LossTrend = calculateTrend(currentStats.stage2LossPercent, previousStats?.stage2LossPercent);
  const totalLossTrend = calculateTrend(currentStats.totalLossPercent, previousStats?.totalLossPercent);

  // Prepare data for charts
  const consumptionByTypeData = Object.entries(currentStats.typeConsumption)
    .map(([type, volume]) => ({ name: type, value: volume }))
    .filter(item => item.value > 0).sort((a, b) => b.value - a.value);
  const zonePerformanceData = Object.entries(currentStats.zoneStats)
    .map(([zone, stats]) => ({ name: zone, loss: parseFloat(stats.lossPercent.toFixed(1)), volume: stats.bulkReading }))
    .filter(item => item.volume > 0).sort((a, b) => b.loss - a.loss).slice(0, 5);
  const historicalData = data.periods.map(period => ({ name: period, supply: data.stats[period]?.l1Supply || 0, consumption: data.stats[period]?.l3Volume || 0, loss: parseFloat(data.stats[period]?.totalLossPercent?.toFixed(1) || 0) }));
  const zoneLossData = Object.entries(currentStats.zoneStats)
    .map(([zone, stats]) => ({ zone, lossPercent: parseFloat(stats.lossPercent.toFixed(1)), bulkVolume: stats.bulkReading, consumedVolume: stats.l3Sum, lossVolume: stats.loss }))
    .filter(item => item.bulkVolume > 0).sort((a, b) => b.lossPercent - a.lossPercent);

  // Prepare zone details
  const selectedZoneStats = selectedZone === 'All Zones' ? null : currentStats.zoneStats[selectedZone];
  const zoneMeters = selectedZone === 'All Zones' ? [] : data.meters.filter(m => m.zone === selectedZone && (m.label === 'L3' || m.label === 'DC')).map(m => ({ label: m.meterLabel, type: m.type, reading: m.readings[selectedPeriod] || 0 })).sort((a, b) => b.reading - a.reading);
  const zoneConsumptionByTypeData = selectedZone === 'All Zones' || !selectedZoneStats ? [] : Object.entries(data.meters.filter(m => m.zone === selectedZone && (m.label === 'L3' || m.label === 'DC')).reduce((acc, meter) => { const type = meter.type || 'Unknown'; const reading = meter.readings[selectedPeriod] || 0; if (!acc[type]) acc[type] = 0; acc[type] += reading; return acc; }, {})).map(([type, volume]) => ({ name: type, value: volume })).filter(item => item.value > 0).sort((a, b) => b.value - a.value);

  // Modern color palette & helpers
  const COLORS = { indigo: '#4f46e5', sky: '#0ea5e9', emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e', violet: '#8b5cf6', cyan: '#06b6d4', lime: '#84cc16', blue: '#3b82f6', teal: '#14b8a6' };
  const CHART_COLORS = Object.values(COLORS);
  const renderGradient = (id, color1, color2) => ( <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color1} stopOpacity={0.8}/><stop offset="95%" stopColor={color2 || color1} stopOpacity={0.3}/></linearGradient> );
  const totalConsumption = currentStats.l3Volume;
  const formatNumber = (num) => num?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '0';

  // --- Render JSX ---
  return (
    <div className={`min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300`}>
      {/* Header - MODIFIED Background and Text Colors */}
       <header className="bg-[#4E4456] shadow-sm sticky top-0 z-10 border-b border-gray-600"> {/* Applied custom bg, adjusted border */}
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          {/* Logo and Title - Adjusted Text Colors */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center shadow"> <Droplet size={18} className="text-white" /> </div>
            {/* Changed text to white/light gray for contrast */}
            <h1 className="text-xl font-semibold text-white">Water Analytics</h1>
            <span className="hidden md:inline text-gray-300 text-sm">Muscat Bay</span>
          </div>
          {/* Controls - Adjusted Icon/Button Colors */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Period Selector - Adjusted for dark header */}
            <div className="relative">
              <CalendarDays size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="appearance-none bg-white/10 text-white pl-9 pr-8 py-1.5 border border-gray-500 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 placeholder-gray-400" aria-label="Select Period" >
                {data.periods.map(period => ( <option key={period} value={period} className="text-black">{period}</option> ))} {/* Option text might need styling if dropdown bg is dark */}
              </select>
              <Filter size={14} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {/* Dark Mode Toggle - Adjusted for dark header */}
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-md text-gray-300 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 focus:ring-offset-[#4E4456] transition-colors duration-200" aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"} >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {/* Export Button - Adjusted for dark header */}
            <button className="hidden sm:inline-flex items-center bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-md shadow-sm text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 focus:ring-offset-[#4E4456]" onClick={() => alert('Export functionality not implemented yet.')} >
              <Download size={16} className="mr-1.5" /> Export
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - (Unchanged) */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-4 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'zones', label: 'Zone Analysis', icon: Map },
            { id: 'losses', label: 'Loss Management', icon: TrendingDown },
            { id: 'consumption', label: 'Consumption', icon: BarChart3 },
            { id: 'admin', label: 'Admin Upload', icon: UserCog },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-3 py-3 text-sm font-medium border-b-2 focus:outline-none transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:text-indigo-400 dark:hover:border-indigo-600'
              }`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <tab.icon size={16} className="mr-1.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Overview Tab (Loss card styling updated, chart labels added) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
             {/* Row 1: L1, L2, L3 Volumes */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card title="L1: Total Supply" value={formatNumber(currentStats.l1Supply)} unit="m³" trend={l1Trend} icon={<Droplet size={20} />} className="border-blue-200 dark:border-blue-700 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/30" />
               <Card title="L2: Delivered to Zones/DC" value={formatNumber(currentStats.l2Volume)} unit="m³" trend={l2Trend} icon={<Split size={20} />} className="border-sky-200 dark:border-sky-700 bg-gradient-to-br from-white to-sky-50 dark:from-gray-800 dark:to-sky-900/30" />
               <Card title="L3: Total Consumption" value={formatNumber(currentStats.l3Volume)} unit="m³" trend={l3Trend} icon={<CheckCircle size={20} />} className="border-emerald-200 dark:border-emerald-700 bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-900/30" />
             </div>
             {/* Row 2: Losses - MODIFIED to force red background */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card
                    title="Stage 1 Loss (Trunk)"
                    value={currentStats.stage1LossPercent.toFixed(1)}
                    unit="%"
                    secondaryValue={formatNumber(currentStats.stage1Loss)}
                    secondaryUnit="m³"
                    trend={stage1LossTrend}
                    icon={<TrendingDown size={20} />}
                    // Force light red background and border for loss cards
                    className="bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-700"
                 />
                <Card
                    title="Stage 2 Loss (Distribution)"
                    value={currentStats.stage2LossPercent.toFixed(1)}
                    unit="%"
                    secondaryValue={formatNumber(currentStats.stage2Loss)}
                    secondaryUnit="m³"
                    trend={stage2LossTrend}
                    icon={<TrendingDown size={20} />}
                    // Force light red background and border for loss cards
                    className="bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-700"
                 />
                <Card
                    title="Total System Loss"
                    value={currentStats.totalLossPercent.toFixed(1)}
                    unit="%"
                    secondaryValue={formatNumber(currentStats.totalLoss)}
                    secondaryUnit="m³"
                    trend={totalLossTrend}
                    icon={<XCircle size={20} />}
                    // Force light red background and border for loss cards
                    className="bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-700"
                />
             </div>
             {/* --- Rest of Overview Tab Content (Charts, Stat Cards) --- */}
             {/* Charts Row 1: Historical Trends & Consumption Pie */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Historical Trend Chart - MODIFIED with dots and labels */}
               <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
                 <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">System Performance Trends</h3>
                 <div className="h-80">
                   <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart
                       data={historicalData}
                       margin={{ top: 20, right: 5, left: 0, bottom: 5 }} // Increased top margin for labels
                     >
                       <defs>
                         {renderGradient("gradSupply", COLORS.indigo)}
                         {renderGradient("gradConsumption", COLORS.emerald)}
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb dark:stroke-gray-600" />
                       <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280', dark: { fill: '#9ca3af' } }} axisLine={false} tickLine={false} />
                       <YAxis yAxisId="left" label={{ value: 'Volume (m³)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12, fill: '#6b7280', dark: { fill: '#9ca3af' } } }} tick={{ fontSize: 11, fill: '#6b7280', dark: { fill: '#9ca3af' } }} tickFormatter={formatNumber} axisLine={false} tickLine={false} />
                       <YAxis yAxisId="right" orientation="right" label={{ value: 'Loss (%)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: 12, fill: '#6b7280', dark: { fill: '#9ca3af' } } }} domain={[0, 'dataMax + 10']} tick={{ fontSize: 11, fill: '#6b7280', dark: { fill: '#9ca3af' } }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                       <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)', dark: { backgroundColor: 'rgba(31, 41, 55, 0.9)' } }}
                          itemStyle={{ fontSize: 12, color: '#374151', dark: { color: '#d1d5db' } }}
                          labelStyle={{ fontSize: 12, fontWeight: 'bold', marginBottom: '5px', color: '#1f2937', dark: { color: '#f3f4f6' } }}
                          formatter={(value, name) => {
                            if (name === 'Loss (%)') return [`${value}%`, name];
                            return [`${formatNumber(value)} m³`, name];
                          }}
                       />
                       <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
                       <Area yAxisId="left" type="monotone" dataKey="supply" stroke={COLORS.indigo} strokeWidth={2} fillOpacity={1} fill="url(#gradSupply)" name="Supply (m³)" activeDot={{ r: 5, strokeWidth: 2, fill: '#fff' }} dot={{ r: 3, strokeWidth: 1, fill: COLORS.indigo }} />
                       <Area yAxisId="left" type="monotone" dataKey="consumption" stroke={COLORS.emerald} strokeWidth={2} fillOpacity={1} fill="url(#gradConsumption)" name="Consumption (m³)" activeDot={{ r: 5, strokeWidth: 2, fill: '#fff' }} dot={{ r: 3, strokeWidth: 1, fill: COLORS.emerald }} />
                       <Line
                           yAxisId="right"
                           type="monotone"
                           dataKey="loss"
                           stroke={COLORS.rose}
                           strokeWidth={2.5}
                           name="Loss (%)"
                           dot={{ r: 3, strokeWidth: 1, fill: COLORS.rose }} // Add dots
                           activeDot={{ r: 6, strokeWidth: 2, fill: '#fff' }}
                           label={<CustomizedLabel />} // Add custom labels
                           isAnimationActive={false} // Disable default animation when using labels for better positioning
                        />
                     </ComposedChart>
                   </ResponsiveContainer>
                 </div>
               </div>
                {/* Consumption By Type Pie Chart (unchanged) */}
               <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
                 <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Consumption Distribution by Type</h3>
                 <div className="h-80"> <ResponsiveContainer width="100%" height="100%"> <PieChart> <defs> {CHART_COLORS.map((color, index) => ( <linearGradient key={`pieGrad${index}`} id={`pieGradient${index}`} x1="0%" y1="0%" x2="100%" y2="100%"> <stop offset="0%" stopColor={color} stopOpacity={0.9}/> <stop offset="100%" stopColor={color} stopOpacity={0.6}/> </linearGradient> ))} </defs> <Pie data={consumptionByTypeData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} fill="#8884d8" dataKey="value" paddingAngle={3} labelLine={false} label={({ name, percent, value }) => `${name}: ${(percent * 100).toFixed(0)}%`} > {consumptionByTypeData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={`url(#pieGradient${index % CHART_COLORS.length})`} stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={1} /> ))} </Pie> <Tooltip formatter={(value, name, props) => [`${formatNumber(value)} m³ (${(props.payload.percent * 100).toFixed(1)}%)`, name]} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)', dark: { backgroundColor: 'rgba(31, 41, 55, 0.9)' } }} itemStyle={{ fontSize: 12, color: '#374151', dark: { color: '#d1d5db' } }} labelStyle={{ fontSize: 12, fontWeight: 'bold', marginBottom: '5px', color: '#1f2937', dark: { color: '#f3f4f6' } }} /> <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px', lineHeight: '1.5' }} /> </PieChart> </ResponsiveContainer> </div>
               </div>
             </div>
             {/* Charts Row 2: Top Loss Zones & Loss Breakdown (unchanged) */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Top 5 Zones by Loss (unchanged) */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Zones with Highest Loss (%)</h3>
                  <div className="h-80"> <ResponsiveContainer width="100%" height="100%"> <BarChart data={zonePerformanceData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }} barSize={20} > <defs> {renderGradient("lossGrad", COLORS.rose, COLORS.amber)} </defs> <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb dark:stroke-gray-600" horizontal={false}/> <XAxis type="number" domain={[0, 'dataMax + 5']} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 11, fill: '#6b7280', dark: { fill: '#9ca3af' } }} axisLine={false} tickLine={false} /> <YAxis dataKey="name" type="category" width={80} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#374151', dark: { fill: '#d1d5db' } }} /> <Tooltip formatter={(value) => [`${value}%`, 'Loss']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)', dark: { backgroundColor: 'rgba(31, 41, 55, 0.9)' } }} itemStyle={{ fontSize: 12, color: '#374151', dark: { color: '#d1d5db' } }} labelStyle={{ fontSize: 12, fontWeight: 'bold', marginBottom: '5px', color: '#1f2937', dark: { color: '#f3f4f6' } }} /> <Bar dataKey="loss" name="Loss %" fill="url(#lossGrad)" radius={[0, 4, 4, 0]} animationDuration={1200} /> <ReferenceLine x={10} stroke={COLORS.emerald} strokeDasharray="4 4" label={{ value: 'Target (10%)', position: 'insideTopRight', fill: COLORS.emerald, fontSize: 10 }} /> </BarChart> </ResponsiveContainer> </div>
                </div>
                 {/* Loss Breakdown Card (unchanged) */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex flex-col">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Loss Breakdown</h3> <div className="space-y-4 flex-grow"> <div> <div className="flex justify-between items-center mb-1"> <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Stage 1 Loss (Trunk)</span> <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{currentStats.stage1LossPercent.toFixed(1)}%</span> </div> <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"> <div className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-2.5 rounded-full" style={{ width: `${currentStats.stage1LossPercent}%`, transition: 'width 0.5s ease-in-out' }}></div> </div> <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatNumber(currentStats.stage1Loss)} m³</p> </div> <div> <div className="flex justify-between items-center mb-1"> <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Stage 2 Loss (Distribution)</span> <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">{currentStats.stage2LossPercent.toFixed(1)}%</span> </div> <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"> <div className="bg-gradient-to-r from-sky-400 to-sky-600 h-2.5 rounded-full" style={{ width: `${currentStats.stage2LossPercent}%`, transition: 'width 0.5s ease-in-out' }}></div> </div> <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatNumber(currentStats.stage2Loss)} m³</p> </div> </div> <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"> <div className="flex justify-between items-center"> <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Total System Loss:</span> <span className={`text-lg font-bold ${currentStats.totalLossPercent > 15 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}> {currentStats.totalLossPercent.toFixed(1)}% </span> </div> <p className="text-xs text-gray-500 dark:text-gray-400 text-right">{formatNumber(currentStats.totalLoss)} m³ total</p> </div>
                </div>
             </div>
             {/* Stats Cards Row (unchanged) */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <StatCard title="Active Meters" value={formatNumber(data.meters.filter(m => Object.values(m.readings).some(r => r > 0)).length)} icon={<Settings size={20} />} colorClass="bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400" />
               <StatCard title="Total Zones" value={data.uniqueZones.length} icon={<Building size={20} />} colorClass="bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-400" />
               <StatCard title="Avg. Daily Use" value={`${formatNumber(Math.round(currentStats.l3Volume / 30))} m³`} icon={<Clock size={20} />} colorClass="bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400" />
               <StatCard title="High-Loss Zones (>20%)" value={Object.values(currentStats.zoneStats).filter(zone => zone.lossPercent > 20 && zone.bulkReading > 0).length} icon={<AlertTriangle size={20} />} colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400" />
             </div>
          </div>
        )}

        {/* === RESTORED Zone Analysis Tab === */}
        {activeTab === 'zones' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Zone Analysis</h2>
              <div className="relative w-full md:w-auto">
                 <Map size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                 <select
                   value={selectedZone}
                   onChange={(e) => setSelectedZone(e.target.value)}
                   className="appearance-none w-full md:w-64 bg-gray-50 dark:bg-gray-700 pl-9 pr-8 py-2 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 dark:text-gray-200"
                   aria-label="Select Zone"
                 >
                   <option value="All Zones">All Zones Overview</option>
                   {data.uniqueZones.map(zone => (
                     <option key={zone} value={zone}>{zone}</option>
                   ))}
                 </select>
                  <Filter size={14} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
              </div>
            </div>

            {selectedZone === 'All Zones' ? (
              <div className="space-y-6">
                {/* All Zones Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <Card
                     title="Total Zones Tracked"
                     value={data.uniqueZones.length}
                     icon={<Map size={20} />}
                     className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/30"
                   />
                   <Card
                     title="Avg. Zone Loss"
                     value={(() => {
                        const validZones = Object.values(currentStats.zoneStats).filter(zone => zone.bulkReading > 0);
                        if (validZones.length === 0) return '0.0';
                        const avgLoss = validZones.reduce((sum, zone) => sum + zone.lossPercent, 0) / validZones.length;
                        return avgLoss.toFixed(1);
                     })()}
                     unit="%"
                     icon={<TrendingDown size={20} />}
                     className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-white to-amber-50 dark:from-gray-800 dark:to-amber-900/30"
                   />
                   <Card
                     title="Total Zone Consumption"
                     value={formatNumber(Object.values(currentStats.zoneStats).reduce((sum, zone) => sum + zone.l3Sum, 0))}
                     unit="m³"
                     icon={<BarChart3 size={20} />}
                     className="border-sky-200 dark:border-sky-800 bg-gradient-to-br from-white to-sky-50 dark:from-gray-800 dark:to-sky-900/30"
                   />
                </div>

                {/* Zone Performance Comparison Chart */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                   <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Zone Performance Comparison</h3>
                   <div className="h-96">
                     <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart
                         data={zoneLossData}
                         margin={{ top: 5, right: 5, left: 0, bottom: 70 }} // Increased bottom margin for rotated labels
                       >
                         <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb dark:stroke-gray-600" />
                         <XAxis
                            dataKey="zone"
                            angle={-45}
                            textAnchor="end"
                            height={70} // Adjust height for rotated labels
                            interval={0} // Show all labels
                            tick={{ fontSize: 11, fill: '#6b7280', dark: { fill: '#9ca3af' } }}
                            axisLine={false}
                            tickLine={false}
                         />
                         <YAxis yAxisId="left" label={{ value: 'Volume (m³)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12, fill: '#6b7280', dark: { fill: '#9ca3af' } } }} tick={{ fontSize: 11, fill: '#6b7280', dark: { fill: '#9ca3af' } }} tickFormatter={formatNumber} axisLine={false} tickLine={false} />
                         <YAxis yAxisId="right" orientation="right" label={{ value: 'Loss (%)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: 12, fill: '#6b7280', dark: { fill: '#9ca3af' } } }} domain={[0, 'dataMax + 10']} tick={{ fontSize: 11, fill: '#6b7280', dark: { fill: '#9ca3af' } }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                         <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)', dark: { backgroundColor: 'rgba(31, 41, 55, 0.9)' } }}
                            itemStyle={{ fontSize: 12, color: '#374151', dark: { color: '#d1d5db' } }}
                            labelStyle={{ fontSize: 12, fontWeight: 'bold', marginBottom: '5px', color: '#1f2937', dark: { color: '#f3f4f6' } }}
                            formatter={(value, name) => {
                                if (name === 'Loss %') return [`${value}%`, name];
                                return [`${formatNumber(value)} m³`, name];
                            }}
                         />
                         <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                         <Bar yAxisId="left" dataKey="bulkVolume" name="Supply (m³)" fill={COLORS.indigo} radius={[4, 4, 0, 0]} barSize={15} />
                         <Bar yAxisId="left" dataKey="consumedVolume" name="Consumed (m³)" fill={COLORS.emerald} radius={[4, 4, 0, 0]} barSize={15} />
                         <Line yAxisId="right" type="monotone" dataKey="lossPercent" name="Loss %" stroke={COLORS.rose} strokeWidth={2} dot={false} activeDot={{ r: 5 }}/>
                       </ComposedChart>
                     </ResponsiveContainer>
                   </div>
                 </div>

                {/* Zone Data Table */}
                <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        {['Zone', 'Supply (m³)', 'Consumed (m³)', 'Loss (m³)', 'Loss (%)', 'Meters'].map(header => (
                           <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {zoneLossData.map((zone) => (
                        <tr key={zone.zone} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{zone.zone}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatNumber(zone.bulkVolume)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatNumber(zone.consumedVolume)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatNumber(zone.lossVolume)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              zone.lossPercent > 20 ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                              zone.lossPercent > 10 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' :
                              'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                            }`}>
                              {zone.lossPercent}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{currentStats.zoneStats[zone.zone]?.meterCount || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // --- Selected Zone Detail View ---
              <>
                {selectedZoneStats ? (
                  <div className="space-y-6">
                    {/* Selected Zone Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <Card
                         title="Zone Supply"
                         value={formatNumber(selectedZoneStats.bulkReading)}
                         unit="m³"
                         icon={<Droplet size={20} />}
                          className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/30"
                       />
                       <Card
                         title="Zone Consumed"
                         value={formatNumber(selectedZoneStats.l3Sum)}
                         unit="m³"
                         icon={<CheckCircle size={20} />}
                         className="border-teal-200 dark:border-teal-800 bg-gradient-to-br from-white to-teal-50 dark:from-gray-800 dark:to-teal-900/30"
                       />
                       <Card
                         title="Zone Loss"
                         value={selectedZoneStats.lossPercent.toFixed(1)}
                         unit="%"
                         secondaryValue={formatNumber(selectedZoneStats.loss)} // Show volume as secondary
                         secondaryUnit="m³"
                         lossPercent={selectedZoneStats.lossPercent} // Use lossPercent for color
                         icon={<XCircle size={20} />}
                         // Force light red background for this specific loss card in zone view
                         className="bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-700"
                       />
                    </div>

                    {/* Zone Charts: Consumption Type Pie & Historical */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                       {/* Consumption by Type Pie */}
                       <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                         <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Consumption by Type in {selectedZone}</h3>
                         <div className="h-80">
                           <ResponsiveContainer width="100%" height="100%">
                            {zoneConsumptionByTypeData.length > 0 ? (
                             <PieChart>
                                <Pie
                                 data={zoneConsumptionByTypeData}
                                 cx="50%" cy="50%" outerRadius={100} innerRadius={60}
                                 fill="#8884d8" dataKey="value" labelLine={false}
                                 label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                 {zoneConsumptionByTypeData.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                 ))}
                               </Pie>
                               <Tooltip formatter={(value) => `${formatNumber(value)} m³`} />
                               <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                             </PieChart>
                             ) : (
                                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">No consumption data for this zone type.</div>
                             )}
                           </ResponsiveContainer>
                         </div>
                       </div>

                       {/* Historical Trend for Zone */}
                       <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                         <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{selectedZone} Historical Performance</h3>
                         <div className="h-80">
                           <ResponsiveContainer width="100%" height="100%">
                             <ComposedChart
                               data={data.periods.map(period => {
                                 const zoneData = data.stats[period]?.zoneStats[selectedZone];
                                 return {
                                   name: period,
                                   supply: zoneData?.bulkReading || 0,
                                   consumed: zoneData?.l3Sum || 0,
                                   loss: parseFloat(zoneData?.lossPercent?.toFixed(1) || 0)
                                 };
                               })}
                               margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                             >
                               <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb dark:stroke-gray-600" />
                               <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280', dark: { fill: '#9ca3af' } }} axisLine={false} tickLine={false} />
                               <YAxis yAxisId="left" label={{ value: 'Volume (m³)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12, fill: '#6b7280', dark: { fill: '#9ca3af' } } }} tick={{ fontSize: 11, fill: '#6b7280', dark: { fill: '#9ca3af' } }} tickFormatter={formatNumber} axisLine={false} tickLine={false} />
                               <YAxis yAxisId="right" orientation="right" label={{ value: 'Loss (%)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: 12, fill: '#6b7280', dark: { fill: '#9ca3af' } } }} domain={[0, 'dataMax + 10']} tick={{ fontSize: 11, fill: '#6b7280', dark: { fill: '#9ca3af' } }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                               <Tooltip
                                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)', dark: { backgroundColor: 'rgba(31, 41, 55, 0.9)' } }}
                                   itemStyle={{ fontSize: 12, color: '#374151', dark: { color: '#d1d5db' } }}
                                   labelStyle={{ fontSize: 12, fontWeight: 'bold', marginBottom: '5px', color: '#1f2937', dark: { color: '#f3f4f6' } }}
                                   formatter={(value, name) => {
                                      if (name === 'Loss %') return [`${value}%`, name];
                                      return [`${formatNumber(value)} m³`, name];
                                   }}
                                />
                               <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                               <Line yAxisId="left" type="monotone" dataKey="supply" name="Supply (m³)" stroke={COLORS.blue} activeDot={{ r: 5 }} strokeWidth={2} />
                               <Line yAxisId="left" type="monotone" dataKey="consumed" name="Consumed (m³)" stroke={COLORS.teal} activeDot={{ r: 5 }} strokeWidth={2} />
                               <Line yAxisId="right" type="monotone" dataKey="loss" name="Loss (%)" stroke={COLORS.rose} activeDot={{ r: 5 }} strokeWidth={2.5} />
                             </ComposedChart>
                           </ResponsiveContainer>
                         </div>
                       </div>
                    </div>

                    {/* Meter List Table for Zone */}
                    <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold p-4 bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-white border-b dark:border-gray-700">Meters in {selectedZone}</h3>
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                          <tr>
                            {['Meter Label', 'Type', 'Reading (m³)', '% of Zone Consumption'].map(header => (
                              <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {zoneMeters.length > 0 ? zoneMeters.map((meter) => (
                            <tr key={meter.label} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{meter.label}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{meter.type}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatNumber(meter.reading)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {selectedZoneStats.l3Sum > 0 ? ((meter.reading / selectedZoneStats.l3Sum) * 100).toFixed(1) : '0.0'}%
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan="4" className="text-center py-4 text-gray-500 dark:text-gray-400">No meters found for this zone.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <p>Could not find data for the selected zone: {selectedZone}.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* === RESTORED Loss Management Tab === */}
        {activeTab === 'losses' && (
           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 space-y-6">
             <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Loss Management Analysis</h2>

             {/* Loss Stage Cards - MODIFIED to force red background */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                  title="Stage 1 Loss (Trunk)"
                  value={currentStats.stage1LossPercent.toFixed(1)}
                  unit="%"
                  secondaryValue={formatNumber(currentStats.stage1Loss)}
                  secondaryUnit="m³"
                  trend={stage1LossTrend}
                  icon={<MinusCircle size={20} />}
                  className="bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-700" // Force red
                />
                <Card
                  title="Stage 2 Loss (Distribution)"
                  value={currentStats.stage2LossPercent.toFixed(1)}
                  unit="%"
                  secondaryValue={formatNumber(currentStats.stage2Loss)}
                  secondaryUnit="m³"
                  trend={stage2LossTrend}
                  icon={<MinusCircle size={20} />}
                  className="bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-700" // Force red
                />
                <Card
                  title="Total System Loss"
                  value={currentStats.totalLossPercent.toFixed(1)}
                  unit="%"
                  secondaryValue={formatNumber(currentStats.totalLoss)}
                  secondaryUnit="m³"
                  trend={totalLossTrend}
                  icon={<XCircle size={20} />}
                  className="bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-700" // Force red
                />
             </div>

             {/* Loss Charts: Breakdown Pie & Trend */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Loss Breakdown Pie Chart */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Loss Volume Breakdown</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            // Filter out stages with zero loss to avoid clutter
                            ...(currentStats.stage1Loss > 0 ? [{ name: 'Stage 1 Loss', value: currentStats.stage1Loss }] : []),
                            ...(currentStats.stage2Loss > 0 ? [{ name: 'Stage 2 Loss', value: currentStats.stage2Loss }] : []),
                            ...(currentStats.l3Volume > 0 ? [{ name: 'Consumed', value: currentStats.l3Volume }] : [])
                          ]}
                          cx="50%" cy="50%" outerRadius={100} innerRadius={60}
                          fill="#8884d8" dataKey="value" labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {/* Define colors carefully based on data presence */}
                          {(currentStats.stage1Loss > 0) && <Cell fill={COLORS.rose} />}
                          {(currentStats.stage2Loss > 0) && <Cell fill={COLORS.amber} />}
                          {(currentStats.l3Volume > 0) && <Cell fill={COLORS.emerald} />}
                        </Pie>
                        <Tooltip formatter={(value) => `${formatNumber(value)} m³`} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Loss Trend Line Chart */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Loss Trend Analysis (%)</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={data.periods.map(period => ({
                          name: period,
                          stage1: parseFloat(data.stats[period]?.stage1LossPercent?.toFixed(1) || 0),
                          stage2: parseFloat(data.stats[period]?.stage2LossPercent?.toFixed(1) || 0),
                          total: parseFloat(data.stats[period]?.totalLossPercent?.toFixed(1) || 0)
                        }))}
                        margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb dark:stroke-gray-600" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280', dark: { fill: '#9ca3af' } }} axisLine={false} tickLine={false} />
                        <YAxis label={{ value: 'Loss (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12, fill: '#6b7280', dark: { fill: '#9ca3af' } } }} domain={[0, 'dataMax + 5']} tick={{ fontSize: 11, fill: '#6b7280', dark: { fill: '#9ca3af' } }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                        <Line type="monotone" dataKey="stage1" name="Stage 1 Loss %" stroke={COLORS.rose} strokeWidth={2} activeDot={{ r: 5 }} dot={{ r: 3 }}/>
                        <Line type="monotone" dataKey="stage2" name="Stage 2 Loss %" stroke={COLORS.amber} strokeWidth={2} activeDot={{ r: 5 }} dot={{ r: 3 }}/>
                        <Line type="monotone" dataKey="total" name="Total Loss %" stroke={COLORS.indigo} strokeWidth={2.5} activeDot={{ r: 5 }} dot={{ r: 3 }}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
             </div>

             {/* Loss Stage Details */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stage 1 Analysis */}
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <h3 className="text-lg font-medium mb-3 text-red-800 dark:text-red-300">Stage 1 (Trunk) Loss Details</h3>
                  <div className="mb-4">
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Supply (L1): <span className="font-semibold">{formatNumber(currentStats.l1Supply)} m³</span></span>
                      <span>Delivered (L2+DC): <span className="font-semibold">{formatNumber(currentStats.l2Volume)} m³</span></span>
                    </div>
                    <div className="w-full bg-red-200 dark:bg-red-700/50 rounded-full h-2.5">
                      <div className="bg-gradient-to-r from-red-400 to-red-600 h-2.5 rounded-l-full" style={{ width: `${100 - currentStats.stage1LossPercent}%` }}></div>
                    </div>
                  </div>
                  <div className="p-3 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-gray-800 mb-4">
                    <h4 className="font-semibold text-red-800 dark:text-red-300 mb-1">Trunk Loss: {formatNumber(currentStats.stage1Loss)} m³ ({currentStats.stage1LossPercent.toFixed(1)}%)</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Loss between main supply and zone/direct connection points.</p>
                  </div>
                  <h4 className="font-medium mb-2 text-sm text-gray-700 dark:text-gray-300">Potential Causes:</h4>
                  <ul className="list-disc pl-5 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li>Main pipeline leaks</li>
                    <li>Main meter inaccuracy</li>
                    <li>Unauthorized trunk connections</li>
                  </ul>
                </div>

                {/* Stage 2 Analysis */}
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h3 className="text-lg font-medium mb-3 text-amber-800 dark:text-amber-300">Stage 2 (Distribution) Loss Details</h3>
                  <div className="mb-4">
                     <div className="flex justify-between mb-1 text-sm">
                       <span>Zone Supply (L2+DC): <span className="font-semibold">{formatNumber(currentStats.l2Volume)} m³</span></span>
                       <span>Consumed (L3+DC): <span className="font-semibold">{formatNumber(currentStats.l3Volume)} m³</span></span>
                     </div>
                     <div className="w-full bg-amber-200 dark:bg-amber-700/50 rounded-full h-2.5">
                       <div className="bg-gradient-to-r from-amber-400 to-amber-600 h-2.5 rounded-l-full" style={{ width: `${100 - currentStats.stage2LossPercent}%` }}></div>
                     </div>
                  </div>
                  <div className="p-3 border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-gray-800 mb-4">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">Distribution Loss: {formatNumber(currentStats.stage2Loss)} m³ ({currentStats.stage2LossPercent.toFixed(1)}%)</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total loss across all zone distribution networks.</p>
                  </div>
                  <h4 className="font-medium mb-2 text-sm text-gray-700 dark:text-gray-300">Top Contributing Zones (Loss %):</h4>
                  <div className="overflow-x-auto max-h-40"> {/* Limit height and allow scroll */}
                    <table className="min-w-full text-xs">
                      <thead className="sticky top-0 bg-amber-100 dark:bg-amber-800/50">
                        <tr>
                          <th className="px-3 py-1 text-left font-medium text-amber-900 dark:text-amber-200">Zone</th>
                          <th className="px-3 py-1 text-right font-medium text-amber-900 dark:text-amber-200">Loss %</th>
                          <th className="px-3 py-1 text-right font-medium text-amber-900 dark:text-amber-200">Loss (m³)</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-amber-100 dark:divide-amber-900/50">
                        {zoneLossData.slice(0, 5).map((zone) => (
                          <tr key={zone.zone}>
                            <td className="px-3 py-1 whitespace-nowrap text-gray-700 dark:text-gray-300">{zone.zone}</td>
                            <td className="px-3 py-1 whitespace-nowrap text-right text-gray-600 dark:text-gray-400">{zone.lossPercent}%</td>
                            <td className="px-3 py-1 whitespace-nowrap text-right text-gray-600 dark:text-gray-400">{formatNumber(zone.lossVolume)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
             </div>
           </div>
        )}

        {/* === RESTORED Consumption Patterns Tab === */}
        {activeTab === 'consumption' && (
           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 space-y-6">
             <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Consumption Patterns Analysis</h2>

             {/* Consumption Overview Cards */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                  title="Total Consumption"
                  value={formatNumber(currentStats.l3Volume)}
                  unit="m³"
                  trend={l3Trend}
                  icon={<BarChart3 size={20} />}
                  className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/30"
                />
                <Card
                  title="Avg. Daily Consumption"
                  value={formatNumber(Math.round(currentStats.l3Volume / 30))}
                  unit="m³/day"
                  // Add trend calculation for daily average if needed
                  icon={<Clock size={20} />}
                  className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-white to-violet-50 dark:from-gray-800 dark:to-violet-900/30"
                />
                <Card
                  title="Supply Efficiency"
                  value={(100 - currentStats.totalLossPercent).toFixed(1)}
                  unit="%"
                  lossPercent={currentStats.totalLossPercent} // For color indication
                  icon={<CheckCircle size={20} />}
                  // className handled internally by Card based on loss% unless overridden
                  // Since we want green/amber/red based on efficiency, we pass loss%
                  // but don't force red like in other tabs
                />
             </div>

             {/* Consumption Charts: By Type Bar & Trend Line */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Consumption by Type Bar Chart */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Consumption by User Type (m³)</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={consumptionByTypeData}
                        layout="vertical"
                        margin={{ top: 5, right: 5, left: 10, bottom: 5 }} // Adjust left margin for longer labels
                        barSize={20}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb dark:stroke-gray-600" horizontal={false}/>
                        <XAxis type="number" tickFormatter={formatNumber} tick={{ fontSize: 11, fill: '#6b7280', dark: { fill: '#9ca3af' } }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="name" type="category" width={120} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#374151', dark: { fill: '#d1d5db' } }} />
                        <Tooltip formatter={(value) => `${formatNumber(value)} m³`} />
                        <Bar dataKey="value" name="Consumption (m³)" fill={COLORS.sky} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Consumption Trend Line Chart (Top Types) */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Consumption Trend (Top Types)</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={data.periods.map(period => {
                          const typeData = {};
                          // Select top 3-4 types based on latest period for clarity
                          const topTypes = consumptionByTypeData.slice(0, 3).map(t => t.name);
                          topTypes.forEach(type => {
                             typeData[type] = data.stats[period]?.typeConsumption[type] || 0;
                          });
                          return { name: period, ...typeData };
                        })}
                        margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb dark:stroke-gray-600" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280', dark: { fill: '#9ca3af' } }} axisLine={false} tickLine={false} />
                        <YAxis label={{ value: 'Volume (m³)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12, fill: '#6b7280', dark: { fill: '#9ca3af' } } }} tick={{ fontSize: 11, fill: '#6b7280', dark: { fill: '#9ca3af' } }} tickFormatter={formatNumber} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value) => `${formatNumber(value)} m³`} />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                        {consumptionByTypeData.slice(0, 3).map((type, index) => (
                            <Line key={type.name} type="monotone" dataKey={type.name} stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={2} activeDot={{ r: 5 }} dot={{ r: 3 }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
             </div>

             {/* Consumption by Zone Bar Chart */}
             <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
               <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Consumption by Zone (m³)</h3>
               <div className="h-80">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart
                     data={Object.entries(currentStats.zoneStats)
                       .map(([zone, stats]) => ({ name: zone, value: stats.l3Sum }))
                       .filter(item => item.value > 0)
                       .sort((a, b) => b.value - a.value)}
                     margin={{ top: 5, right: 5, left: 0, bottom: 70 }} // Increased bottom margin
                     barSize={20}
                   >
                     <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb dark:stroke-gray-600" vertical={false}/>
                     <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={70} // Adjust height
                        interval={0} // Show all labels
                        tick={{ fontSize: 11, fill: '#6b7280', dark: { fill: '#9ca3af' } }}
                        axisLine={false}
                        tickLine={false}
                      />
                     <YAxis label={{ value: 'Volume (m³)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12, fill: '#6b7280', dark: { fill: '#9ca3af' } } }} tick={{ fontSize: 11, fill: '#6b7280', dark: { fill: '#9ca3af' } }} tickFormatter={formatNumber} axisLine={false} tickLine={false} />
                     <Tooltip formatter={(value) => `${formatNumber(value)} m³`} />
                     <Bar dataKey="value" name="Consumption (m³)" fill={COLORS.violet} radius={[4, 4, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
             </div>

             {/* Consumption by Type Table */}
             <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold p-4 bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-white border-b dark:border-gray-700">Consumption Summary by Type</h3>
               <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                 <thead className="bg-gray-50 dark:bg-gray-700/50">
                   <tr>
                     {['Type', 'Consumption (m³)', 'Percentage', 'Trend vs Last Period'].map(header => (
                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{header}</th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                   {consumptionByTypeData.map((type) => {
                     const prevValue = previousStats ? previousStats.typeConsumption[type.name] : null;
                     const trend = calculateTrend(type.value, prevValue);
                     const percentage = totalConsumption > 0 ? ((type.value / totalConsumption) * 100).toFixed(1) : '0.0';

                     return (
                       <tr key={type.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{type.name}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatNumber(type.value)}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{percentage}%</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm">
                           {trend !== null ? (
                             <span className={`inline-flex items-center ${trend > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                               {trend > 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                               {Math.abs(trend)}%
                             </span>
                           ) : (
                             <span className="text-gray-400 dark:text-gray-500">-</span>
                           )}
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {/* Admin Upload Tab (unchanged) */}
        {activeTab === 'admin' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Admin - Upload New Data</h2>

            {/* Instructions */}
            <div className="prose prose-sm dark:prose-invert max-w-none p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <h3 className="flex items-center"><FileText size={18} className="mr-2 text-indigo-500"/>File Format Instructions</h3>
                <p>
                    Upload a Tab-Separated Value (<code>.tsv</code> or <code>.txt</code>) file containing the meter reading data.
                    The file must follow the specific format outlined in the "Data Upload File Format Guide".
                </p>
                <p>
                    Key requirements include:
                </p>
                <ul>
                    <li>UTF-8 encoding</li>
                    <li>Tab characters separating columns</li>
                    <li>A specific header row (see guide for details)</li>
                    <li>Numerical readings without commas or units</li>
                </ul>
                 <p>
                    Uploading a new file will replace the currently displayed data for this session and attempt to save it in browser storage for future sessions.
                 </p>
            </div>

            {/* File Input and Upload Button */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
                 <label htmlFor="file-upload" className="sr-only">Choose file</label>
                 <input
                    ref={fileInputRef} // Assign ref
                    id="file-upload"
                    type="file"
                    accept=".tsv,.txt,text/tab-separated-values,text/plain" // Accept TSV and TXT
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900 cursor-pointer"
                 />
                 <button
                    onClick={handleFileUpload}
                    disabled={!uploadedFile || uploadStatus === 'loading'} // Disable if no file or loading
                    className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${uploadStatus === 'loading' ? 'animate-pulse' : ''}`}
                 >
                    <UploadCloud size={18} className="mr-2" />
                    {uploadStatus === 'loading' ? 'Processing...' : 'Upload & Process File'}
                 </button>
            </div>

            {/* Status Messages */}
            {uploadStatus === 'success' && (
                <div className="mt-4 p-3 rounded-md bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700">
                    <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" aria-hidden="true" />
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">File processed successfully! Dashboard data updated and saved to browser storage.</p>
                    </div>
                </div>
            )}
            {uploadStatus === 'error' && (
                <div className="mt-4 p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700">
                    <div className="flex items-center">
                        <XCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" aria-hidden="true" />
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">{uploadError || 'An unknown error occurred during upload.'}</p>
                    </div>
                </div>
            )}

          </div>
        )}

      </main>

      {/* Footer (unchanged) */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-8">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2 mb-2 md:mb-0"> <Droplet size={14} className="text-indigo-500" /> <span>© {new Date().getFullYear()} Muscat Bay Water Analytics</span> </div>
          <div className="flex items-center space-x-4"> <span>Data for period: <span className="font-medium text-gray-700 dark:text-gray-200">{selectedPeriod}</span></span> <span>Last updated: <span className="font-medium text-gray-700 dark:text-gray-200">{new Date().toLocaleDateString()}</span></span> </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardApp;
