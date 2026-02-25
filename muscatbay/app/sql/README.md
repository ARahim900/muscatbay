# SQL Directory

Database schema definitions and seed data for the Muscat Bay application.

## Directory Structure

```
sql/
├── schema/     # Table definitions and DDL statements
├── data/       # Seed data and DML statements
└── *.sql       # Core table definitions
```

## Schema Files (`schema/`)

| File | Description |
|------|-------------|
| `amc-setup.sql` | AMC contractor base tables |
| `create-amc-tables.sql` | Full AMC table schema with relationships |
| `electricity-setup.sql` | Electricity meters and readings tables |
| `supabase-setup.sql` | Core Supabase configuration |
| `supabase-user-setup.sql` | User authentication and profiles |

## Data Files (`data/`)

| File | Description |
|------|-------------|
| `amc-correct-data.sql` | Corrected AMC contractor data |
| `contractor-data.sql` | Contractor tracker seed data |

## Core Files

| File | Description |
|------|-------------|
| `profiles_table.sql` | User profiles table with RLS policies |
| `stp_operations_table.sql` | STP plant operations schema |
| `stp_operations_data.sql` | STP historical data (518 records) |
| `water_system_table.sql` | Water meter system schema |
| `fix_water_rls.sql` | Water table RLS policy fixes |

## Execution Order

For a fresh setup, execute in this order:

1. **Core Configuration**
   ```sql
   -- Run in Supabase SQL Editor
   sql/schema/supabase-setup.sql
   sql/schema/supabase-user-setup.sql
   ```

2. **Table Schemas**
   ```sql
   sql/profiles_table.sql
   sql/water_system_table.sql
   sql/stp_operations_table.sql
   sql/schema/electricity-setup.sql
   sql/schema/create-amc-tables.sql
   ```

3. **Seed Data**
   ```sql
   sql/stp_operations_data.sql
   sql/data/amc-correct-data.sql
   sql/data/contractor-data.sql
   ```

4. **RLS Fixes** (if needed)
   ```sql
   sql/fix_water_rls.sql
   ```
