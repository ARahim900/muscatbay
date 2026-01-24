# Contributing to Muscat Bay Dashboard

Thank you for your interest in contributing to the Muscat Bay Dashboard project. This document provides guidelines to help you contribute effectively.

## Development Setup

1. **Prerequisites**
   - Node.js (v18+)
   - npm or yarn
   - PowerShell (if on Windows)

2. **Installation**
   ```bash
   cd app
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     ```

4. **Running Locally**
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:3000`.

## Project Structure

We follow a strict folder structure to maintain organization:

- **/app**: Next.js App Router pages.
- **/components**: Reusable UI components.
- **/entities**: Database models and type definitions.
- **/functions**: Backend business logic and API wrappers.
- **/sql**: Database schema, data seeds, and migrations.
  - `/sql/schema`: Table definitions
  - `/sql/data`: Seed data
  - `/sql/migrations`: Versioned database updates
  - `/sql/fixes`: One-off fixes and patches

See [FOLDER_STRUCTURE.md](./app/FOLDER_STRUCTURE.md) for detailed documentation.

## Code Style

- **TypeScript**: We use strict TypeScript. Avoid `any` types.
- **Linting**: Run `npm run lint` before committing.
- **Formatting**: Code should be clean and readable.

## Testing

We use two testing frameworks:

1. **Unit Tests (Vitest)**
   - Located in `__tests__/`
   - Run with: `npm run test`
   - Focus on utility functions, hooks, and individual components.

2. **E2E Tests (TestSprite/Python)**
   - Located in `testsprite_tests/`
   - Run via TestSprite integration.
   - Focus on full user flows and dashboard interactions.

## Submitting Changes

1. Create a new branch: `git checkout -b feature/my-feature`
2. Make your changes.
3. Verify tests pass: `npm run test`
4. Commit changes: `git commit -m "feat: description of changes"`
5. Push to your branch and open a Pull Request.

## Database Updates

If your change involves database schema modifications:
1. Create a new SQL file in `app/sql/migrations/`.
2. Name it descriptively, e.g., `update_water_readings_jan26.sql`.
3. Test the SQL script against a local or development database.

Thank you for contributing!
