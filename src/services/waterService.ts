
import { supabase } from "@/integrations/supabase/client";

export interface WaterMeter {
  id: string;
  meterLabel: string;
  accountNumber: string;
  zone: string;
  type: string;
  parentMeter: string;
  label: string;
  readings: {
    [key: string]: number | null;
  };
}

export interface WaterMetrics {
  totalConsumption: number;
  totalLoss: number;
  lossPercentage: number;
  zoneMetrics: {
    [key: string]: {
      consumption: number;
      loss: number;
      lossPercentage: number;
    };
  };
}

export const waterService = {
  // Fetch water meter data for given period
  async getWaterMeters(period: string): Promise<WaterMeter[]> {
    try {
      const { data, error } = await supabase
        .from('water_distribution_master')
        .select('*')
        .order('meter_label', { ascending: true });

      if (error) throw error;

      // Transform the data to match our interface
      return data.map((meter): WaterMeter => ({
        id: meter.id.toString(),
        meterLabel: meter.meter_label || '',
        accountNumber: meter.account_number || '',
        zone: meter.zone || '',
        type: meter.type || '',
        parentMeter: meter.parent_meter || '',
        // Use a safe approach to get the label field
        label: meter.level || '', // Since level field may not exist, default to empty string
        readings: {
          [period]: meter[period.toLowerCase()] || null
        }
      }));
    } catch (error) {
      console.error('Error fetching water meters:', error);
      return [];
    }
  },

  // Get metrics for a specific zone
  async getZoneMetrics(zone: string, period: string): Promise<WaterMetrics | null> {
    try {
      const { data, error } = await supabase
        .from('Zone_Metrics')
        .select('*')
        .eq('cleaned_zone', zone)
        .single();

      if (error) throw error;

      if (!data) return null;

      return {
        totalConsumption: data.bulksupply || 0,
        totalLoss: data.loss || 0,
        lossPercentage: data.losspercentage || 0,
        zoneMetrics: {
          [zone]: {
            consumption: data.individualmeters || 0,
            loss: data.loss || 0,
            lossPercentage: data.losspercentage || 0
          }
        }
      };
    } catch (error) {
      console.error('Error fetching zone metrics:', error);
      return null;
    }
  },

  // Get all available zones
  async getZones(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('Zone_Metrics')
        .select('cleaned_zone')
        .order('cleaned_zone');

      if (error) throw error;

      return data.map(zone => zone.cleaned_zone).filter(Boolean);
    } catch (error) {
      console.error('Error fetching zones:', error);
      return [];
    }
  },

  // Get monthly consumption data for trend analysis
  async getMonthlyConsumption(year: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('water_consumption_by_zone')
        .select('*')
        .order('zone');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching monthly consumption:', error);
      return [];
    }
  },
  
  // Get water consumption by type
  async getConsumptionByType(period: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('water_consumption_by_type')
        .select('*');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching consumption by type:', error);
      return [];
    }
  },
  
  // Get detailed meter data
  async getMeterDetails(meterId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('water_distribution_master')
        .select('*')
        .eq('id', parseInt(meterId, 10))
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching meter details:', error);
      return null;
    }
  },
  
  // Get water loss data
  async getWaterLossData(): Promise<any[]> {
    try {
      // This would typically fetch from a dedicated water loss table
      // For now, we'll construct it from other tables
      const { data: meters, error } = await supabase
        .from('water_distribution_master')
        .select('*');

      if (error) throw error;

      // Process the data to calculate loss metrics
      // This is a simplified example - in a real application, you would have a more 
      // sophisticated calculation based on your business logic
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const year = new Date().getFullYear().toString().slice(-2);
      
      const result = months.map(month => {
        const key = `${month}_${year}`;
        // Filter meters based on their type or purpose instead of level which may not exist
        const l1Meters = meters.filter(m => m.type === 'Main BULK');
        const l2Meters = meters.filter(m => m.type === 'Zone Bulk');
        const l3Meters = meters.filter(m => m.type !== 'Main BULK' && m.type !== 'Zone Bulk');
        
        const totalSupply = l1Meters.reduce((sum, meter) => sum + (meter[key] || 0), 0);
        const totalDistribution = l2Meters.reduce((sum, meter) => sum + (meter[key] || 0), 0);
        const totalConsumption = l3Meters.reduce((sum, meter) => sum + (meter[key] || 0), 0);
        
        const stage1Loss = totalSupply - totalDistribution;
        const stage2Loss = totalDistribution - totalConsumption;
        const totalLoss = totalSupply - totalConsumption;
        
        const stage1LossPercent = totalSupply > 0 ? (stage1Loss / totalSupply * 100) : 0;
        const stage2LossPercent = totalDistribution > 0 ? (stage2Loss / totalDistribution * 100) : 0;
        const totalLossPercent = totalSupply > 0 ? (totalLoss / totalSupply * 100) : 0;
        
        return {
          period: `${month.charAt(0).toUpperCase() + month.slice(1)}-${year}`,
          totalSupply,
          totalDistribution,
          totalConsumption,
          stage1Loss,
          stage1LossPercent,
          stage2Loss,
          stage2LossPercent,
          totalLoss,
          totalLossPercent
        };
      });
      
      return result.filter(r => r.totalSupply > 0);
    } catch (error) {
      console.error('Error calculating water loss data:', error);
      return [];
    }
  }
};
