
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Droplets } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { cn } from '@/lib/utils';

const COLORS = [
  '#4E4456', // Muscat Primary
  '#68D1CC', // Muscat Teal
  '#D4B98C', // Muscat Gold
  '#9D8EB7', // Muscat Lavender
  '#F7F5F9', // Muscat Light
  '#2A262E', // Muscat Dark
];

interface ConsumptionData {
  name: string;
  zone: string;
  consumption: {
    [key: string]: number;
  };
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<ConsumptionData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [timePeriods, setTimePeriods] = useState<string[]>([]);
  const [totalConsumption, setTotalConsumption] = useState<number>(0);
  const [averageConsumption, setAverageConsumption] = useState<number>(0);
  const [maxConsumption, setMaxConsumption] = useState<number>(0);
  const [consumptionByCategory, setConsumptionByCategory] = useState<CategoryData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  
  const getCategoryFromName = (name: string): string => {
    if (name.toLowerCase().includes('domestic')) return 'Domestic';
    if (name.toLowerCase().includes('fire fighting')) return 'Fire Fighting';
    if (name.toLowerCase().includes('irrigation')) return 'Irrigation';
    return 'Unknown';
  };
  
  useEffect(() => {
    // Set the default selected month to the latest month
    setSelectedMonth('February-25');
    
    // Sample data from the PDF
    const consumptionData = [
      {
        name: "Domestic Water Meter-Villa 1",
        zone: "Zone A",
        consumption: {
          "January-25": 150,
          "February-25": 180,
          "March-25": 200
        }
      },
      {
        name: "Domestic Water Meter-Villa 2",
        zone: "Zone A",
        consumption: {
          "January-25": 160,
          "February-25": 190,
          "March-25": 210
        }
      },
      {
        name: "Domestic Water Meter-Villa 3",
        zone: "Zone B",
        consumption: {
          "January-25": 140,
          "February-25": 170,
          "March-25": 190
        }
      },
      {
        name: "Fire Fighting Meter-Building 1",
        zone: "Zone C",
        consumption: {
          "January-25": 20,
          "February-25": 25,
          "March-25": 30
        }
      },
      {
        name: "Irrigation Meter-Garden 1",
        zone: "Zone D",
        consumption: {
          "January-25": 30,
          "February-25": 35,
          "March-25": 40
        }
      },
      {
        name: "Domestic Water Meter-Apartment 1",
        zone: "Zone B",
        consumption: {
          "January-25": 170,
          "February-25": 200,
          "March-25": 220
        }
      },
      {
        name: "Fire Fighting Meter-Building 2",
        zone: "Zone A",
        consumption: {
          "January-25": 15,
          "February-25": 20,
          "March-25": 25
        }
      },
      {
        name: "Irrigation Meter-Garden 2",
        zone: "Zone C",
        consumption: {
          "January-25": 25,
          "February-25": 30,
          "March-25": 35
        }
      },
      {
        name: "Domestic Water Meter-Villa 4",
        zone: "Zone D",
        consumption: {
          "January-25": 180,
          "February-25": 210,
          "March-25": 230
        }
      },
      {
        name: "Fire Fighting Meter-Building 3",
        zone: "Zone B",
        consumption: {
          "January-25": 10,
          "February-25": 15,
          "March-25": 20
        }
      }
    ];
    
    setData(consumptionData);
    processData(consumptionData);
  }, []);
  
  const processData = (data: ConsumptionData[]) => {
    // Extract unique categories, zones, and time periods
    const uniqueCategories = [...new Set(data.map(item => getCategoryFromName(item.name)))];
    const uniqueZones = [...new Set(data.map(item => item.zone))];
    const uniqueTimePeriods = Object.keys(data[0]?.consumption || {});
    
    setCategories(uniqueCategories);
    setZones(uniqueZones);
    setTimePeriods(uniqueTimePeriods);
    
    // Calculate total consumption
    const total = data.reduce((sum, item) => {
      const itemTotal = Object.values(item.consumption).reduce((a: number, b: number) => Number(a) + Number(b), 0);
      return sum + itemTotal;
    }, 0);
    setTotalConsumption(total);
    
    // Calculate average consumption
    const avg = total / (data.length * uniqueTimePeriods.length);
    setAverageConsumption(avg);
    
    // Find max consumption
    const max = data.reduce((currentMax, item) => {
      const itemMax = Math.max(...Object.values(item.consumption).map(val => Number(val)));
      return Math.max(currentMax, itemMax);
    }, 0);
    setMaxConsumption(max);
    
    // Process consumption by category
    const byCategory: CategoryData[] = uniqueCategories.map(category => {
      const categoryItems = data.filter(item => getCategoryFromName(item.name) === category);
      const categoryTotal = categoryItems.reduce((sum, item) => {
        return sum + Object.values(item.consumption).reduce((a: number, b: number) => Number(a) + Number(b), 0);
      }, 0);
      
      return {
        name: category,
        value: categoryTotal,
        percentage: (categoryTotal / total) * 100
      };
    });
    setConsumptionByCategory(byCategory);
  };
  
  const consumptionDataForSelectedMonth = data.map(item => ({
    name: item.name,
    consumption: item.consumption[selectedMonth] || 0
  }));
  
  const consumptionByCategoryForChart = consumptionByCategory.map(item => ({
    name: item.name,
    value: item.value
  }));
  
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4 text-muscat-primary">Water Distribution Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard 
          title="Total Consumption" 
          value={totalConsumption} 
          icon={Droplets} 
          description="Total water consumption across all meters"
        />
        <StatCard 
          title="Average Consumption" 
          value={averageConsumption.toFixed(2)} 
          icon={Droplets} 
          description="Average water consumption per meter"
        />
        <StatCard 
          title="Max Consumption" 
          value={maxConsumption} 
          icon={Droplets} 
          description="Highest water consumption recorded"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardCard>
          <h2 className="text-lg font-semibold mb-2">Consumption by Meter</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={consumptionDataForSelectedMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="consumption" fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        </DashboardCard>
        
        <DashboardCard>
          <h2 className="text-lg font-semibold mb-2">Consumption by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                dataKey="value"
                data={consumptionByCategoryForChart}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              >
                {consumptionByCategoryForChart.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </DashboardCard>
      </div>
    </div>
  );
};

export default Dashboard;
