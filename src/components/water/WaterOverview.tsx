
import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, AlertCircle, TrendingDown, PieChart as PieChartIcon } from 'lucide-react';
import { LevelMetrics, ZoneMetrics, TypeConsumption, MonthlyConsumption } from '@/types/waterSystem';
import EnhancedKpiCard from './EnhancedKpiCard';
import WaterConsumptionChart from './WaterConsumptionChart';
import { waterColors } from './WaterTheme';

interface WaterOverviewProps {
  levelMetrics: LevelMetrics;
  zoneMetrics: ZoneMetrics[];
  typeConsumption: TypeConsumption[];
  monthlyTrends: MonthlyConsumption[];
  selectedMonth: string;
}

const WaterOverview: React.FC<WaterOverviewProps> = ({
  levelMetrics,
  zoneMetrics,
  typeConsumption,
  monthlyTrends,
  selectedMonth
}) => {
  const displayMonth = selectedMonth === 'all' ? 'All Months' : selectedMonth;
  
  // Format data for charts
  const typeConsumptionData = typeConsumption.map(item => ({
    name: item.type,
    value: item.consumption,
    percentage: item.percentage
  }));
  
  const zoneMetricsData = zoneMetrics.map(item => ({
    name: item.zone,
    value: item.lossPercentage,
    bulkSupply: item.bulkSupply,
    individualMeters: item.individualMeters,
    loss: item.loss
  }));
  
  const monthlyTrendsData = monthlyTrends.map(item => ({
    name: item.month,
    supply: item.l1Supply || 0,
    consumption: item.l3Volume || 0,
    loss: item.loss || 0,
    lossPercentage: item.lossPercentage || 0
  }));
  
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
          title="Total Consumption"
          value={levelMetrics.l3Volume.toLocaleString()}
          valueUnit="m³"
          description={displayMonth}
          icon={Droplets}
          variant="primary"
        />
        
        <EnhancedKpiCard
          title="Total Loss (NRW)"
          value={levelMetrics.totalLoss.toLocaleString()}
          valueUnit="m³"
          subValue={levelMetrics.totalLossPercentage.toFixed(1)}
          subValueUnit="% of supply"
          icon={AlertCircle}
          variant={levelMetrics.totalLossPercentage > 15 ? "danger" : "warning"}
        />
        
        <EnhancedKpiCard
          title="Stage 1 Loss"
          value={levelMetrics.stage1Loss.toLocaleString()}
          valueUnit="m³"
          subValue={levelMetrics.stage1LossPercentage.toFixed(1)}
          subValueUnit="% of L1 supply"
          icon={TrendingDown}
          variant={levelMetrics.stage1LossPercentage > 10 ? "danger" : "warning"}
        />
        
        <EnhancedKpiCard
          title="Stage 2 Loss"
          value={levelMetrics.stage2Loss.toLocaleString()}
          valueUnit="m³"
          subValue={levelMetrics.stage2LossPercentage.toFixed(1)}
          subValueUnit="% of L2 volume"
          icon={TrendingDown}
          variant={levelMetrics.stage2LossPercentage > 10 ? "danger" : "warning"}
        />
      </motion.div>
      
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={itemVariants}
      >
        <WaterConsumptionChart
          title="Water Consumption by Type"
          description="Distribution of consumption across usage types"
          data={typeConsumptionData}
          type="pie"
          colors={[
            waterColors.chart.blue,
            waterColors.chart.green,
            waterColors.chart.amber,
            waterColors.chart.purple,
            waterColors.chart.teal
          ]}
          valueFormatter={(value) => `${value.toLocaleString()} m³`}
        />
        
        <WaterConsumptionChart
          title="Zone Loss Analysis"
          description="Water loss percentage by zone"
          data={zoneMetricsData}
          type="bar"
          dataKey="value"
          xAxisKey="name"
          colors={[waterColors.chart.amber]}
          horizontal={true}
          valueFormatter={(value) => `${value.toFixed(1)}%`}
        />
      </motion.div>
      
      {monthlyTrends.length > 0 && (
        <motion.div variants={itemVariants}>
          <WaterConsumptionChart
            title="Water Consumption & Loss Trends"
            description="Monthly trends in consumption and losses"
            data={monthlyTrendsData}
            type="area"
            dataKey="consumption"
            xAxisKey="name"
            height={350}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default WaterOverview;
