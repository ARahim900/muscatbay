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
        label: meter.label || '',
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
  }
};
