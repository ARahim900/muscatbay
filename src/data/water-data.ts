
/**
 * Provides water consumption data for the application
 */

/**
 * Gets water consumption data
 * @returns Water consumption data
 */
export function getWaterData() {
  return {
    metadata: {
      version: '1.0',
      timestamp: new Date().toISOString(),
      description: 'Water consumption data for Muscat Bay'
    },
    total: {
      consumption: 48234,
      loss: 2893,
      cost: 25123
    },
    zones: [
      {
        id: 'zone-1',
        name: 'Residential Area',
        consumption: 24120,
        loss: 1446,
        trend: {
          'Jan': 1950,
          'Feb': 1870,
          'Mar': 2050,
          'Apr': 2120,
          'May': 2300,
          'Jun': 2410
        }
      },
      {
        id: 'zone-2',
        name: 'Golf Course',
        consumption: 12045,
        loss: 723,
        trend: {
          'Jan': 950,
          'Feb': 1020,
          'Mar': 1100,
          'Apr': 1150,
          'May': 1000,
          'Jun': 1050
        }
      },
      {
        id: 'zone-3',
        name: 'Commercial Area',
        consumption: 8152,
        loss: 489,
        trend: {
          'Jan': 650,
          'Feb': 670,
          'Mar': 700,
          'Apr': 720,
          'May': 650,
          'Jun': 600
        }
      },
      {
        id: 'zone-4',
        name: 'Recreational Areas',
        consumption: 3917,
        loss: 235,
        trend: {
          'Jan': 300,
          'Feb': 320,
          'Mar': 350,
          'Apr': 340,
          'May': 310,
          'Jun': 330
        }
      }
    ],
    trend: {
      'Jan': 3850,
      'Feb': 3880,
      'Mar': 4200,
      'Apr': 4330,
      'May': 4260,
      'Jun': 4390
    }
  };
}
