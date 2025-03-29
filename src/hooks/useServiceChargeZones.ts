
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ServiceChargeZoneData } from '@/types/alm';

export const useServiceChargeZones = () => {
  const [zones, setZones] = useState<ServiceChargeZoneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchZones = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('service_charge_zones')
          .select('*')
          .order('name');

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (data) {
          const formattedZones: ServiceChargeZoneData[] = data.map(zone => ({
            id: zone.id,
            name: zone.name,
            code: zone.code,
            totalBua: zone.total_bua,
            unitCount: zone.unit_count,
            serviceChargeRate: zone.service_charge_rate,
            reserveFundRate: zone.reserve_fund_rate
          }));

          setZones(formattedZones);
        }
      } catch (err) {
        console.error('Error fetching service charge zones:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchZones();
  }, []);

  return { zones, loading, error };
};
