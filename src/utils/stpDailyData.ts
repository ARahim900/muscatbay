
/**
 * Sample STP (Sewage Treatment Plant) daily data
 * This will be moved to a JSON file in the future
 */

/**
 * Gets STP daily records
 * @returns Array of STP daily records
 */
export function getStpDailyData() {
  return {
    records: [
      {
        id: 'stp-rec-1',
        date: '2023-07-01',
        plantId: 'stp-001',
        plantName: 'Main STP',
        influentFlow: 450,
        effluentFlow: 430,
        totalSuspendedSolids: 25,
        biochemicalOxygenDemand: 18,
        chemicalOxygenDemand: 45,
        pH: 7.2,
        dissolvedOxygen: 5.8,
        temperature: 26.5,
        remarks: 'Normal operation'
      },
      {
        id: 'stp-rec-2',
        date: '2023-07-02',
        plantId: 'stp-001',
        plantName: 'Main STP',
        influentFlow: 465,
        effluentFlow: 442,
        totalSuspendedSolids: 24,
        biochemicalOxygenDemand: 17,
        chemicalOxygenDemand: 46,
        pH: 7.3,
        dissolvedOxygen: 5.9,
        temperature: 26.8,
        remarks: 'Normal operation'
      },
      // More records would be added here
    ]
  };
}
