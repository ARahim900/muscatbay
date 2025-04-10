
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import WaterDashboard from '@/components/stp/WaterDashboard';
import { processWaterDataForDashboard } from '@/utils/waterDataParser';

const Water = () => {
  const [waterData, setWaterData] = useState({
    meters: [],
    zones: [],
    types: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // This would normally fetch from an API, but for now we'll parse the data directly
    const rawData = `Meter Label\tAcct #\tZone\tType\tParent Meter\tLabel\tJan-25\tFeb-25\tMar-25\tApr-25\tMay-25\tJun-25\tJul-25\tAug-25\tSep-25\tOct-25\tNov-25\tDec-25\tTotal
Z5-17\t4300001\tZone_05\tResidential (Villa)\tZONE 5 (Bulk Zone 5)\tL3\t112\t80\t81\t\t\t\t\t\t\t\t\t\t273
Z3-42 (Villa)\t4300002\tZone_03_(A)\tResidential (Villa)\tZONE 3A (BULK ZONE 3A)\tL3\t32\t46\t19\t\t\t\t\t\t\t\t\t\t97
Z3-46(5) (Building)\t4300003\tZone_03_(A)\tResidential (Apart)\tD-46 Building Bulk Meter\tL3\t5\t0\t0\t\t\t\t\t\t\t\t\t\t5
Z3-49(3) (Building)\t4300004\tZone_03_(A)\tResidential (Apart)\tD-49 Building Bulk Meter\tL3\t10\t15\t11\t\t\t\t\t\t\t\t\t\t36
Z3-38 (Villa)\t4300005\tZone_03_(A)\tResidential (Villa)\tZONE 3A (BULK ZONE 3A)\tL3\t10\t7\t7\t\t\t\t\t\t\t\t\t\t24
Z3-75(4) (Building)\t4300006\tZone_03_(A)\tResidential (Apart)\tD-75 Building Bulk Meter\tL3\t0\t0\t0\t\t\t\t\t\t\t\t\t\t0
Z3-46(3A) (Building)\t4300007\tZone_03_(A)\tResidential (Apart)\tD-46 Building Bulk Meter\tL3\t38\t35\t15\t\t\t\t\t\t\t\t\t\t88
Z3-52(6) (Building)\t4300008\tZone_03_(B)\tResidential (Apart)\tD-52 Building Bulk Meter\tL3\t10\t9\t9\t\t\t\t\t\t\t\t\t\t28
Z3-21 (Villa)\t4300009\tZone_03_(B)\tResidential (Villa)\tZONE 3B (BULK ZONE 3B)\tL3\t41\t53\t42\t\t\t\t\t\t\t\t\t\t136
Z3-049(4) (Building)\t4300010\tZone_03_(A)\tResidential (Apart)\tD-49 Building Bulk Meter\tL3\t8\t1\t8\t\t\t\t\t\t\t\t\t\t17
Z3-46(1A) (Building)\t4300011\tZone_03_(A)\tResidential (Apart)\tD-46 Building Bulk Meter\tL3\t11\t10\t10\t\t\t\t\t\t\t\t\t\t31
Z3-47(2) (Building)\t4300012\tZone_03_(A)\tResidential (Apart)\tD-47  Building Bulk Meter\tL3\t1\t1\t1\t\t\t\t\t\t\t\t\t\t3
Z3-45(3A) (Building)\t4300013\tZone_03_(A)\tResidential (Apart)\tD-45 Building Bulk Meter\tL3\t8\t4\t0\t\t\t\t\t\t\t\t\t\t12
Z3-46(2A) (Building)\t4300014\tZone_03_(A)\tResidential (Apart)\tD-46 Building Bulk Meter\tL3\t0\t0\t0\t\t\t\t\t\t\t\t\t\t0
Z3-46(6) (Building)\t4300015\tZone_03_(A)\tResidential (Apart)\tD-46 Building Bulk Meter\tL3\t3\t1\t1\t\t\t\t\t\t\t\t\t\t5
Z3-47(4) (Building)\t4300016\tZone_03_(A)\tResidential (Apart)\tD-47  Building Bulk Meter\tL3\t11\t12\t0\t\t\t\t\t\t\t\t\t\t23
Main Bulk (NAMA)\tC43659\tMain Bulk\tMain BULK\tNAMA\tL1\t32580\t44043\t34915\t\t\t\t\t\t\t\t\t\t111538`;
    
    try {
      const processedData = processWaterDataForDashboard(rawData);
      setWaterData(processedData);
    } catch (error) {
      console.error('Error processing water data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return (
    <Layout>
      {isLoading ? (
        <div className="flex items-center justify-center h-full py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <WaterDashboard 
          meterData={waterData.meters}
          zoneData={waterData.zones}
          typeData={waterData.types}
        />
      )}
    </Layout>
  );
};

export default Water;
