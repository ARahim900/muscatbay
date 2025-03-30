
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ServiceChargeZoneData, ServiceChargeData } from '@/types/alm';

export const useServiceChargeZones = () => {
  const [zones, setZones] = useState<ServiceChargeZoneData[]>([]);
  const [serviceChargeData, setServiceChargeData] = useState<ServiceChargeData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchZones = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch zones data
        const { data, error: fetchError } = await supabase
          .from('service_charge_zones')
          .select('*')
          .order('code');

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

          // Also fetch property units to get sizes for each zone
          const { data: propertyData, error: propertyError } = await supabase
            .from('property_units')
            .select('zone_code, unit_type, bua')
            .order('zone_code');

          if (propertyError) {
            throw new Error(propertyError.message);
          }

          // Transform data for service charge calculator
          const serviceChargeData: ServiceChargeData = {};
          
          formattedZones.forEach(zone => {
            // Get all properties for this zone
            const zoneProperties = propertyData?.filter(p => p.zone_code === zone.code) || [];
            
            // Get unique unit types in this zone
            const unitTypes = [...new Set(zoneProperties.map(p => p.unit_type))];
            
            // Create unit types object with sizes
            const unitTypesObj: {[key: string]: any} = {};
            
            unitTypes.forEach(type => {
              // Skip if type is null or undefined
              if (!type) return;
              
              // Get all properties of this type
              const propertiesOfType = zoneProperties.filter(p => p.unit_type === type);
              
              // Get unique sizes
              const sizes = [...new Set(propertiesOfType.map(p => p.bua))]
                .filter(size => size !== null)
                .sort((a, b) => a - b);
              
              // Create simplified key for the unit type
              const key = type.toLowerCase()
                .replace(/bedroom/i, 'bed')
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '');
              
              unitTypesObj[key] = {
                name: type,
                baseRate: zone.serviceChargeRate,
                sizes: sizes
              };
            });
            
            serviceChargeData[zone.code.toLowerCase()] = {
              name: zone.name,
              code: zone.code,
              unitTypes: unitTypesObj
            };
          });
          
          setServiceChargeData(serviceChargeData);
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

  return { zones, serviceChargeData, loading, error };
};
