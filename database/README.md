# Muscat Bay Operations Database

This folder contains the CSV data files used by the Muscat Bay Operations application.

## Structure

- `/stp` - Sewage Treatment Plant data
  - `stp-master-database.csv` - Daily operation and maintenance data for the STP plant

- `/electricity` - Electricity consumption data
  - `electrical-consumptions-2024.csv` - Electricity consumption data for different meters

- `/water` - Water consumption data
  - `master-wa-db-table.csv` - Water consumption data for different meters

## Usage

The application uses these data files through the service modules:

- `services/stp-data-service.ts` - Functions for loading and processing STP data
- `services/electricity-data-service.ts` - Functions for loading and processing electricity data
- `services/water-data-service.ts` - Functions for loading and processing water data

These services provide methods to:
- Load and parse the CSV data
- Filter data by date, month, or other criteria
- Calculate metrics and aggregations
- Format data for charts and visualizations

## Data Refresh

The data is loaded and cached on first access. To refresh the data:

1. Replace the CSV files with updated versions (keeping the same filenames)
2. Use the refresh functions in the respective services to reload the data

## Adding New Data

When adding new data:

1. Ensure the CSV format matches the existing files
2. Update the service functions if new fields or calculations are needed
3. Test the data loading and processing before deploying
