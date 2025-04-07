
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingDown, AlertTriangle, BarChart, Droplets } from 'lucide-react';
import { ZoneMetrics, LevelMetrics } from '@/types/waterSystem';
import EnhancedKpiCard from './EnhancedKpiCard';
import WaterConsumptionChart from './WaterConsumptionChart';
import { waterColors } from './WaterTheme';

interface WaterLossAnalysisProps {
  zoneMetrics: ZoneMetrics[];
  levelMetrics: LevelMetrics;
  selectedMonth: string;
}

const WaterLossAnalysis: React.FC<WaterLossAnalysisProps> = ({
  zoneMetrics,
  levelMetrics,
  selectedMonth
}) => {
  const displayMonth = selectedMonth === 'all' ? 'All Months' : selectedMonth;
  
  // Format data for zone loss chart
  const zoneLossData = zoneMetrics
    .filter(zone => zone.lossPercentage > 0)
    .map(zone => ({
      name: zone.zone,
      value: zone.lossPercentage,
      lossVolume: zone.loss,
      bulkSupply: zone.bulkSupply
    }))
    .sort((a, b) => b.value - a.value);
  
  // Format data for distribution loss chart
  const distributionLossData = [
    { name: 'Stage 1 Loss', value: levelMetrics.stage1Loss, percentage: levelMetrics.stage1LossPercentage },
    { name: 'Stage 2 Loss', value: levelMetrics.stage2Loss, percentage: levelMetrics.stage2LossPercentage }
  ];
  
  // Format data for water balance chart (sankey diagram approximation with bar chart)
  const waterBalanceData = [
    { name: 'L1 Supply', value: levelMetrics.l1Supply, type: 'supply' },
    { name: 'Stage 1 Loss', value: levelMetrics.stage1Loss, type: 'loss' },
    { name: 'L2 Volume', value: levelMetrics.l2Volume, type: 'intermediate' },
    { name: 'Stage 2 Loss', value: levelMetrics.stage2Loss, type: 'loss' },
    { name: 'L3 Volume', value: levelMetrics.l3Volume, type: 'consumption' }
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
  
  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={itemVariants}
      >
        <EnhancedKpiCard
          title="Total System Loss"
          value={levelMetrics.totalLoss.toLocaleString()}
          valueUnit="m³"
          subValue={levelMetrics.totalLossPercentage.toFixed(1)}
          subValueUnit="% of supply"
          icon={AlertTriangle}
          variant={levelMetrics.totalLossPercentage > 15 ? "danger" : "warning"}
        />
        
        <EnhancedKpiCard
          title="Transmission Loss"
          value={levelMetrics.stage1Loss.toLocaleString()}
          valueUnit="m³"
          subValue={levelMetrics.stage1LossPercentage.toFixed(1)}
          subValueUnit="% of L1 supply"
          description="L1 to L2 Loss"
          icon={TrendingDown}
          variant={levelMetrics.stage1LossPercentage > 10 ? "danger" : "warning"}
        />
        
        <EnhancedKpiCard
          title="Distribution Loss"
          value={levelMetrics.stage2Loss.toLocaleString()}
          valueUnit="m³"
          subValue={levelMetrics.stage2LossPercentage.toFixed(1)}
          subValueUnit="% of L2 volume"
          description="L2 to L3 Loss"
          icon={TrendingDown}
          variant={levelMetrics.stage2LossPercentage > 10 ? "danger" : "warning"}
        />
        
        <EnhancedKpiCard
          title="Total Consumption"
          value={levelMetrics.l3Volume.toLocaleString()}
          valueUnit="m³"
          subValue={(levelMetrics.l3Volume / levelMetrics.l1Supply * 100).toFixed(1)}
          subValueUnit="% of supply"
          icon={Droplets}
          variant="primary"
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Water Distribution Flow</CardTitle>
            <CardDescription>From bulk supply to end consumption for {displayMonth}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <WaterConsumptionChart
                title=""
                data={waterBalanceData}
                type="bar"
                colors={[
                  waterColors.chart.blue,
                  waterColors.chart.red,
                  waterColors.chart.purple,
                  waterColors.chart.red,
                  waterColors.chart.green
                ]}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={itemVariants}
      >
        <Card>
          <CardHeader>
            <CardTitle>Loss by Zone</CardTitle>
            <CardDescription>
              Water loss percentage across different zones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <WaterConsumptionChart
                title=""
                data={zoneLossData}
                type="bar"
                dataKey="value"
                horizontal={true}
                colors={[waterColors.chart.amber]}
                valueFormatter={(value) => `${value.toFixed(1)}%`}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Distribution of Losses</CardTitle>
            <CardDescription>
              Comparison of stage 1 vs stage 2 losses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <WaterConsumptionChart
                title=""
                data={distributionLossData}
                type="pie"
                colors={[waterColors.chart.purple, waterColors.chart.amber]}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Highest Losing Zones</CardTitle>
            <CardDescription>Zones with the highest water loss by volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5 py-3">
              {zoneLossData
                .sort((a, b) => b.lossVolume - a.lossVolume)
                .slice(0, 5)
                .map((zone, index) => {
                  const lossPercentage = zone.value;
                  
                  // Determine color based on loss percentage
                  let statusColor = waterColors.success;
                  if (lossPercentage > 20) {
                    statusColor = waterColors.danger;
                  } else if (lossPercentage > 10) {
                    statusColor = waterColors.warning;
                  }
                  
                  // Calculate percentage of progress bar to fill
                  const progressPercentage = (lossPercentage / 100) * 100;
                  
                  return (
                    <div key={zone.name} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{zone.name}</span>
                        <span className="text-sm">{lossPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min(progressPercentage, 100)}%`,
                              backgroundColor: statusColor
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {zone.lossVolume.toLocaleString()} m³
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default WaterLossAnalysis;
