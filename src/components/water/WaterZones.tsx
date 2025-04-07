
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building, Home, Droplet, Water } from 'lucide-react';
import { ZoneMetrics, WaterConsumptionData } from '@/types/waterSystem';
import EnhancedKpiCard from './EnhancedKpiCard';
import WaterConsumptionChart from './WaterConsumptionChart';
import ZoneSelector from './ZoneSelector';
import { waterColors } from './WaterTheme';
import { getReadingValue } from '@/utils/waterSystemUtils';

interface WaterZonesProps {
  zoneMetrics: ZoneMetrics[];
  waterData: WaterConsumptionData[];
  selectedMonth: string;
  selectedZone: string;
  onSelectZone: (zone: string) => void;
}

const WaterZones: React.FC<WaterZonesProps> = ({ 
  zoneMetrics,
  waterData,
  selectedMonth,
  selectedZone,
  onSelectZone
}) => {
  // Find the selected zone's metrics
  const selectedZoneMetrics = zoneMetrics.find(zone => zone.zone === selectedZone);
  
  // Get all meters for the selected zone
  const zoneMeters = waterData.filter(meter => 
    meter.Zone === selectedZone
  );
  
  // Group meters by type for the selected zone
  const metersByType: Record<string, WaterConsumptionData[]> = {};
  zoneMeters.forEach(meter => {
    const type = meter.Type || 'Unknown';
    if (!metersByType[type]) {
      metersByType[type] = [];
    }
    metersByType[type].push(meter);
  });
  
  // Calculate consumption by type for the selected zone
  const typeConsumption = Object.entries(metersByType).map(([type, meters]) => {
    const consumption = meters.reduce((sum, meter) => {
      return sum + getReadingValue(meter, selectedMonth);
    }, 0);
    
    return { type, consumption };
  }).sort((a, b) => b.consumption - a.consumption);
  
  // Get L2 bulk meter for this zone
  const zoneBulkMeter = waterData.find(meter => 
    meter.Label === 'L2' && meter.Zone === selectedZone
  );
  
  // Sum all direct connections in this zone
  const directConnections = waterData.filter(meter => 
    meter.Label === 'DC' && meter.Zone === selectedZone
  );
  
  const directConnectionsConsumption = directConnections.reduce((sum, meter) => {
    return sum + getReadingValue(meter, selectedMonth);
  }, 0);
  
  // Sum all L3 meters in this zone
  const individualMeters = waterData.filter(meter => 
    meter.Label === 'L3' && meter.Zone === selectedZone
  );
  
  const individualMetersConsumption = individualMeters.reduce((sum, meter) => {
    return sum + getReadingValue(meter, selectedMonth);
  }, 0);

  // Format data for charts
  const typeConsumptionData = typeConsumption.map(item => ({
    name: item.type,
    value: item.consumption
  }));
  
  const meteringData = [
    { name: 'Bulk Supply', value: selectedZoneMetrics?.bulkSupply || 0 },
    { name: 'Direct Connections', value: directConnectionsConsumption },
    { name: 'Individual Meters', value: individualMetersConsumption },
    { name: 'Loss', value: selectedZoneMetrics?.loss || 0 }
  ];
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  // If no zone is selected or available
  if (!selectedZone || !selectedZoneMetrics) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select a Zone</CardTitle>
            <CardDescription>Choose a zone to view detailed water consumption information</CardDescription>
          </CardHeader>
          <CardContent>
            <ZoneSelector
              zones={zoneMetrics.map(zone => zone.zone)}
              selectedZone={selectedZone}
              onSelectZone={onSelectZone}
              metrics={Object.fromEntries(
                zoneMetrics.map(zone => [
                  zone.zone,
                  { lossPercentage: zone.lossPercentage, bulkSupply: zone.bulkSupply }
                ])
              )}
            />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Zone Analysis: {selectedZone}</h2>
      </div>
      
      <ZoneSelector
        zones={zoneMetrics.map(zone => zone.zone)}
        selectedZone={selectedZone}
        onSelectZone={onSelectZone}
        metrics={Object.fromEntries(
          zoneMetrics.map(zone => [
            zone.zone,
            { lossPercentage: zone.lossPercentage, bulkSupply: zone.bulkSupply }
          ])
        )}
      />
      
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        variants={itemVariants}
      >
        <EnhancedKpiCard
          title="Bulk Supply"
          value={selectedZoneMetrics.bulkSupply.toLocaleString()}
          valueUnit="m³"
          icon={Droplet}
          variant="primary"
          description="Measured at L2 bulk meter"
        />
        
        <EnhancedKpiCard
          title="Individual Consumption"
          value={selectedZoneMetrics.individualMeters.toLocaleString()}
          valueUnit="m³"
          icon={Home}
          variant="success"
          description="Sum of all individual meters"
        />
        
        <EnhancedKpiCard
          title="Water Loss"
          value={selectedZoneMetrics.loss.toLocaleString()}
          valueUnit="m³"
          subValue={selectedZoneMetrics.lossPercentage.toFixed(1)}
          subValueUnit="% of bulk supply"
          icon={Water}
          variant={selectedZoneMetrics.lossPercentage > 15 ? "danger" : "warning"}
        />
      </motion.div>
      
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={itemVariants}
      >
        <WaterConsumptionChart
          title="Water Distribution"
          description={`${selectedZone} zone distribution breakdown`}
          data={meteringData}
          type="pie"
          colors={[
            waterColors.chart.blue,
            waterColors.chart.purple,
            waterColors.chart.green,
            waterColors.chart.red
          ]}
        />
        
        <WaterConsumptionChart
          title="Consumption by Type"
          description={`${selectedZone} zone consumption by type`}
          data={typeConsumptionData}
          type="bar"
          horizontal={true}
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>All Meters in {selectedZone}</CardTitle>
            <CardDescription>
              Total of {zoneMeters.length} meters found
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="all" className="w-full">
              <div className="px-6 border-b">
                <TabsList className="w-auto h-auto bg-transparent p-0 mb-0">
                  <TabsTrigger 
                    value="all" 
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none px-4 py-2 h-auto"
                  >
                    All Meters
                  </TabsTrigger>
                  <TabsTrigger 
                    value="bulk" 
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none px-4 py-2 h-auto"
                  >
                    Bulk Meters
                  </TabsTrigger>
                  <TabsTrigger 
                    value="direct" 
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none px-4 py-2 h-auto"
                  >
                    Direct Connections
                  </TabsTrigger>
                  <TabsTrigger 
                    value="individual" 
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none px-4 py-2 h-auto"
                  >
                    Individual Meters
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="all" className="mt-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800 text-left text-xs">
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Meter Label</th>
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Type</th>
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Level</th>
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap text-right">Consumption (m³)</th>
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Parent Meter</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {zoneMeters.map((meter, index) => (
                        <tr 
                          key={meter.id || index}
                          className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm whitespace-nowrap">{meter['Meter Label'] || '-'}</td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">{meter.Type || '-'}</td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <Badge 
                              variant="outline" 
                              className={`font-normal ${
                                meter.Label === 'L1' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' :
                                meter.Label === 'L2' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' :
                                meter.Label === 'L3' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' :
                                meter.Label === 'DC' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' :
                                ''
                              }`}
                            >
                              {meter.Label || '-'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap text-right font-medium">
                            {getReadingValue(meter, selectedMonth).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                            {meter['Parent Meter'] || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              <TabsContent value="bulk" className="mt-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800 text-left text-xs">
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Meter Label</th>
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Type</th>
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap text-right">Consumption (m³)</th>
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Parent Meter</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {zoneMeters
                        .filter(meter => meter.Label === 'L2')
                        .map((meter, index) => (
                          <tr 
                            key={meter.id || index}
                            className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm whitespace-nowrap">{meter['Meter Label'] || '-'}</td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap">{meter.Type || '-'}</td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap text-right font-medium">
                              {getReadingValue(meter, selectedMonth).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                              {meter['Parent Meter'] || '-'}
                            </td>
                          </tr>
                      ))}
                      
                      {!zoneMeters.some(meter => meter.Label === 'L2') && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            No bulk meters found for this zone
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              <TabsContent value="direct" className="mt-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800 text-left text-xs">
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Meter Label</th>
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Type</th>
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap text-right">Consumption (m³)</th>
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Parent Meter</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {zoneMeters
                        .filter(meter => meter.Label === 'DC')
                        .map((meter, index) => (
                          <tr 
                            key={meter.id || index}
                            className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm whitespace-nowrap">{meter['Meter Label'] || '-'}</td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap">{meter.Type || '-'}</td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap text-right font-medium">
                              {getReadingValue(meter, selectedMonth).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                              {meter['Parent Meter'] || '-'}
                            </td>
                          </tr>
                      ))}
                      
                      {!zoneMeters.some(meter => meter.Label === 'DC') && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            No direct connections found for this zone
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              <TabsContent value="individual" className="mt-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800 text-left text-xs">
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Meter Label</th>
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Type</th>
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap text-right">Consumption (m³)</th>
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Parent Meter</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {zoneMeters
                        .filter(meter => meter.Label === 'L3')
                        .map((meter, index) => (
                          <tr 
                            key={meter.id || index}
                            className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm whitespace-nowrap">{meter['Meter Label'] || '-'}</td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap">{meter.Type || '-'}</td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap text-right font-medium">
                              {getReadingValue(meter, selectedMonth).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                              {meter['Parent Meter'] || '-'}
                            </td>
                          </tr>
                      ))}
                      
                      {!zoneMeters.some(meter => meter.Label === 'L3') && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            No individual meters found for this zone
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default WaterZones;
