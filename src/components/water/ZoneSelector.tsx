
import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { waterColors } from './WaterTheme';

interface ZoneSelectorProps {
  zones: string[];
  selectedZone: string;
  onSelectZone: (zone: string) => void;
  metrics?: Record<string, { lossPercentage: number; bulkSupply: number }>;
}

const ZoneSelector: React.FC<ZoneSelectorProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  metrics = {},
}) => {
  // Skip 'all' for the visual selector
  const visualZones = zones.filter(zone => zone !== 'all');
  
  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-gray-700 dark:text-gray-300">Select Zone</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {visualZones.map((zone) => {
          const zoneMetric = metrics[zone];
          const lossPercentage = zoneMetric?.lossPercentage || 0;
          
          // Determine color based on loss percentage
          let statusColor = waterColors.success;
          if (lossPercentage > 20) {
            statusColor = waterColors.danger;
          } else if (lossPercentage > 10) {
            statusColor = waterColors.warning;
          }
          
          return (
            <motion.div
              key={zone}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={`cursor-pointer p-4 border-l-4 hover:shadow-md transition-all ${
                  selectedZone === zone 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' 
                    : 'border-transparent hover:border-blue-300'
                }`}
                style={{ 
                  borderLeftColor: selectedZone === zone ? waterColors.primary : statusColor
                }}
                onClick={() => onSelectZone(zone)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{zone}</h4>
                    {zoneMetric && (
                      <p className="text-xs text-gray-500">
                        {zoneMetric.bulkSupply.toLocaleString()} m³
                      </p>
                    )}
                  </div>
                  {zoneMetric && (
                    <div 
                      className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{ 
                        backgroundColor: `${statusColor}20`,
                        color: statusColor
                      }}
                    >
                      {lossPercentage.toFixed(1)}% loss
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ZoneSelector;
