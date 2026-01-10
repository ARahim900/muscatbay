# Scripts Directory

This directory contains utility scripts for database operations, testing, and data seeding.

## Directory Structure

```
scripts/
├── seeds/      # Data seeding scripts for populating Supabase tables
├── tests/      # Diagnostic and verification scripts
└── utils/      # Discovery, debugging, and utility scripts
```

## Subdirectories

### seeds/
Scripts for inserting data into Supabase tables:
- `seed-amc.js` - Seed AMC contractor data
- `seed-contractor-tracker.js` - Seed contractor tracker table
- `seed-water-final.js` - Final water meter data seeding
- `seed-water-system.js` - Water system configuration seeding
- `insert-contractors.js` - Bulk contractor data insertion

### tests/
Diagnostic scripts to verify Supabase configuration:
- `test-supabase.js` - General Supabase connection test
- `test-water-system.js` - Water system data verification
- `test-contractor-tracker.js` - Contractor table tests
- `test-pricing.js` - Pricing data validation
- `verify-amc.js` - AMC data integrity check

### utils/
Utility and debugging scripts:
- `check-supabase.js` - Supabase configuration validator
- `discover-columns.js` - Database schema explorer
- `generate-stp-inserts.js` - Generate STP operation inserts from CSV
- `debug-rls.js` - Row Level Security debugging

## Usage

Run any script with Node.js:
```bash
node scripts/seeds/seed-water-system.js
node scripts/tests/test-supabase.js
```

> **Note**: Ensure `.env.local` is configured with valid Supabase credentials before running these scripts.
