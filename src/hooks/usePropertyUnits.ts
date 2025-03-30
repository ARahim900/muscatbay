
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PropertyUnit } from '@/types/alm';

export const usePropertyUnits = (options: { 
  zone?: string, 
  sector?: string, 
  unitType?: string,
  status?: string
} = {}) => {
  const [properties, setProperties] = useState<PropertyUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);

      try {
        const { zone, sector, unitType, status } = options;
        
        let query = supabase
          .from('property_units')
          .select(`
            id, 
            unit_no,
            sector,
            zone_code,
            property_type,
            status,
            unit_type,
            bua,
            has_lift,
            plot_size,
            unit_value,
            handover_date,
            anticipated_handover_date,
            property_transactions(
              property_owners(client_name)
            )
          `)
          .order('unit_no');

        // Apply filters if provided
        if (zone) query = query.eq('zone_code', zone);
        if (sector) query = query.eq('sector', sector);
        if (unitType) query = query.eq('unit_type', unitType);
        if (status) query = query.eq('status', status);

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (data) {
          const formattedProperties: PropertyUnit[] = data.map(item => ({
            id: item.id,
            unitNo: item.unit_no,
            sector: item.sector,
            zone: item.zone_code,
            propertyType: item.property_type,
            status: item.status,
            unitType: item.unit_type,
            bua: item.bua,
            hasLift: item.has_lift,
            plotSize: item.plot_size,
            unitValue: item.unit_value,
            handoverDate: item.handover_date,
            anticipatedHandoverDate: item.anticipated_handover_date,
            owner: item.property_transactions?.[0]?.property_owners?.client_name || 'Unknown'
          }));

          setProperties(formattedProperties);
        }
      } catch (err) {
        console.error('Error fetching property units:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [options]);

  return { properties, loading, error };
};
