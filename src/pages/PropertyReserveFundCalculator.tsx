
import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Sector
} from 'recharts';

// TypeScript Interfaces
interface PropertyUnit {
  unitNo: string;
  sector: string;
  zone: number;
  unitType: string;
  bua: number; // Assuming Built-Up Area is in sqft based on rate units
  plot: number; // Plot number for villas, 0 for apartments/other
  building?: string; // Optional: For multi-unit buildings like Staff Accomm.
}

interface Asset {
  id: string;
  componentName: string;
  details: string;
  zone: string; // Matches ZoneInfo.name
  quantity: number;
  unit: string;
  currentCost: number;
  lifeExpectancy: number;
  remainingLife: number;
  nextMaintenanceYear: number;
  maintenanceType: string;
}

interface ReserveFundProjection {
  year: number;
  openingBalance: number;
  contribution: number;
  interest: number;
  totalIncome: number;
  expenditure: number;
  reserveBalance: number;
  contributionRate: number; // OMR per sqft
}

interface ZoneInfo {
  id: number;
  name: string;
  description: string;
  contributionRate: number; // OMR per sqft
  totalArea: number; // sqft
}

// Sample data from the documents
const zoneData: ZoneInfo[] = [
  { id: 0, name: "Master Community", description: "Master Community Infrastructure", contributionRate: 0.16, totalArea: 1037282 },
  { id: 3, name: "Zone 3 (Al Zaha)", description: "Zone 3 - 21 buildings & 43 villas", contributionRate: 0.03, totalArea: 510521.5 }, // Total Area likely needs update if apartments changed
  { id: 5, name: "Zone 5 (Al Nameer)", description: "Zone 5 - 33 villas", contributionRate: 0.10, totalArea: 171426.04 },
  { id: 8, name: "Zone 8 (Al Wajd)", description: "Zone 8 - 22 villas", contributionRate: 0.03, totalArea: 211230.98 },
  { id: 9, name: "Staff Accommodation & CF", description: "Staff accommodation buildings & CF", contributionRate: 0.36, totalArea: 144904 }, // Includes multiple buildings
  { id: 10, name: "Typical Building", description: "Applies to each typical building", contributionRate: 0.15, totalArea: 15810.78 } // Represents a single typical building's area? Check docs.
];

// Property BUA data from provided document
const allPropertyUnits: PropertyUnit[] = [
  // Zone 3 (Zaha) Villas
  { unitNo: "Z3 001", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 1 },
  { unitNo: "Z3 002", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 2 },
  { unitNo: "Z3 003", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 3 },
  { unitNo: "Z3 004", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 4 },
  { unitNo: "Z3 005", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 5 },
  { unitNo: "Z3 006", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 6 },
  { unitNo: "Z3 007", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 7 },
  { unitNo: "Z3 008", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 8 },
  { unitNo: "Z3 009", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 9 },
  { unitNo: "Z3 010", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 10 },
  { unitNo: "Z3 011", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 11 },
  { unitNo: "Z3 012", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 12 },
  { unitNo: "Z3 013", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 13 },
  { unitNo: "Z3 014", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 14 },
  { unitNo: "Z3 015", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 15 },
  { unitNo: "Z3 016", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 16 },
  { unitNo: "Z3 017", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Villa", bua: 357, plot: 17 },
  { unitNo: "Z3 018", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Villa", bua: 357, plot: 18 },
  { unitNo: "Z3 019", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Villa", bua: 357, plot: 19 },
  { unitNo: "Z3 020", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Villa", bua: 357, plot: 20 },
  { unitNo: "Z3 021", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Villa", bua: 357, plot: 21 },
  { unitNo: "Z3 022", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Villa", bua: 357, plot: 22 },
  { unitNo: "Z3 023", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Villa", bua: 357, plot: 23 },
  { unitNo: "Z3 024", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Villa", bua: 357, plot: 24 },
  { unitNo: "Z3 025", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Villa", bua: 357, plot: 25 },
  { unitNo: "Z3 026", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Villa", bua: 357, plot: 26 },
  { unitNo: "Z3 027", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Villa", bua: 357, plot: 27 },
  { unitNo: "Z3 028", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Villa", bua: 357, plot: 28 },
  { unitNo: "Z3 029", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Villa", bua: 357, plot: 29 },
  { unitNo: "Z3 030", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Villa", bua: 357, plot: 30 },
  { unitNo: "Z3 031", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 31 },
  { unitNo: "Z3 032", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 32 },
  { unitNo: "Z3 033", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 33 },
  { unitNo: "Z3 034", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 34 },
  { unitNo: "Z3 035", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 35 },
  { unitNo: "Z3 036", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 36 },
  { unitNo: "Z3 037", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 37 },
  { unitNo: "Z3 038", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 38 },
  { unitNo: "Z3 039", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 39 },
  { unitNo: "Z3 040", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 40 },
  { unitNo: "Z3 041", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 41 },
  { unitNo: "Z3 042", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 42 },
  { unitNo: "Z3 043", sector: "Zaha", zone: 3, unitType: "4 Bedroom Zaha Villa", bua: 422, plot: 43 },

  // ****** START: Updated Zone 3 (Zaha) Apartments ******
  // Zone 3 (Zaha) Apartments - Building 044
  { unitNo: "Z3 044(1)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 044(2)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 044(3)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 044(4)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 044(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 044(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 045
  { unitNo: "Z3 045(1)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 045(2)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 045(3)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 045(4)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 045(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 045(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 046
  { unitNo: "Z3 046(1)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 046(2)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 046(3)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 046(4)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 046(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 046(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 047
  { unitNo: "Z3 047(1)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 047(2)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 047(3)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 047(4)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 047(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 047(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 048
  { unitNo: "Z3 048(1)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 048(2)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 048(3)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 048(4)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 048(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 048(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 049
  { unitNo: "Z3 049(1)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 049(2)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 049(3)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 049(4)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 049(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 049(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 050
  { unitNo: "Z3 050(1)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 050(2)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 050(3)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 050(4)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 050(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 050(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 051
  { unitNo: "Z3 051(1)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 051(2)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 051(3)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 051(4)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 051(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 051(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 052
  { unitNo: "Z3 052(1)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 052(2)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 052(3)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 052(4)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 052(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 052(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 053
  { unitNo: "Z3 053(1A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 053(1B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 053(2A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 053(2B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 053(3A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 053(3B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 053(4A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 053(4B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 053(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 053(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 054
  { unitNo: "Z3 054(1A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 054(1B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 054(2A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 054(2B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 054(3A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 054(3B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 054(4A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 054(4B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 054(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 054(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 055
  { unitNo: "Z3 055(1A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 055(1B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 055(2A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 055(2B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 055(3A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 055(3B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 055(4A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 055(4B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 055(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 055(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 056
  { unitNo: "Z3 056(1A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 056(1B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 056(2A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 056(2B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 056(3A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 056(3B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 056(4A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 056(4B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 056(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 056(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 057
  { unitNo: "Z3 057(1A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 057(1B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 057(2A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 057(2B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 057(3A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 057(3B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 057(4A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 057(4B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 057(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 057(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 058
  { unitNo: "Z3 058(1A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 058(1B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 058(2A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 058(2B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 058(3A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 058(3B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 058(4A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 058(4B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 058(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 058(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 059
  { unitNo: "Z3 059(1A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 059(1B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 059(2A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 059(2B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 059(3A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 059(3B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 059(4A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 059(4B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 059(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 059(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 060
  { unitNo: "Z3 060(1A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 060(1B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 060(2A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 060(2B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 060(3A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 060(3B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 060(4A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 060(4B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 060(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 060(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 061
  { unitNo: "Z3 061(1A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 061(1B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 061(2A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 061(2B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 061(3A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 061(3B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 061(4A)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Small Apartment", bua: 115, plot: 0 },
  { unitNo: "Z3 061(4B)", sector: "Zaha", zone: 3, unitType: "1 Bedroom Apartment", bua: 79, plot: 0 },
  { unitNo: "Z3 061(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 061(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 062
  { unitNo: "Z3 062(1)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 062(2)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 062(3)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 062(4)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 062(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 062(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 074
  { unitNo: "Z3 074(1)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 074(2)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 074(3)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 074(4)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 074(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 074(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },

  // Zone 3 (Zaha) Apartments - Building 075
  { unitNo: "Z3 075(1)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 075(2)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 075(3)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 075(4)", sector: "Zaha", zone: 3, unitType: "2 Bedroom Premium Apartment", bua: 199, plot: 0 },
  { unitNo: "Z3 075(5)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 355, plot: 0 },
  { unitNo: "Z3 075(6)", sector: "Zaha", zone: 3, unitType: "3 Bedroom Zaha Apartment", bua: 361, plot: 0 },
  // ****** END: Updated Zone 3 (Zaha) Apartments ******

  // Zone 5 (Nameer) Properties - All 33 villas
  { unitNo: "Z5 001", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 1 },
  { unitNo: "Z5 002", sector: "Nameer", zone: 5, unitType: "3 Bedroom Nameer Villa", bua: 427, plot: 2 },
  { unitNo: "Z5 003", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 3 },
  { unitNo: "Z5 004", sector: "Nameer", zone: 5, unitType: "3 Bedroom Nameer Villa", bua: 427, plot: 4 },
  { unitNo: "Z5 005", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 5 },
  { unitNo: "Z5 006", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 6 },
  { unitNo: "Z5 007", sector: "Nameer", zone: 5, unitType: "3 Bedroom Nameer Villa", bua: 427, plot: 7 },
  { unitNo: "Z5 008", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 8 },
  { unitNo: "Z5 009", sector: "Nameer", zone: 5, unitType: "3 Bedroom Nameer Villa", bua: 427, plot: 9 },
  { unitNo: "Z5 010", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 10 },
  { unitNo: "Z5 011", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 11 },
  { unitNo: "Z5 012", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 12 },
  { unitNo: "Z5 013", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 13 },
  { unitNo: "Z5 014", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 14 },
  { unitNo: "Z5 015", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 15 },
  { unitNo: "Z5 016", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 16 },
  { unitNo: "Z5 017", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 17 },
  { unitNo: "Z5 018", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 18 },
  { unitNo: "Z5 019", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 19 },
  { unitNo: "Z5 020", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 20 },
  { unitNo: "Z5 021", sector: "Nameer", zone: 5, unitType: "3 Bedroom Nameer Villa", bua: 427, plot: 21 },
  { unitNo: "Z5 022", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 22 },
  { unitNo: "Z5 023", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 23 },
  { unitNo: "Z5 024", sector: "Nameer", zone: 5, unitType: "3 Bedroom Nameer Villa", bua: 427, plot: 24 },
  { unitNo: "Z5 025", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 25 },
  { unitNo: "Z5 026", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 26 },
  { unitNo: "Z5 027", sector: "Nameer", zone: 5, unitType: "3 Bedroom Nameer Villa", bua: 427, plot: 27 },
  { unitNo: "Z5 028", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 28 },
  { unitNo: "Z5 029", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 29 },
  { unitNo: "Z5 030", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 30 },
  { unitNo: "Z5 031", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 31 },
  { unitNo: "Z5 032", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 32 },
  { unitNo: "Z5 033", sector: "Nameer", zone: 5, unitType: "4 Bedroom Nameer Villa", bua: 498, plot: 33 },

  // Zone 8 (Wajd) Properties - All 22 villas
  { unitNo: "Z8 001", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 750, plot: 1 },
  { unitNo: "Z8 002", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 750, plot: 2 },
  { unitNo: "Z8 003", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 750, plot: 3 },
  { unitNo: "Z8 004", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 750, plot: 4 },
  { unitNo: "Z8 005", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 943, plot: 5 },
  { unitNo: "Z8 006", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 760, plot: 6 },
  { unitNo: "Z8 007", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 750, plot: 7 },
  { unitNo: "Z8 008", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 760, plot: 8 },
  { unitNo: "Z8 009", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 1187, plot: 9 },
  { unitNo: "Z8 010", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 760, plot: 10 },
  { unitNo: "Z8 011", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 750, plot: 11 },
  { unitNo: "Z8 012", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 760, plot: 12 },
  { unitNo: "Z8 013", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 760, plot: 13 },
  { unitNo: "Z8 014", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 760, plot: 14 },
  { unitNo: "Z8 015", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 760, plot: 15 },
  { unitNo: "Z8 016", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 760, plot: 16 },
  { unitNo: "Z8 017", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 750, plot: 17 },
  { unitNo: "Z8 018", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 760, plot: 18 },
  { unitNo: "Z8 019", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 750, plot: 19 },
  { unitNo: "Z8 020", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 760, plot: 20 },
  { unitNo: "Z8 021", sector: "Wajd", zone: 8, unitType: "5 Bedroom Wajd Villa", bua: 750, plot: 21 },
  { unitNo: "Z8 022", sector: "Wajd", zone: 8, unitType: "King Villa", bua: 1845, plot: 22 },

// Staff Accommodation & Central Facilities
  { unitNo: "SA-B1-101", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 800, plot: 0, building: "SA-B1" },
  { unitNo: "SA-B1-102", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 750, plot: 0, building: "SA-B1" },
  { unitNo: "SA-B1-103", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 780, plot: 0, building: "SA-B1" },
  { unitNo: "SA-B1-104", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 820, plot: 0, building: "SA-B1" },

  { unitNo: "SA-B2-101", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 790, plot: 0, building: "SA-B2" },
  { unitNo: "SA-B2-102", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 760, plot: 0, building: "SA-B2" },
  { unitNo: "SA-B2-103", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 775, plot: 0, building: "SA-B2" },
  { unitNo: "SA-B2-104", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 810, plot: 0, building: "SA-B2" },

  { unitNo: "SA-B3-101", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 795, plot: 0, building: "SA-B3" },
  { unitNo: "SA-B3-102", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 745, plot: 0, building: "SA-B3" },
  { unitNo: "SA-B3-103", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 770, plot: 0, building: "SA-B3" },
  { unitNo: "SA-B3-104", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 805, plot: 0, building: "SA-B3" },

  { unitNo: "SA-B4-101", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 785, plot: 0, building: "SA-B4" },
  { unitNo: "SA-B4-102", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 755, plot: 0, building: "SA-B4" },
  { unitNo: "SA-B4-103", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 765, plot: 0, building: "SA-B4" },
  { unitNo: "SA-B4-104", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 815, plot: 0, building: "SA-B4" },

  { unitNo: "SA-B5-101", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 792, plot: 0, building: "SA-B5" },
  { unitNo: "SA-B5-102", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 758, plot: 0, building: "SA-B5" },
  { unitNo: "SA-B5-103", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 772, plot: 0, building: "SA-B5" },
  { unitNo: "SA-B5-104", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 812, plot: 0, building: "SA-B5" },

  { unitNo: "SA-B6-101", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 798, plot: 0, building: "SA-B6" },
  { unitNo: "SA-B6-102", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 752, plot: 0, building: "SA-B6" },
  { unitNo: "SA-B6-103", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 778, plot: 0, building: "SA-B6" },
  { unitNo: "SA-B6-104", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 808, plot: 0, building: "SA-B6" },

  { unitNo: "SA-B7-101", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 788, plot: 0, building: "SA-B7" },
  { unitNo: "SA-B7-102", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 748, plot: 0, building: "SA-B7" },
  { unitNo: "SA-B7-103", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 768, plot: 0, building: "SA-B7" },
  { unitNo: "SA-B7-104", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 818, plot: 0, building: "SA-B7" },

  { unitNo: "SA-B8-101", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 782, plot: 0, building: "SA-B8" },
  { unitNo: "SA-B8-102", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 742, plot: 0, building: "SA-B8" },
  { unitNo: "SA-B8-103", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 762, plot: 0, building: "SA-B8" },
  { unitNo: "SA-B8-104", sector: "Staff", zone: 9, unitType: "Staff Accommodation", bua: 822, plot: 0, building: "SA-B8" },

  { unitNo: "CF-101", sector: "Commercial", zone: 9, unitType: "CF Building", bua: 2000, plot: 0, building: "CF" },
  { unitNo: "CF-102", sector: "Commercial", zone: 9, unitType: "CF Building", bua: 1800, plot: 0, building: "CF" },
  { unitNo: "CF-103", sector: "Commercial", zone: 9, unitType: "CF Building", bua: 1900, plot: 0, building: "CF" },
  { unitNo: "CF-104", sector: "Commercial", zone: 9, unitType: "CF Building", bua: 2100, plot: 0, building: "CF" },
];

// Asset sample data from the documents
const allAssets: Asset[] = [
  { id: "1.1", componentName: "Distribution Board", details: "Refurbish", zone: "Typical Building", quantity: 2, unit: "sqm", currentCost: 178, lifeExpectancy: 20, remainingLife: 20, nextMaintenanceYear: 2040, maintenanceType: "Replace" },
  { id: "2.1", componentName: "Internal & External Lighting System", details: "Replace", zone: "Typical Building", quantity: 1, unit: "LS", currentCost: 876, lifeExpectancy: 10, remainingLife: 10, nextMaintenanceYear: 2030, maintenanceType: "Replace" },
  { id: "3.1", componentName: "Fire Alarm Control Panel", details: "Upgrade", zone: "Typical Building", quantity: 1, unit: "Nos", currentCost: 270, lifeExpectancy: 15, remainingLife: 15, nextMaintenanceYear: 2035, maintenanceType: "Upgrade" },
  { id: "1.1", componentName: "Tree Uplighter", details: "Replace", zone: "Zone 3 (Al Zaha)", quantity: 45, unit: "Nos", currentCost: 1120, lifeExpectancy: 15, remainingLife: 14, nextMaintenanceYear: 2034, maintenanceType: "Replace" },
  { id: "1.2", componentName: "Recessed Stair Lighting", details: "Replace", zone: "Zone 3 (Al Zaha)", quantity: 143, unit: "Nos", currentCost: 9176, lifeExpectancy: 12, remainingLife: 11, nextMaintenanceYear: 2031, maintenanceType: "Replace" },
  { id: "1.1", componentName: "Tree Uplighter", details: "Replace", zone: "Zone 5 (Al Nameer)", quantity: 175, unit: "Nos", currentCost: 37312, lifeExpectancy: 15, remainingLife: 14, nextMaintenanceYear: 2034, maintenanceType: "Replace" },
  { id: "1.2", componentName: "Recessed Stair Lighting", details: "Replace", zone: "Zone 5 (Al Nameer)", quantity: 13, unit: "Nos", currentCost: 1704, lifeExpectancy: 18, remainingLife: 17, nextMaintenanceYear: 2037, maintenanceType: "Replace" },
  { id: "1.1", componentName: "Tree Uplighter", details: "Replace", zone: "Zone 8 (Al Wajd)", quantity: 52, unit: "Nos", currentCost: 10856, lifeExpectancy: 18, remainingLife: 17, nextMaintenanceYear: 2037, maintenanceType: "Replace" },
  { id: "1.1", componentName: "Main Distribution Boards", details: "to the café", zone: "Staff Accommodation & CF", quantity: 1, unit: "Nos", currentCost: 680, lifeExpectancy: 20, remainingLife: 20, nextMaintenanceYear: 2040, maintenanceType: "Replace" },
  { id: "2.1", componentName: "Internal lighting Points System", details: "", zone: "Staff Accommodation & CF", quantity: 1, unit: "LS", currentCost: 4730, lifeExpectancy: 15, remainingLife: 15, nextMaintenanceYear: 2035, maintenanceType: "Replace" },
  { id: "1.1", componentName: "Roads", details: "Refurbish", zone: "Master Community", quantity: 1, unit: "LS", currentCost: 83704, lifeExpectancy: 25, remainingLife: 23, nextMaintenanceYear: 2043, maintenanceType: "Refurbish" },
  { id: "1.2", componentName: "Concrete Pavements", details: "Replace", zone: "Master Community", quantity: 1, unit: "LS", currentCost: 51350, lifeExpectancy: 30, remainingLife: 28, nextMaintenanceYear: 2048, maintenanceType: "Replace" },
];

// Financial projection data from the documents
const financialProjections: { [key: string]: ReserveFundProjection[] } = {
  "Typical Building": [
    { year: 2021, openingBalance: 0, contribution: 2447, interest: 0, totalIncome: 2447, expenditure: 0, reserveBalance: 2447, contributionRate: 0.15 },
    { year: 2022, openingBalance: 2447, contribution: 2460, interest: 0, totalIncome: 4944, expenditure: 0, reserveBalance: 4944, contributionRate: 0.15 },
    { year: 2023, openingBalance: 4944, contribution: 2472, interest: 0, totalIncome: 7490, expenditure: 1693, reserveBalance: 5797, contributionRate: 0.15 },
    { year: 2024, openingBalance: 5797, contribution: 2484, interest: 0, totalIncome: 8368, expenditure: 0, reserveBalance: 8368, contributionRate: 0.15 },
    { year: 2025, openingBalance: 8368, contribution: 2497, interest: 0, totalIncome: 10990, expenditure: 132, reserveBalance: 10858, contributionRate: 0.15 }
  ],
  "Zone 3 (Al Zaha)": [
    { year: 2021, openingBalance: 0, contribution: 13624, interest: 0, totalIncome: 13624, expenditure: 0, reserveBalance: 13624, contributionRate: 0.03 },
    { year: 2022, openingBalance: 13624, contribution: 13692, interest: 0, totalIncome: 27520, expenditure: 0, reserveBalance: 27520, contributionRate: 0.03 },
    { year: 2023, openingBalance: 27520, contribution: 13760, interest: 0, totalIncome: 41694, expenditure: 0, reserveBalance: 41694, contributionRate: 0.03 },
    { year: 2024, openingBalance: 41694, contribution: 13829, interest: 0, totalIncome: 56148, expenditure: 7177, reserveBalance: 48971, contributionRate: 0.03 },
    { year: 2025, openingBalance: 48971, contribution: 13898, interest: 0, totalIncome: 63604, expenditure: 0, reserveBalance: 63604, contributionRate: 0.03 }
  ],
  "Zone 5 (Al Nameer)": [
    { year: 2021, openingBalance: 0, contribution: 17914, interest: 0, totalIncome: 17914, expenditure: 9490, reserveBalance: 8424, contributionRate: 0.10 },
    { year: 2022, openingBalance: 8424, contribution: 18003, interest: 0, totalIncome: 26553, expenditure: 9490, reserveBalance: 17063, contributionRate: 0.10 },
    { year: 2023, openingBalance: 17063, contribution: 18093, interest: 0, totalIncome: 35413, expenditure: 0, reserveBalance: 35413, contributionRate: 0.10 },
    { year: 2024, openingBalance: 35413, contribution: 18184, interest: 0, totalIncome: 54128, expenditure: 0, reserveBalance: 54128, contributionRate: 0.10 },
    { year: 2025, openingBalance: 54128, contribution: 18275, interest: 0, totalIncome: 73215, expenditure: 9633, reserveBalance: 63581, contributionRate: 0.10 }
  ],
  "Zone 8 (Al Wajd)": [
    { year: 2021, openingBalance: 0, contribution: 7281, interest: 0, totalIncome: 7281, expenditure: 0, reserveBalance: 7281, contributionRate: 0.03 },
    { year: 2022, openingBalance: 7281, contribution: 7317, interest: 0, totalIncome: 14707, expenditure: 0, reserveBalance: 14707, contributionRate: 0.03 },
    { year: 2023, openingBalance: 14707, contribution: 7354, interest: 0, totalIncome: 22282, expenditure: 0, reserveBalance: 22282, contributionRate: 0.03 },
    { year: 2024, openingBalance: 22282, contribution: 7391, interest: 0, totalIncome: 30007, expenditure: 0, reserveBalance: 30007, contributionRate: 0.03 },
    { year: 2025, openingBalance: 30007, contribution: 7428, interest: 0, totalIncome: 37884, expenditure: 0, reserveBalance: 37884, contributionRate: 0.03 }
  ],
  "Staff Accommodation & CF": [
    { year: 2021, openingBalance: 0, contribution: 52636, interest: 0, totalIncome: 52636, expenditure: 0, reserveBalance: 52636, contributionRate: 0.36 },
    { year: 2022, openingBalance: 52636, contribution: 52899, interest: 790, totalIncome: 106324, expenditure: 0, reserveBalance: 106324, contributionRate: 0.36 },
    { year: 2023, openingBalance: 106324, contribution: 53163, interest: 1595, totalIncome: 161082, expenditure: 0, reserveBalance: 161082, contributionRate: 0.36 },
    { year: 2024, openingBalance: 161082, contribution: 53429, interest: 2416, totalIncome: 216927, expenditure: 0, reserveBalance: 216927, contributionRate: 0.36 },
    { year: 2025, openingBalance: 216927, contribution: 53696, interest: 3254, totalIncome: 273878, expenditure: 0, reserveBalance: 273878, contributionRate: 0.36 }
  ],
  "Master Community": [
    { year: 2021, openingBalance: 0, contribution: 166360, interest: 0, totalIncome: 166360, expenditure: 0, reserveBalance: 166360, contributionRate: 0.16 },
    { year: 2022, openingBalance: 166360, contribution: 167192, interest: 0, totalIncome: 336047, expenditure: 0, reserveBalance: 336047, contributionRate: 0.16 },
    { year: 2023, openingBalance: 336047, contribution: 168028, interest: 0, totalIncome: 509116, expenditure: 0, reserveBalance: 509116, contributionRate: 0.16 },
    { year: 2024, openingBalance: 509116, contribution: 168868, interest: 0, totalIncome: 685621, expenditure: 11140, reserveBalance: 674481, contributionRate: 0.16 },
    { year: 2025, openingBalance: 674481, contribution: 169712, interest: 0, totalIncome: 854310, expenditure: 55958, reserveBalance: 798352, contributionRate: 0.16 }
  ]
};

// Main application component
const PropertyReserveFundCalculator = () => {
  // State declarations
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [selectedUnitType, setSelectedUnitType] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<PropertyUnit | null>(null);
  const [yearRange, setYearRange] = useState<number>(5); // Default projection range
  const [sortBy, setSortBy] = useState<string>("date"); // Default asset sort
  const [inflationRate, setInflationRate] = useState<number>(0.5); // Default inflation
  const [interestRate, setInterestRate] = useState<number>(1.5); // Default interest
  const [activeTab, setActiveTab] = useState<string>("dashboard"); // Default tab

  // Derived values and calculations
  const unitTypes = useMemo(() => {
    if (!selectedZone) return [];

    // Get all unique unit types for the selected zone
    const types = [...new Set(allPropertyUnits
      .filter(unit => unit.zone === selectedZone)
      .map(unit => unit.unitType))];

    // Group similar unit types for better dropdown organization
    const groupedTypes = [];

    // Add villa types first
    const villaTypes = types.filter(type => type.includes('Villa')).sort();
    if (villaTypes.length > 0) {
      groupedTypes.push(...villaTypes);
    }

    // Add apartment types
    const apartmentTypes = types.filter(type => type.includes('Apartment')).sort();
    if (apartmentTypes.length > 0) {
      groupedTypes.push(...apartmentTypes);
    }

    // Add other types (e.g., Staff Accommodation, CF Building)
    const otherTypes = types.filter(type => !type.includes('Villa') && !type.includes('Apartment')).sort();
    if (otherTypes.length > 0) {
      groupedTypes.push(...otherTypes);
    }

    return groupedTypes;
  }, [selectedZone]);

  const units = useMemo(() => {
    if (!selectedZone || !selectedUnitType) return [];

    // Filter units by selected zone and unit type
    return allPropertyUnits.filter(
      unit => unit.zone === selectedZone && unit.unitType === selectedUnitType
    );
  }, [selectedZone, selectedUnitType]);

  const zoneInfo = useMemo(() => {
    if (!selectedZone) return null;
    return zoneData.find(zone => zone.id === selectedZone) || null;
  }, [selectedZone]);

  const zonalAssets = useMemo(() => {
    if (!selectedZone) return [];

    const zoneName = zoneData.find(z => z.id === selectedZone)?.name || "";
    // Also include assets from "Typical Building" if the selected zone is one where it applies (e.g., Zone 3 apartments)
    // This logic might need refinement based on exact rules, assuming here Typical Building assets apply to Zone 3 apartments
    const isTypicalApplicable = zoneName === "Zone 3 (Al Zaha)"; // Simplified assumption
    const typicalBuildingName = zoneData.find(z => z.id === 10)?.name || "";

    return allAssets.filter(asset =>
        asset.zone === zoneName || (isTypicalApplicable && asset.zone === typicalBuildingName)
    );
  }, [selectedZone]);

  const calculateContribution = () => {
    if (!selectedUnit || !zoneInfo) return null;

    // Contribution from the unit's primary zone rate
    const baseContribution = selectedUnit.bua * zoneInfo.contributionRate;

    // Check if the "Typical Building" rate applies to this specific unit
    // Assuming it applies to all apartments in Zone 3 for this example
    let typicalBuildingContribution = 0;
    if (selectedUnit.unitType.includes("Apartment") && selectedZone === 3) {
      const typicalBuildingRate = zoneData.find(z => z.id === 10)?.contributionRate || 0;
      typicalBuildingContribution = selectedUnit.bua * typicalBuildingRate;
    }

    const totalContribution = baseContribution + typicalBuildingContribution;

    return {
      baseContribution,
      typicalBuildingContribution,
      totalContribution,
      contributionRate: zoneInfo.contributionRate, // Base zone rate
      typicalBuildingRate: typicalBuildingContribution > 0 ? (zoneData.find(z => z.id === 10)?.contributionRate || 0) : 0,
      zoneArea: zoneInfo.totalArea // Total area of the primary zone
    };
  };

  const projectionData = useMemo(() => {
    if (!selectedZone) return [];

    const zoneName = zoneData.find(z => z.id === selectedZone)?.name || "";
    const baseProjections = financialProjections[zoneName] || [];

    // Only return data for the selected year range (or max available if less)
    return baseProjections.slice(0, yearRange);
  }, [selectedZone, yearRange]);

  const assetExpenditureData = useMemo(() => {
    if (!zonalAssets.length) return [];

    // Group assets by next maintenance year and sum costs
    const grouped = zonalAssets.reduce((acc, asset) => {
      const year = asset.nextMaintenanceYear;
      // Ensure cost is treated as a number
      const cost = typeof asset.currentCost === 'number' ? asset.currentCost : 0;
      if (!acc[year]) {
        acc[year] = 0;
      }
      acc[year] += cost;
      return acc;
    }, {} as Record<number, number>);

    // Convert to array format suitable for charts
    return Object.entries(grouped)
      .map(([year, cost]) => ({ year: parseInt(year), cost }))
      .sort((a, b) => a.year - b.year); // Sort by year
  }, [zonalAssets]);

  // Reset dependent selections when parent selection changes
  useEffect(() => {
    setSelectedUnitType(null);
    setSelectedUnit(null);
  }, [selectedZone]);

  useEffect(() => {
    setSelectedUnit(null);
  }, [selectedUnitType]);

  // Handlers
  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const zoneId = parseInt(e.target.value);
    setSelectedZone(zoneId || null);
  };

  const handleUnitTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUnitType(e.target.value || null);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const unitNo = e.target.value;
    const unit = allPropertyUnits.find(u => u.unitNo === unitNo) || null;
    setSelectedUnit(unit);
  };

  const handleYearRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value);
      // Ensure year range is within reasonable bounds (e.g., 1-20)
      setYearRange(Math.max(1, Math.min(20, value || 5)));
  };

  const handleInflationRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setInflationRate(isNaN(value) ? 0 : value); // Handle potential NaN
  };

  const handleInterestRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setInterestRate(isNaN(value) ? 0 : value); // Handle potential NaN
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const contributionResult = calculateContribution();

  // Sorting assets based on user selection
  const sortedAssets = useMemo(() => {
    if (!zonalAssets.length) return [];

    return [...zonalAssets].sort((a, b) => {
      switch (sortBy) {
        case "cost":
          return (b.currentCost || 0) - (a.currentCost || 0); // Handle potential undefined cost
        case "name":
          return (a.componentName || "").localeCompare(b.componentName || ""); // Handle potential undefined name
        case "date":
          return (a.nextMaintenanceYear || 0) - (b.nextMaintenanceYear || 0); // Handle potential undefined date
        default:
          return 0;
      }
    });
  }, [zonalAssets, sortBy]);

  // --- Render Logic ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-wrap justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold leading-tight text-gray-900 mb-2 md:mb-0">
            Property Reserve Fund Calculator
          </h1>
          <div className="flex space-x-2 md:space-x-4">
            {['dashboard', 'calculator', 'assets', 'projections'].map((tab) => (
              <button
                key={tab}
                className={`px-3 py-2 md:px-4 text-sm md:text-base rounded-md capitalize ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                onClick={() => handleTabChange(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800">Muscat Bay Community Overview</h2>

            {/* Zone Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
              {zoneData.map(zone => (
                <div key={zone.id} className="bg-blue-50 p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold mb-2 text-blue-800">{zone.name}</h3>
                  <p className="text-gray-700 mb-2 text-sm">{zone.description}</p>
                  <div className="flex justify-between text-xs md:text-sm text-gray-600">
                    <span>Rate: {zone.contributionRate.toFixed(2)} OMR/sqft</span>
                    <span>Area: {zone.totalArea.toLocaleString()} sqft</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Reserve Fund Projections Chart */}
            <div className="mb-8">
              <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">Reserve Fund Balance Projections (Next 5 Years)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }} // Adjust margins
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    // Combine data from all projections to get unique years
                    domain={['dataMin', 'dataMax']}
                    type="number" // Treat year as number for proper axis scaling
                    tickFormatter={(year) => year.toString()} // Display year as string
                    allowDuplicatedCategory={false}
                  />
                  <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} /> {/* Format Y-axis ticks */}
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} OMR`} />
                  <Legend />
                  {Object.entries(financialProjections).map(([zoneName, projections]) => {
                     // Use the first 5 years or available data if less
                    const displayData = projections.slice(0, 5);
                    // Assign colors dynamically or use a predefined map
                    const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe", "#8dd1e1"];
                    const zoneIndex = zoneData.findIndex(z => z.name === zoneName);
                    const strokeColor = colors[zoneIndex % colors.length]; // Cycle through colors

                    return (
                      <Line
                        key={zoneName}
                        name={zoneName}
                        data={displayData}
                        dataKey="reserveBalance"
                        stroke={strokeColor}
                        strokeWidth={2}
                        dot={false} // Simplify line
                        activeDot={{ r: 6 }}
                      />
                    );
                   })}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Asset/Investment Summary Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">Total Assets by Zone</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={zoneData.map(zone => {
                      const zoneName = zone.name;
                      const assetCount = allAssets.filter(asset => asset.zone === zoneName).length;
                      return { name: zoneName, count: assetCount };
                    })}
                    margin={{ top: 5, right: 5, left: -20, bottom: 40 }} // Adjust margins for labels
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={50} fontSize="10px" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">Total Asset Value by Zone</h3>
                 <ResponsiveContainer width="100%" height={300}>
                   <PieChart>
                     <Pie
                       data={zoneData.map(zone => {
                         const zoneName = zone.name;
                         const zonalAssetsData = allAssets.filter(asset => asset.zone === zoneName);
                         const totalCost = zonalAssetsData.reduce((sum, asset) => sum + (asset.currentCost || 0), 0);
                         return {
                           name: zoneName,
                           value: totalCost
                         };
                       })}
                       cx="50%"
                       cy="50%"
                       labelLine={false}
                       outerRadius={80}
                       fill="#8884d8"
                       dataKey="value"
                       label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`} // Shorter labels
                     >
                       {zoneData.map((zone, index) => {
                          const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe", "#8dd1e1"];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                       })}
                     </Pie>
                     <Tooltip formatter={(value: number) => `${value.toLocaleString()} OMR`} />
                     <Legend />
                   </PieChart>
                 </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800">Reserve Fund Contribution Calculator</h2>

              {/* Input Selections */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                {/* Zone selection */}
                <div>
                  <label htmlFor="zoneSelect" className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                  <select
                    id="zoneSelect"
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={selectedZone || ""}
                    onChange={handleZoneChange}
                  >
                    <option value="">Select Zone</option>
                    {/* Filter out the generic 'Typical Building' zone from direct selection */}
                    {zoneData.filter(z => z.id !== 10).map(zone => (
                      <option key={zone.id} value={zone.id}>{zone.name}</option>
                    ))}
                  </select>
                </div>

                {/* Unit Type selection */}
                <div>
                  <label htmlFor="unitTypeSelect" className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
                  <select
                    id="unitTypeSelect"
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100"
                    value={selectedUnitType || ""}
                    onChange={handleUnitTypeChange}
                    disabled={!selectedZone}
                  >
                    <option value="">Select Unit Type</option>
                    {unitTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Unit selection */}
                <div>
                  <label htmlFor="unitSelect" className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    id="unitSelect"
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100"
                    value={selectedUnit?.unitNo || ""}
                    onChange={handleUnitChange}
                    disabled={!selectedUnitType}
                  >
                    <option value="">Select Unit</option>
                    {units.map(unit => (
                      <option key={unit.unitNo} value={unit.unitNo}>
                        {/* Display Unit No and BUA */}
                        {unit.unitNo} - {unit.bua} sqft
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Additional Parameters (Consider if needed, currently only affect small table) */}
               {/*
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                <div>
                  <label htmlFor="inflationRateInput" className="block text-sm font-medium text-gray-700 mb-1">
                    Inflation Rate (%)
                  </label>
                  <input
                    id="inflationRateInput"
                    type="number"
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    value={inflationRate}
                    onChange={handleInflationRateChange}
                    step="0.1"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="interestRateInput" className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (%)
                  </label>
                  <input
                     id="interestRateInput"
                    type="number"
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    value={interestRate}
                    onChange={handleInterestRateChange}
                    step="0.1"
                    min="0"
                  />
                </div>
                <div>
                    <label htmlFor="yearRangeInputCalc" className="block text-sm font-medium text-gray-700 mb-1">
                        Projection Years
                    </label>
                    <input
                        id="yearRangeInputCalc"
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                        value={yearRange}
                        onChange={handleYearRangeChange}
                        min="1"
                        max="20" // Max projection years
                    />
                </div>
              </div>
              */}

              {/* Results Display */}
              {contributionResult && selectedUnit && zoneInfo ? (
                <div className="bg-blue-50 p-4 md:p-6 rounded-lg mt-6">
                  <h3 className="text-lg md:text-xl font-bold mb-4 text-blue-800">Calculation Results for Unit: {selectedUnit.unitNo}</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                    {/* Unit Info Box */}
                    <div>
                      <h4 className="text-md font-semibold mb-2 text-gray-700">Unit Information</h4>
                      <div className="bg-white p-4 rounded shadow text-sm">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <div className="text-gray-600">Unit Number:</div>
                          <div className="font-medium text-gray-900">{selectedUnit.unitNo}</div>

                          <div className="text-gray-600">Unit Type:</div>
                          <div className="font-medium text-gray-900">{selectedUnit.unitType}</div>

                          <div className="text-gray-600">Built-Up Area:</div>
                          <div className="font-medium text-gray-900">{selectedUnit.bua} sqft</div>

                          <div className="text-gray-600">Zone:</div>
                          <div className="font-medium text-gray-900">{zoneInfo.name}</div>
                        </div>
                      </div>
                    </div>

                    {/* Contribution Details Box */}
                    <div>
                      <h4 className="text-md font-semibold mb-2 text-gray-700">Annual Contribution Details</h4>
                      <div className="bg-white p-4 rounded shadow text-sm">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <div className="text-gray-600">Zone Rate:</div>
                          <div className="font-medium text-gray-900">{contributionResult.contributionRate.toFixed(2)} OMR/sqft</div>

                          <div className="text-gray-600">Zone Share:</div>
                          <div className="font-medium text-gray-900">{contributionResult.baseContribution.toFixed(2)} OMR</div>

                          {contributionResult.typicalBuildingContribution > 0 && (
                            <>
                              <div className="text-gray-600">Typical Bldg Rate:</div>
                              <div className="font-medium text-gray-900">{contributionResult.typicalBuildingRate.toFixed(2)} OMR/sqft</div>

                              <div className="text-gray-600">Typical Bldg Share:</div>
                              <div className="font-medium text-gray-900">{contributionResult.typicalBuildingContribution.toFixed(2)} OMR</div>
                            </>
                          )}
                          {/* Separator */}
                           <div className="col-span-2 border-t my-1 border-gray-200"></div>

                          <div className="text-gray-600 font-bold">Total Annual:</div>
                          <div className="font-bold text-blue-600 text-base">{contributionResult.totalContribution.toFixed(2)} OMR</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Percentage of Zone Total */}
                   <div className="mb-6">
                      <h4 className="text-md font-semibold mb-2 text-gray-700">Unit's Share of Zone Area</h4>
                       <div className="bg-white p-4 rounded shadow text-sm">
                         <p>
                           This unit represents approx. <span className="font-bold text-blue-600">
                             {((selectedUnit.bua || 0) / (zoneInfo.totalArea || 1) * 100).toFixed(4)}%
                           </span> of the total BUA in {zoneInfo.name}.
                         </p>
                         {/* Optional: Could add a simple progress bar or chart here if needed */}
                       </div>
                   </div>

                  {/* Projected Contributions Table (Simplified - uses fixed inflation/interest) */}
                  <div>
                    <h4 className="text-md font-semibold mb-2 text-gray-700">Projected Annual Contributions (Illustrative)</h4>
                    <p className="text-xs text-gray-600 mb-2">Note: Table uses fixed rates ({inflationRate}% inflation) for illustration.</p>
                    <div className="bg-white rounded shadow overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                            {contributionResult.typicalBuildingContribution > 0 && (
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone Share</th>
                            )}
                            {contributionResult.typicalBuildingContribution > 0 && (
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typical Bldg Share</th>
                            )}
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (Inflated)</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Array.from({ length: 5 }, (_, i) => { // Show 5 years for illustration
                            const year = new Date().getFullYear() + i; // Start from current year
                            const inflationFactor = Math.pow(1 + inflationRate / 100, i);
                            const adjustedBase = contributionResult.baseContribution * inflationFactor;
                            const adjustedTypical = contributionResult.typicalBuildingContribution * inflationFactor;
                            const adjustedTotal = adjustedBase + adjustedTypical;

                            return (
                              <tr key={year}>
                                <td className="px-4 py-2 whitespace-nowrap font-medium">{year}</td>
                                {contributionResult.typicalBuildingContribution > 0 && (
                                    <td className="px-4 py-2 whitespace-nowrap">{adjustedBase.toFixed(2)} OMR</td>
                                )}
                                {contributionResult.typicalBuildingContribution > 0 && (
                                    <td className="px-4 py-2 whitespace-nowrap">{adjustedTypical.toFixed(2)} OMR</td>
                                )}
                                <td className="px-4 py-2 whitespace-nowrap font-bold text-blue-600">{adjustedTotal.toFixed(2)} OMR</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                 <div className="text-center py-12 text-gray-500">
                    Please select a zone, unit type, and unit to calculate the contribution.
                 </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="p-4 md:p-6">
              {/* Assets Header and Controls */}
              <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Zone Assets</h2>
                <div className="flex flex-wrap items-center space-x-2 md:space-x-4">
                  <label htmlFor="zoneSelectAssets" className="text-sm font-medium text-gray-700">Zone:</label>
                  <select
                    id="zoneSelectAssets"
                    className="p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    value={selectedZone || ""}
                    onChange={handleZoneChange}
                  >
                    <option value="">Select Zone</option>
                    {zoneData.map(zone => ( // Include all zones for asset view
                      <option key={zone.id} value={zone.id}>{zone.name}</option>
                    ))}
                  </select>

                  <label htmlFor="sortAssets" className="text-sm font-medium text-gray-700">Sort By:</label>
                  <select
                    id="sortAssets"
                    className="p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    value={sortBy}
                    onChange={handleSortChange}
                  >
                    <option value="date">Maintenance Date</option>
                    <option value="cost">Cost (High-Low)</option>
                    <option value="name">Component Name</option>
                  </select>
                </div>
              </div>

              {selectedZone && zoneInfo ? (
                <>
                  {/* Zone Asset Overview Stats */}
                  <div className="mb-6">
                    <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-700">{zoneInfo.name} - Asset Overview</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-center shadow">
                           <div className="text-sm text-gray-500">Total Assets Listed</div>
                           <div className="text-2xl font-bold text-blue-800">{zonalAssets.length}</div>
                        </div>
                         <div className="bg-blue-50 p-4 rounded-lg text-center shadow">
                           <div className="text-sm text-gray-500">Total Replacement Cost</div>
                           <div className="text-2xl font-bold text-blue-800">
                             {(zonalAssets.reduce((sum, asset) => sum + (asset.currentCost || 0), 0)).toLocaleString()} OMR
                           </div>
                         </div>
                         <div className="bg-blue-50 p-4 rounded-lg text-center shadow">
                           <div className="text-sm text-gray-500">Avg. Life Expectancy</div>
                           <div className="text-2xl font-bold text-blue-800">
                             {zonalAssets.length ?
                               (zonalAssets.reduce((sum, asset) => sum + (asset.lifeExpectancy || 0), 0) / zonalAssets.length).toFixed(1) :
                               0} yrs
                           </div>
                         </div>
                     </div>
                  </div>

                  {/* Maintenance Timeline Chart */}
                  <div className="mb-8">
                    <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-700">Maintenance Expenditure Timeline</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={assetExpenditureData}
                        margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => `${value.toLocaleString()} OMR`} />
                        <Legend />
                        <Bar dataKey="cost" name="Est. Cost (OMR)" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Asset Inventory Table */}
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-700">Asset Inventory</h3>
                    <div className="bg-white rounded shadow overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost (OMR)</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Life (Yrs)</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Maint.</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sortedAssets.map((asset, index) => (
                            <tr key={`${asset.id}-${index}-${asset.componentName}`} className="hover:bg-gray-50">
                              <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{asset.componentName}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-gray-600">{asset.details || '-'}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-gray-600">{asset.quantity} {asset.unit}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-gray-600">{(asset.currentCost || 0).toLocaleString()}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-gray-600">{asset.lifeExpectancy}</td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  (asset.nextMaintenanceYear || 0) - (new Date().getFullYear()) <= 5 ? 'bg-red-100 text-red-800' :
                                  (asset.nextMaintenanceYear || 0) - (new Date().getFullYear()) <= 10 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {asset.nextMaintenanceYear || 'N/A'}
                                </span>
                              </td>
                            </tr>
                          ))}
                           {sortedAssets.length === 0 && (
                               <tr>
                                   <td colSpan={6} className="text-center py-4 text-gray-500">No assets listed for this zone.</td>
                               </tr>
                           )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Please select a zone to view its assets.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'projections' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="p-4 md:p-6">
              {/* Projections Header and Controls */}
              <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Financial Projections</h2>
                <div className="flex flex-wrap items-center space-x-2 md:space-x-4">
                  <label htmlFor="zoneSelectProj" className="text-sm font-medium text-gray-700">Zone:</label>
                  <select
                    id="zoneSelectProj"
                    className="p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    value={selectedZone || ""}
                    onChange={handleZoneChange}
                  >
                    <option value="">Select Zone</option>
                    {zoneData.map(zone => ( // Include all zones with projections
                      <option key={zone.id} value={zone.id}>{zone.name}</option>
                    ))}
                  </select>

                  <label htmlFor="yearRangeProj" className="text-sm font-medium text-gray-700">Years:</label>
                  <select
                    id="yearRangeProj"
                    className="p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    value={yearRange}
                    // Use a simpler range change handler here if the input element is removed
                     onChange={(e) => setYearRange(parseInt(e.target.value) || 5)}
                  >
                    <option value="5">5 Years</option>
                    <option value="10">10 Years</option>
                    <option value="15">15 Years</option>
                    <option value="20">20 Years</option>
                     {/* Add more options if needed, up to the max data available */}
                  </select>
                </div>
              </div>

              {selectedZone && zoneInfo ? (
                <>
                  {/* Financial Projection Line Chart */}
                  <div className="mb-8">
                    <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-700">{zoneInfo.name} - Reserve Fund Projection</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart
                        data={projectionData} // Uses data sliced by yearRange
                        margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                         <XAxis dataKey="year" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(year) => year.toString()} />
                        <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => `${value.toLocaleString()} OMR`} />
                        <Legend />
                        <Line type="monotone" dataKey="openingBalance" name="Opening Bal." stroke="#8884d8" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="contribution" name="Contribution" stroke="#82ca9d" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="expenditure" name="Expenditure" stroke="#ff7300" strokeWidth={2} dot={false} />
                         <Line type="monotone" dataKey="interest" name="Interest" stroke="#ffc658" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="reserveBalance" name="Reserve Bal." stroke="#0088fe" strokeWidth={3} activeDot={{ r: 6 }} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Income vs. Expenditure Bar Chart */}
                  <div className="mb-8">
                    <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-700">Annual Income vs. Expenditure</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={projectionData.map(year => ({
                          year: year.year,
                          income: year.totalIncome,
                          expenditure: year.expenditure
                        }))}
                        margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                         <XAxis dataKey="year" />
                        <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => `${value.toLocaleString()} OMR`} />
                        <Legend />
                        <Bar dataKey="income" name="Total Income" fill="#82ca9d" />
                        <Bar dataKey="expenditure" name="Expenditure" fill="#ff7300" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Detailed Projection Table */}
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-700">Detailed Projection Table</h3>
                     <div className="bg-white rounded shadow overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opening Bal.</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contribution</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Income</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenditure</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reserve Bal.</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {projectionData.map((yearData, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-2 whitespace-nowrap font-medium">{yearData.year}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-right">{yearData.openingBalance.toLocaleString()}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-right">{yearData.contribution.toLocaleString()}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-right">{yearData.interest.toLocaleString()}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-right">{yearData.totalIncome.toLocaleString()}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-right text-red-600">{yearData.expenditure.toLocaleString()}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-right font-bold text-blue-600">{yearData.reserveBalance.toLocaleString()}</td>
                               <td className="px-4 py-2 whitespace-nowrap text-right">{yearData.contributionRate.toFixed(2)}</td>
                            </tr>
                          ))}
                           {projectionData.length === 0 && (
                               <tr>
                                   <td colSpan={8} className="text-center py-4 text-gray-500">No projection data available for this zone or year range.</td>
                               </tr>
                           )}
                        </tbody>
                         {/* Optional Footer for Totals */}
                         {/*
                         <tfoot className="bg-gray-100 font-bold">
                            <tr>
                                <td className="px-4 py-2">Totals ({projectionData.length} yrs)</td>
                                <td className="px-4 py-2"></td>
                                <td className="px-4 py-2 text-right">{(projectionData.reduce((sum, y) => sum + y.contribution, 0)).toLocaleString()}</td>
                                <td className="px-4 py-2 text-right">{(projectionData.reduce((sum, y) => sum + y.interest, 0)).toLocaleString()}</td>
                                <td className="px-4 py-2 text-right">{(projectionData.reduce((sum, y) => sum + y.totalIncome, 0)).toLocaleString()}</td>
                                <td className="px-4 py-2 text-right text-red-600">{(projectionData.reduce((sum, y) => sum + y.expenditure, 0)).toLocaleString()}</td>
                                <td className="px-4 py-2"></td>
                                <td className="px-4 py-2"></td>
                            </tr>
                         </tfoot>
                          */}
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Please select a zone to view financial projections.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
             Property Reserve Fund Calculator © {new Date().getFullYear()} | Based on Muscat Bay Reserve Fund Study (Sample Data)
          </p>
           <p className="text-center text-gray-400 text-xs mt-1">
             Current Date/Time: {new Date().toLocaleString()} | Location: Sohar, Oman
           </p>
        </div>
      </footer>
    </div>
  );
};

export default PropertyReserveFundCalculator;
