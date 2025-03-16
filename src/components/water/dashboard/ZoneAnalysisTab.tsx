
import React from 'react';
import { Droplet, BarChart2 } from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell
} from 'recharts';

import MetricCard from './MetricCard';
import FilterButton from './FilterButton';
import DataTable from './DataTable';
import CustomTooltip from './CustomTooltip';

interface ZoneAnalysisTabProps {
  filteredZoneData: any[];
  zoneComparisonData: any[];
  summaryData: any;
  visibleZones: Record<string, boolean>;
  setVisibleZones: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  theme: any;
  zoneColumns: any[];
}

const ZoneAnalysisTab: React.FC<ZoneAnalysisTabProps> = ({
  filteredZoneData,
  zoneComparisonData,
  summaryData,
  visibleZones,
  setVisibleZones,
  theme,
  zoneColumns
}) => {
  return (
    <>
      {/* Zone metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard 
          title="Highest Consumption Zone" 
          value={filteredZoneData.reduce((prev, current) => 
            (prev.consumption > current.consumption) ? prev : current
          ).zone}
          subValue={filteredZoneData.reduce((prev, current) => 
            (prev.consumption > current.consumption) ? prev : current
          ).consumption}
          subUnit="m³"
          icon={Droplet}
          color={theme.success}
          theme={theme}
        />
        <MetricCard 
          title="Highest Loss Zone" 
          value={filteredZoneData.reduce((prev, current) => 
            (prev.loss > current.loss) ? prev : current
          ).zone}
          subValue={filteredZoneData.reduce((prev, current) => 
            (prev.loss > current.loss) ? prev : current
          ).loss}
          subUnit="m³"
          icon={BarChart2}
          color={theme.danger}
          theme={theme}
        />
        <MetricCard 
          title="Zone Bulk Total" 
          value={filteredZoneData.reduce((sum, item) => sum + item.consumption, 0)}
          unit="m³"
          subValue={(filteredZoneData.reduce((sum, item) => sum + item.consumption, 0) / 
                    summaryData.totalConsumption * 100).toFixed(1)}
          subUnit="% of Main Bulk"
          icon={BarChart2}
          color={theme.info}
          theme={theme}
        />
        <MetricCard 
          title="Zone Distribution Loss" 
          value={filteredZoneData.reduce((sum, item) => sum + (item.loss > 0 ? item.loss : 0), 0)}
          unit="m³"
          subValue={(filteredZoneData.reduce((sum, item) => sum + (item.loss > 0 ? item.loss : 0), 0) / 
                    filteredZoneData.reduce((sum, item) => sum + item.consumption, 0) * 100).toFixed(1)}
          subUnit="% of Zone Bulk"
          icon={BarChart2}
          color={theme.warning}
          theme={theme}
        />
      </div>
      
      {/* Zone filter buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className={`flex items-center mr-2 ${theme.textSecondary}`}>
          <span className="text-sm">Zones:</span>
        </div>
        {filteredZoneData.map((zone, index) => (
          <FilterButton 
            key={zone.zone}
            label={zone.zone} 
            active={visibleZones[zone.zone]} 
            color={theme.zoneColors[index % theme.zoneColors.length]}
            onClick={() => setVisibleZones({
              ...visibleZones, 
              [zone.zone]: !visibleZones[zone.zone]
            })}
            theme={theme}
          />
        ))}
      </div>
      
      {/* Zone charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Distribution Chart */}
        <div className={`${theme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
          <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Zone Consumption Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredZoneData.filter(zone => visibleZones[zone.zone])}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                  outerRadius={80}
                  dataKey="consumption"
                  nameKey="zone"
                >
                  {filteredZoneData.filter(zone => visibleZones[zone.zone]).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={theme.zoneColors[filteredZoneData.findIndex(z => z.zone === entry.zone) % theme.zoneColors.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => value + ' m³'} />
                <Legend 
                  formatter={(value) => <span className={theme.text}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Trends Chart */}
        <div className={`${theme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
          <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Zone Consumption Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={zoneComparisonData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.chartColors.bgGrid} />
                <XAxis dataKey="month" tick={{ fill: theme.text }} />
                <YAxis tick={{ fill: theme.text }} />
                <Tooltip content={(props: any) => <CustomTooltip {...props} theme={theme} />} />
                <Legend wrapperStyle={{ color: theme.text }} />
                
                {Object.keys(visibleZones)
                  .filter(zone => visibleZones[zone])
                  .map((zone, index) => (
                    <Line
                      key={zone}
                      type="monotone"
                      dataKey={zone}
                      name={zone}
                      stroke={theme.zoneColors[index % theme.zoneColors.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  ))
                }
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Loss comparison charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className={`${theme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
          <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Zone Loss Comparison</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredZoneData.filter(zone => visibleZones[zone.zone])}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.chartColors.bgGrid} />
                <XAxis type="number" tick={{ fill: theme.text }} />
                <YAxis type="category" dataKey="zone" tick={{ fill: theme.text }} />
                <Tooltip content={(props: any) => <CustomTooltip {...props} theme={theme} />} />
                <Legend wrapperStyle={{ color: theme.text }} />
                <Bar dataKey="consumption" name="Consumption" fill={theme.chartColors.l2Color} stackId="a" />
                <Bar dataKey="loss" name="Loss" fill={theme.chartColors.lossColor} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${theme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
          <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Zone Loss Percentage</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredZoneData.filter(zone => visibleZones[zone.zone] && zone.lossPercentage > 0)}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.chartColors.bgGrid} />
                <XAxis dataKey="zone" tick={{ fill: theme.text }} />
                <YAxis unit="%" tick={{ fill: theme.text }} />
                <Tooltip formatter={(value: any) => value.toFixed(1) + '%'} />
                <Legend wrapperStyle={{ color: theme.text }} />
                <Bar 
                  dataKey="lossPercentage" 
                  name="Loss Percentage"
                  fill={theme.chartColors.lossColor} 
                >
                  {filteredZoneData
                    .filter(zone => visibleZones[zone.zone] && zone.lossPercentage > 0)
                    .map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.lossPercentage > 50 ? theme.danger : 
                            entry.lossPercentage > 30 ? theme.warning : theme.success} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Zone data table */}
      <div className={`${theme.cardBg} rounded-lg p-4 transition-colors duration-300`}>
        <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Zone Details</h3>
        <DataTable data={filteredZoneData} columns={zoneColumns} theme={theme} />
      </div>
    </>
  );
};

export default ZoneAnalysisTab;
