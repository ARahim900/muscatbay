
import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Banknote, Calculator, Scale
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Register Chart.js components needed
ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// --- DATA ---
const rates = {
  zone: {
    "Zaha": 0.439,
    "Nameer": 1.098,
    "Wajd": 0.329,
    "C Sector": 1.756, // Using Master Community rate as zone rate for Commercial
    "FM": 3.952
  },
  masterCommunity: 1.914, // Derived rate based on user's list total area
};

// --- FULL PROPERTY DATABASE ---
// Note: Corrected Z3 008 area, handled invalid areas for Z3 056(3B)/Z3 056(4B) -> null
// Note: Staff Accommodation (FM) units included but have null BUA
const propertyDatabase = [
    { unitNo: "Z3 061(1A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 054(4A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z8 007", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 750.35 },
    { unitNo: "3C", sector: "C Sector", type: "Commercial", unitType: "Development Land", bua: 5656.00 },
    { unitNo: "Z3 057(5)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z5 008", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z3 050(1)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 019", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Villa", bua: 357.12 },
    { unitNo: "Z5 007", sector: "Nameer", type: "Villa", unitType: "3 Bed Nameer Villa", bua: 426.78 },
    { unitNo: "Z3 039", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 045(1)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 029", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Villa", bua: 357.12 },
    { unitNo: "Z3 046(1)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 059(1B)", sector: "Zaha", type: "Apartment", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 009", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 010", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 048(2)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 059(3A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 011", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 056(4A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 053(4B)", sector: "Zaha", type: "Apartment", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 054(4B)", sector: "Zaha", type: "Apartment", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 055(1A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 060(3A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 057(6)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z3 058(3A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 059(1A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 017", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Villa", bua: 357.12 },
    { unitNo: "Z3 059(3B)", sector: "Zaha", type: "Apartment", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 061(3A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 060(1A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 022", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Villa", bua: 357.12 },
    { unitNo: "Z3 002", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 062(2)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 061(2B)", sector: "Zaha", type: "Apartment", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 075(2)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 033", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 036", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z5 019", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z5 018", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z5 020", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z3 040", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z8 002", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 750.35 },
    { unitNo: "Z5 004", sector: "Nameer", type: "Villa", unitType: "3 Bed Nameer Villa", bua: 426.78 },
    { unitNo: "Z5 009", sector: "Nameer", type: "Villa", unitType: "3 Bed Nameer Villa", bua: 426.78 },
    { unitNo: "Z3 012", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 008", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 }, // Corrected area
    { unitNo: "Z3 055(2B)", sector: "Zaha", type: "Apartment", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 003", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 004", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 058(4A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 013", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 014", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 015", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 020", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Villa", bua: 357.12 },
    { unitNo: "Z3 021", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Villa", bua: 357.12 },
    { unitNo: "Z3 023", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Villa", bua: 357.12 },
    { unitNo: "Z3 030", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Villa", bua: 357.12 },
    { unitNo: "Z3 031", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 048(1)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 060(4A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 037", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 038", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 049(1)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 041", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 042", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 055(6)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z3 043", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 044(1)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 044(2)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 044(3)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 044(4)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 044(5)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 050(2)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 044(6)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z3 045(2)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 045(3)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 045(4)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 045(5)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 045(6)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z5 002", sector: "Nameer", type: "Villa", unitType: "3 Bed Nameer Villa", bua: 426.78 },
    { unitNo: "Z3 046(2)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 046(3)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 052(2)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 046(4)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 046(5)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 046(6)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z3 047(2)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 047(3)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 047(4)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 047(5)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 053(1A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 047(6)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z3 053(2A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 053(2B)", sector: "Zaha", type: "Apartment", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 048(3)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 053(3A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 048(5)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 048(6)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z3 049(2)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 054(1A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 049(3)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 054(2A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 054(2B)", sector: "Zaha", type: "Apartment", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 049(4)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 049(5)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 049(6)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z3 050(3)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 050(4)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 050(5)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 055(2A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 050(6)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z3 005", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 051(1)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 051(2)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 055(3A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 051(4)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 051(6)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z3 052(1)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 052(3)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 057(1A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 052(4)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 057(2A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 052(5)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 052(6)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z3 057(4A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 048(4)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 057(4B)", sector: "Zaha", type: "Apartment", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 053(1B)", sector: "Zaha", type: "Apartment", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 053(3B)", sector: "Zaha", type: "Apartment", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 053(4A)", sector: "Zaha", type: "Apartment", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 053(6)", sector: "Zaha", type: "Apartment", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z3 025", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Villa", bua: 357.12 },
    { unitNo: "Z3 058(2A)", sector: "Zaha", type: "Villa", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 054(1B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 054(3A)", sector: "Zaha", type: "Villa", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 054(3B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 055(1B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 074(2)", sector: "Zaha", type: "Villa", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 055(3B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 059(2A)", sector: "Zaha", type: "Villa", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 006", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 055(4A)", sector: "Zaha", type: "Villa", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 055(4B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 057(1B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 059(4A)", sector: "Zaha", type: "Villa", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 057(2B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 057(3A)", sector: "Zaha", type: "Villa", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 057(3B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 060(2A)", sector: "Zaha", type: "Villa", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 058(1B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 058(2B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 061(2A)", sector: "Zaha", type: "Villa", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 058(3B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 059(2B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 061(4A)", sector: "Zaha", type: "Villa", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 058(4B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 058(5)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 059(4B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 060(1B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 060(2B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 060(3B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 060(4B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 060(5)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 061(1B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 }
];

// Function to calculate data summaries
const calculateSummaries = () => {
  const sectors = {};
  const types = {};
  let totalArea = 0;
  let totalUnits = 0;

  propertyDatabase.forEach(property => {
    // Count by sector
    if (!sectors[property.sector]) {
      sectors[property.sector] = {
        units: 0,
        area: 0
      };
    }
    sectors[property.sector].units += 1;
    sectors[property.sector].area += property.bua || 0;

    // Count by type
    if (!types[property.type]) {
      types[property.type] = {
        units: 0,
        area: 0
      };
    }
    types[property.type].units += 1;
    types[property.type].area += property.bua || 0;

    // Total counts
    totalArea += property.bua || 0;
    totalUnits += 1;
  });

  return { sectors, types, totalArea, totalUnits };
};

const ReserveFundDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedYear, setSelectedYear] = useState("2025");
  
  const summaries = useMemo(() => calculateSummaries(), []);
  
  // Prepare sector data for pie charts
  const sectorData = {
    labels: Object.keys(summaries.sectors),
    datasets: [
      {
        data: Object.values(summaries.sectors).map(s => s.area),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare type data for pie charts
  const typeData = {
    labels: Object.keys(summaries.types),
    datasets: [
      {
        data: Object.values(summaries.types).map(t => t.area),
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)', 
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Calculate total annual reserve fund
  const totalAnnualReserveFund = Object.entries(summaries.sectors).reduce((total, [sector, data]) => {
    const sectorRate = rates.zone[sector] || 0;
    const mcRate = sector !== 'FM' ? rates.masterCommunity : 0; // No MC for Staff Accommodation
    return total + ((sectorRate + mcRate) * data.area);
  }, 0);

  // Options for charts
  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString()} m² (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Banknote className="h-8 w-8 mr-3 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reserve Fund Dashboard</h1>
          <p className="text-gray-600">Overview of Muscat Bay reserve fund allocations and property data</p>
        </div>
        <div className="ml-auto flex space-x-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
          <button className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors">
            Export
          </button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="by-type">By Type</TabsTrigger>
          <TabsTrigger value="by-sector">By Sector</TabsTrigger>
        </TabsList>

        <div className="text-sm text-gray-500 mb-6">
          Showing: {activeTab === "overview" ? "Reserve Fund Overview" : 
                   activeTab === "analysis" ? "Reserve Fund Analysis" :
                   activeTab === "by-type" ? "Reserve Fund by Property Type" : "Reserve Fund by Sector"}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summaries.totalUnits}</div>
              <p className="text-xs text-gray-500 mt-1">Units in database</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Area</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summaries.totalArea.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Square meters</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Annual Reserve Fund</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalAnnualReserveFund.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Omani Rials</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Monthly Average</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(totalAnnualReserveFund / 12).toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Omani Rials per month</p>
            </CardContent>
          </Card>
        </div>
        
        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribution by Sector</CardTitle>
                <CardDescription>Area distribution across different sectors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <Pie data={sectorData} options={pieChartOptions} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribution by Type</CardTitle>
                <CardDescription>Area distribution by property type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <Pie data={typeData} options={pieChartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analysis" className="mt-0">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Reserve Fund Analysis</CardTitle>
              <CardDescription>Analysis of reserve fund contributions and allocations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 rounded-md">
                <p>Detailed analysis view coming soon. This tab will include:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Year-over-year comparisons</li>
                  <li>Contribution analysis</li>
                  <li>Fund allocation recommendations</li>
                  <li>Long-term projections</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="by-type" className="mt-0">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Reserve Fund by Property Type</CardTitle>
              <CardDescription>Breakdown of contributions by property type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border-b">Property Type</th>
                      <th className="text-right p-3 border-b">Units</th>
                      <th className="text-right p-3 border-b">Total Area (m²)</th>
                      <th className="text-right p-3 border-b">Avg. Area (m²)</th>
                      <th className="text-right p-3 border-b">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(summaries.types).map(([type, data], index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="p-3 border-b">{type}</td>
                        <td className="text-right p-3 border-b">{data.units}</td>
                        <td className="text-right p-3 border-b">{data.area.toLocaleString()}</td>
                        <td className="text-right p-3 border-b">{(data.area / data.units).toLocaleString()}</td>
                        <td className="text-right p-3 border-b">
                          {((data.area / summaries.totalArea) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="by-sector" className="mt-0">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Reserve Fund by Sector</CardTitle>
              <CardDescription>Breakdown of contributions by sector</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border-b">Sector</th>
                      <th className="text-right p-3 border-b">Units</th>
                      <th className="text-right p-3 border-b">Total Area (m²)</th>
                      <th className="text-right p-3 border-b">Zone Rate (OMR/m²)</th>
                      <th className="text-right p-3 border-b">MC Rate (OMR/m²)</th>
                      <th className="text-right p-3 border-b">Total Contribution (OMR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(summaries.sectors).map(([sector, data], index) => {
                      const zoneRate = rates.zone[sector] || 0;
                      const mcRate = sector !== 'FM' ? rates.masterCommunity : 0;
                      const totalContribution = (zoneRate + mcRate) * data.area;
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="p-3 border-b">{sector}</td>
                          <td className="text-right p-3 border-b">{data.units}</td>
                          <td className="text-right p-3 border-b">{data.area.toLocaleString()}</td>
                          <td className="text-right p-3 border-b">{zoneRate.toFixed(3)}</td>
                          <td className="text-right p-3 border-b">{mcRate.toFixed(3)}</td>
                          <td className="text-right p-3 border-b">
                            {totalContribution.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReserveFundDashboard;
