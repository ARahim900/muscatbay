
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Landmark, Search, Bell, UserCircle, LayoutDashboard, Calculator,
  Building2, Play, Globe2, MapPin, Ruler, Banknote, Scale
} from 'lucide-react'; // Using lucide-react

// Register Chart.js components needed
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

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
    { unitNo: "Z3 062(1)", sector: "Zaha", type: "Villa", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 062(3)", sector: "Zaha", type: "Villa", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 062(4)", sector: "Zaha", type: "Villa", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 062(6)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z3 074(1)", sector: "Zaha", type: "Villa", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 007", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 074(3)", sector: "Zaha", type: "Villa", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 074(4)", sector: "Zaha", type: "Villa", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 074(5)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 074(6)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z3 075(1)", sector: "Zaha", type: "Villa", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 075(3)", sector: "Zaha", type: "Villa", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 075(4)", sector: "Zaha", type: "Villa", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 075(5)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 075(6)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z5 012", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z5 013", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z5 021", sector: "Nameer", type: "Villa", unitType: "3 Bed Nameer Villa", bua: 426.78 },
    { unitNo: "Z5 014", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z5 015", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z8 003", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 750.35 },
    { unitNo: "Z5 016", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z8 005", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 943.00 },
    { unitNo: "Z8 009", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 1187.47 },
    { unitNo: "Z8 011", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 750.35 },
    { unitNo: "Z8 012", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 760.40 },
    { unitNo: "Z8 013", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 760.40 },
    { unitNo: "Z8 014", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 760.40 },
    { unitNo: "Z8 015", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 760.40 },
    { unitNo: "Z8 016", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 760.40 },
    { unitNo: "Z8 017", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 750.35 },
    { unitNo: "Z8 018", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 760.40 },
    { unitNo: "Z8 019", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 750.35 },
    { unitNo: "Z8 020", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 760.40 },
    { unitNo: "Z8 021", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 750.35 },
    { unitNo: "Z3 061(3B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z8 022", sector: "Wajd", type: "Villa", unitType: "King Villa", bua: 1844.67 },
    { unitNo: "Z3 061(1B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 054(5)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 051(3)", sector: "Zaha", type: "Villa", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 034", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 062(5)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 061(6)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z5 017", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z3 001", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 016", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 018", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Villa", bua: 357.12 },
    { unitNo: "Z5 011", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z3 061(5)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 026", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Villa", bua: 357.12 },
    { unitNo: "Z3 027", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Villa", bua: 357.12 },
    { unitNo: "Z3 028", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Villa", bua: 357.12 },
    { unitNo: "Z3 058(1A)", sector: "Zaha", type: "Villa", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 032", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 035", sector: "Zaha", type: "Villa", unitType: "4 Bed Zaha Villa", bua: 422.24 },
    { unitNo: "Z3 051(5)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 053(5)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 054(6)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z3 055(5)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 056(1A)", sector: "Zaha", type: "Villa", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 056(1B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 056(2A)", sector: "Zaha", type: "Villa", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 056(2B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 056(3A)", sector: "Zaha", type: "Villa", unitType: "2 Bed Small Apt", bua: 115.47 },
    { unitNo: "Z3 056(3B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: null }, // Invalid area
    { unitNo: "Z3 056(5)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 056(4B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: null }, // Invalid area
    { unitNo: "Z3 061(4B)", sector: "Zaha", type: "Villa", unitType: "1 Bed Apt", bua: 79.09 },
    { unitNo: "Z3 056(6)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z3 058(6)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z3 047(1)", sector: "Zaha", type: "Villa", unitType: "2 Bed Premium Apt", bua: 199.13 },
    { unitNo: "Z3 059(6)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z3 059(5)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 355.07 },
    { unitNo: "Z3 024", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Villa", bua: 357.12 },
    { unitNo: "Z5 001", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z5 003", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z5 005", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z5 006", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z5 010", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z3 060(6)", sector: "Zaha", type: "Villa", unitType: "3 Bed Zaha Apt", bua: 361.42 },
    { unitNo: "Z5 022", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z5 023", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z5 024", sector: "Nameer", type: "Villa", unitType: "3 Bed Nameer Villa", bua: 426.78 },
    { unitNo: "Z5 025", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z5 026", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z5 027", sector: "Nameer", type: "Villa", unitType: "3 Bed Nameer Villa", bua: 426.78 },
    { unitNo: "Z5 028", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z5 029", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z5 030", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z5 031", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z5 032", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z5 033", sector: "Nameer", type: "Villa", unitType: "4 Bed Nameer Villa", bua: 497.62 },
    { unitNo: "Z8 001", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 750.35 },
    { unitNo: "Z8 004", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 750.35 },
    { unitNo: "Z8 006", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 760.40 },
    { unitNo: "Z8 008", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 760.40 },
    { unitNo: "Z8 010", sector: "Wajd", type: "Villa", unitType: "5 Bed Wajd Villa", bua: 760.40 },
    { unitNo: "Z1 B01", sector: "FM", type: "Staff Accomm", unitType: "Staff Accommodation", bua: null },
    { unitNo: "Z1 B02", sector: "FM", type: "Staff Accomm", unitType: "Staff Accommodation", bua: null },
    { unitNo: "Z1 B03", sector: "FM", type: "Staff Accomm", unitType: "Staff Accommodation", bua: null },
    { unitNo: "Z1 B04", sector: "FM", type: "Staff Accomm", unitType: "Staff Accommodation", bua: null },
    { unitNo: "Z1 B05", sector: "FM", type: "Staff Accomm", unitType: "Staff Accommodation", bua: null },
    { unitNo: "Z1 B06", sector: "FM", type: "Staff Accomm", unitType: "Staff Accommodation", bua: null },
    { unitNo: "Z1 B07", sector: "FM", type: "Staff Accomm", unitType: "Staff Accommodation", bua: null },
    { unitNo: "Z1 B08", sector: "FM", type: "Staff Accomm", unitType: "Staff Accommodation", bua: null },
    { unitNo: "Z1 CIF", sector: "FM", type: "Staff Accomm", unitType: "Staff Accommodation", bua: null }
];

// --- Utility Functions ---
const formatOMR = (value: number | null | undefined): string => {
  if (isNaN(Number(value)) || value === null || typeof value === 'undefined') return 'OMR --';
  return `OMR ${Number(value).toFixed(2)}`;
};

const getUniqueValues = (data: Array<{[key: string]: any}>, key: string): Array<string> => {
  return [...new Set(data.map(item => item[key]).filter(item => item != null))].sort();
};

// --- Main App Component ---
const ReserveFundDashboard = () => {
  // --- State ---
  const [activeView, setActiveView] = useState<'dashboard' | 'calculator' | 'assets'>('dashboard');
  const [zone, setZone] = useState<string>('');
  const [propertyType, setPropertyType] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [customBUAEnabled, setCustomBUAEnabled] = useState<boolean>(false);
  const [customBUA, setCustomBUA] = useState<string>('');
  const [showResults, setShowResults] = useState<boolean>(false);
  const [calculationResult, setCalculationResult] = useState<{
    totalContrib: number | null;
    zoneContrib: number | null;
    masterContrib: number | null;
    zoneRate: number | null;
    zoneName: string;
  }>({
    totalContrib: null, zoneContrib: null, masterContrib: null, zoneRate: null, zoneName: ''
  });
  const [dashboardData, setDashboardData] = useState<{
    totalProperties: number;
    totalBUA: number;
    totalContribution: number;
    avgContribution: number;
    sectors: {[key: string]: {total: number; count: number}};
    types: {[key: string]: {total: number; count: number}};
  }>({
    totalProperties: 0, totalBUA: 0, totalContribution: 0, avgContribution: 0, sectors: {}, types: {}
  });

  // --- Refs for Charts ---
  const sectorChartRef = useRef<any>(null);
  const typeChartRef = useRef<any>(null);

  // --- Effects ---
  // Calculate dashboard data on mount
  useEffect(() => {
    updateDashboard();
  }, []);

  // --- Memoized Derived State for Filters ---
  const availableZones = useMemo(() => getUniqueValues(propertyDatabase, 'sector'), []);
  const availableTypes = useMemo(() => {
    if (!zone) return [];
    return getUniqueValues(propertyDatabase.filter(p => p.sector === zone), 'type');
  }, [zone]);
  const availableUnits = useMemo(() => {
    if (!zone || !propertyType) return [];
    return propertyDatabase
      .filter(p => p.sector === zone && p.type === propertyType && p.bua !== null)
      .sort((a, b) => {
        // Attempt numeric sort first, fallback to localeCompare
        const numA = parseInt(a.unitNo.replace(/[^0-9]/g, ''), 10);
        const numB = parseInt(b.unitNo.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
        return a.unitNo.localeCompare(b.unitNo);
      });
  }, [zone, propertyType]);

  // --- Event Handlers ---
  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setZone(e.target.value);
    setPropertyType(''); // Reset dependent filters
    setUnit('');
    setShowResults(false);
  };

  const handlePropertyTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPropertyType(e.target.value);
    setUnit(''); // Reset unit
    setShowResults(false);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUnit(e.target.value);
    if (e.target.value) { // If a unit is selected, disable custom BUA
      setCustomBUAEnabled(false);
      setCustomBUA('');
    }
    setShowResults(false);
  };

  const handleCustomBUACheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setCustomBUAEnabled(isChecked);
    if (isChecked) {
      setUnit(''); // Deselect unit if custom BUA is checked
    } else {
      setCustomBUA(''); // Clear custom BUA if unchecked
    }
    setShowResults(false);
  };

  // --- Calculation Logic ---
  const calculateContribution = (
    bua: number, 
    sector: string, 
    type: string
  ): {
    zoneContrib: number | null;
    masterContrib: number | null;
    totalContrib: number | null;
    zoneRate: number | null;
    zoneName: string;
  } => {
    if (isNaN(bua) || bua <= 0 || !sector) {
      return { zoneContrib: null, masterContrib: null, totalContrib: null, zoneRate: null, zoneName: sector || 'N/A' };
    }
    let zoneRate = rates.zone[sector as keyof typeof rates.zone];
    if (typeof zoneRate === 'undefined') zoneRate = 0;

    const zoneContrib = bua * zoneRate;
    const masterContrib = bua * rates.masterCommunity;
    const totalContrib = zoneContrib + masterContrib;
    return { zoneContrib, masterContrib, totalContrib, zoneRate, zoneName: sector };
  };

  const handleCalculate = () => {
    let bua = NaN;
    let selectedSector = zone;
    let selectedType = propertyType;

    if (customBUAEnabled) {
      bua = parseFloat(customBUA);
      if (!selectedSector) { alert("Please select a Zone."); return; }
      if (!selectedType && selectedSector !== 'C Sector') { alert("Please select a Property Type."); return; }
    } else {
      const selectedProp = propertyDatabase.find(p => p.unitNo === unit);
      if (selectedProp) {
        bua = selectedProp.bua as number;
        selectedSector = selectedProp.sector; // Ensure sector/type match selected unit
        selectedType = selectedProp.type;
      } else { alert("Please select a unit or check the box and enter a custom BUA."); return; }
    }

    if (isNaN(bua) || bua <= 0) { alert("Invalid BUA."); return; }

    const result = calculateContribution(bua, selectedSector, selectedType);
    if (result.totalContrib === null) { alert("Could not calculate contribution."); return; }

    setCalculationResult(result);
    setShowResults(true);
    setTimeout(() => { document.getElementById('resultsCard')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100);
  };

  // --- Dashboard Data Calculation ---
  const updateDashboard = () => {
    let totalProps = 0, totalBua = 0, totalZoneContrib = 0, totalMasterContrib = 0;
    let totalOverallContrib = 0, validPropsCount = 0;
    let contributionsBySector: {[key: string]: {total: number, count: number}} = {};
    let contributionsByType: {[key: string]: {total: number, count: number}} = {};

    propertyDatabase.forEach(prop => {
      if (prop.type !== "Staff Accomm") totalProps++;
      if (prop.bua !== null && prop.bua > 0) {
        validPropsCount++;
        totalBua += prop.bua;
        const contrib = calculateContribution(prop.bua, prop.sector, prop.type);
        if (contrib.totalContrib !== null) {
          totalZoneContrib += contrib.zoneContrib || 0;
          totalMasterContrib += contrib.masterContrib || 0;
          totalOverallContrib += contrib.totalContrib;
          // Aggregate by sector
          if (!contributionsBySector[prop.sector]) contributionsBySector[prop.sector] = { total: 0, count: 0 };
          contributionsBySector[prop.sector].total += contrib.totalContrib;
          contributionsBySector[prop.sector].count++;
          // Aggregate by type
          if (!contributionsByType[prop.type]) contributionsByType[prop.type] = { total: 0, count: 0 };
          contributionsByType[prop.type].total += contrib.totalContrib;
          contributionsByType[prop.type].count++;
        }
      }
    });
    setDashboardData({
      totalProperties: totalProps, totalBUA: totalBua, totalContribution: totalOverallContrib,
      avgContribution: validPropsCount > 0 ? totalOverallContrib / validPropsCount : 0,
      sectors: contributionsBySector, types: contributionsByType
    });
  };

  // --- Chart Data and Options ---
  // Gradient helper
  const createChartGradient = (ctx: CanvasRenderingContext2D, colors: string[]) => {
    if (!ctx || !ctx.canvas) return colors[0];
    const chartArea = ctx.chart.chartArea;
    if (!chartArea) return colors[0];
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, colors[1]); // Lighter
    gradient.addColorStop(1, colors[0]); // Darker
    return gradient;
  };

  // Define gradient colors (darker, lighter) - adjusted for subtlety
  const gradientColors = [
    ['rgba(79, 70, 229, 0.6)', 'rgba(165, 180, 252, 0.1)'],   // Indigo
    ['rgba(5, 150, 105, 0.6)', 'rgba(110, 231, 183, 0.1)'],   // Emerald
    ['rgba(219, 39, 119, 0.6)', 'rgba(249, 168, 212, 0.1)'],  // Fuchsia
    ['rgba(245, 158, 11, 0.6)', 'rgba(252, 211, 77, 0.1)'],   // Amber
    ['rgba(59, 130, 246, 0.6)', 'rgba(147, 197, 253, 0.1)'],  // Blue
    ['rgba(139, 92, 246, 0.6)', 'rgba(196, 181, 253, 0.1)']   // Violet
  ];

  const sectorChartData = useMemo(() => {
    const labels = Object.keys(dashboardData.sectors);
    const data = labels.map(label => dashboardData.sectors[label].total);
    return {
      labels,
      datasets: [{
        label: 'Contribution by Sector', data,
        backgroundColor: labels.map((_, i) => gradientColors[i % gradientColors.length][1]), // Lighter for pie
        borderColor: '#ffffff', borderWidth: 2
      }]
    };
  }, [dashboardData.sectors]);

  const typeChartData = useMemo(() => {
    const labels = Object.keys(dashboardData.types);
    const data = labels.map(label => dashboardData.types[label].total);
    // Need to get context for gradients - this requires the chart instance, handled via ref
    return {
      labels,
      datasets: [{
        label: 'Total Contribution (OMR)', data,
        // Gradients applied dynamically using ref below
        backgroundColor: labels.map((_, i) => gradientColors[i % gradientColors.length][1]), // Temporary fallback
        borderColor: labels.map((_, i) => gradientColors[i % gradientColors.length][0]),
        borderWidth: 1, borderRadius: 5, borderSkipped: false,
      }]
    };
  }, [dashboardData.types]);

  // Apply gradient to bar chart background after render
  useEffect(() => {
    const chart = typeChartRef.current;
    if (chart && dashboardData.types && Object.keys(dashboardData.types).length > 0) { // Check if data exists
        const ctx = chart.ctx;
        const labels = Object.keys(dashboardData.types);
        // Ensure dataset exists before modifying
        if (chart.data.datasets && chart.data.datasets[0]) {
            chart.data.datasets[0].backgroundColor = labels.map((_, i) => createChartGradient(ctx, gradientColors[i % gradientColors.length]));
            chart.update();
        }
    }
  }, [dashboardData.types, activeView]); // Re-run if data or view changes

  const commonChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true, font: { family: "'Inter', sans-serif", size: 12 } } },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)', // slate-800
        titleFont: { size: 14, family: "'Inter', sans-serif" }, bodyFont: { size: 12, family: "'Inter', sans-serif" },
        padding: 10, boxPadding: 4,
        callbacks: { 
          label: (ctx: any) => `${ctx.label || ''}: ${formatOMR(ctx.raw || ctx.parsed?.y || 0)}` 
        }
      }
    }
  };

  const barChartOptions = {
    ...commonChartOptions,
    scales: {
      y: { beginAtZero: true, grid: { drawBorder: false }, ticks: { callback: (val: number) => formatOMR(val), font: { family: "'Inter', sans-serif", size: 11 } } },
      x: { grid: { display: false }, ticks: { font: { family: "'Inter', sans-serif", size: 11 } } }
    },
    plugins: { ...commonChartOptions.plugins, legend: { display: false } }
  };

  // --- Styles Object ---
  // Using an object for cleaner class management, especially for conditional styles
  const styles = {
    accentColor: "#4E4456",
    primaryColor: "#6366f1",
    header: "bg-white shadow-md sticky top-0 z-10",
    container: "max-w-screen-xl mx-auto py-10 px-4 sm:px-6 lg:px-8",
    navContainer: "flex justify-center mb-10",
    nav: "inline-flex p-1 space-x-1 bg-white rounded-lg shadow-md",
    tabBase: "py-2 px-4 rounded-md text-sm font-medium flex items-center transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    tabActive: "bg-[var(--brand-primary)] text-white shadow",
    tabInactive: "text-slate-500 hover:bg-slate-100 hover:text-[var(--brand-accent)] focus-visible:ring-[var(--brand-accent)]",
    icon: "mr-2 h-4 w-4", // Base icon size for tabs/buttons
    headerIcon: "h-5 w-5", // Header icons
    cardIcon: "h-7 w-7", // Dashboard card icons
    fadeIn: "animate-[fadeIn_0.4s_ease-out_forwards]",
    heading: "text-3xl font-bold text-slate-900 tracking-tight mb-8",
    dashboardGrid: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4",
    chartGrid: "grid grid-cols-1 lg:grid-cols-2 gap-10",
    cardBase: "rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden",
    cardGradient1: "bg-gradient-to-br from-indigo-500 to-indigo-400 text-white",
    cardGradient2: "bg-gradient-to-br from-sky-500 to-sky-400 text-white",
    cardGradient3: "bg-gradient-to-br from-emerald-500 to-emerald-400 text-white",
    cardGradient4: "bg-gradient-to-br from-amber-500 to-amber-400 text-white",
    cardWhite: "bg-white p-6",
    cardPadding: "p-6",
    cardIconContainer: "flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg p-4",
    cardValue: "text-2xl font-semibold mt-1",
    cardLabel: "text-sm font-medium text-white/80 truncate",
    cardValueDark: "text-2xl font-semibold text-slate-900 mt-1", // For white cards if needed
    cardLabelDark: "text-sm font-medium text-slate-500 truncate", // For white cards if needed
    chartContainer: "min-h-[300px] relative", // Ensure relative positioning for canvas
    formContainer: "bg-white shadow-lg rounded-xl p-8 border border-slate-100",
    formTitle: "text-2xl font-semibold text-slate-800 mb-2",
    formSubtitle: "text-base text-slate-600 mb-8",
    formGrid: "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mb-8",
    label: "block text-sm font-medium text-slate-700 mb-1",
    select: `mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-slate-300 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)] focus:border-[var(--brand-accent)] sm:text-sm rounded-lg shadow-sm disabled:bg-slate-50 disabled:cursor-not-allowed`,
    inputGroup: "md:col-span-2 flex items-center mt-3",
    checkbox: `h-4 w-4 text-[var(--brand-primary)] border-gray-300 rounded focus:ring-[var(--brand-accent)] focus:ring-offset-0`, // Removed offset for checkbox focus
    checkboxLabel: "ml-3 text-sm font-medium text-slate-700",
    numberInput: `block w-full sm:w-48 border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)] focus:border-[var(--brand-accent)] sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed`,
    calculateButton: `w-full inline-flex items-center justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-lg text-[var(--brand-primary-text)] bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] hover:text-[var(--brand-accent-text)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-accent)] transition-colors duration-200`,
    resultsCard: "bg-white shadow-lg rounded-xl overflow-hidden border border-slate-100 mt-8",
    resultsHeader: "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6", // Adjusted gradient
    resultsTitle: "text-xl font-semibold leading-6",
    resultsBody: "p-6 md:p-8", // More padding
    resultsTotalSection: "text-center bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8",
    resultsTotalLabel: "text-base font-medium text-slate-500",
    resultsTotalValue: "mt-2 text-4xl font-bold text-[var(--brand-primary)] tracking-tight",
    resultsMonthly: "mt-2 text-sm text-slate-500",
    resultsBreakdownTitle: "text-lg font-semibold text-slate-700 mb-4",
    resultsBreakdownItem: "flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200 mb-3",
    resultsBreakdownLabel: "text-sm text-slate-600 flex items-center",
    resultsBreakdownValue: "text-sm font-medium text-slate-900",
    resultsNote: "mt-8 text-xs text-slate-500 text-center italic",
    assetTableContainer: "overflow-x-auto custom-scrollbar",
    tableWrapper: "border border-slate-200 rounded-lg max-h-[500px] overflow-y-auto",
    table: "min-w-full divide-y divide-slate-200",
    tableHeader: "bg-slate-100 sticky top-0", // Lighter header
    tableHeaderCell: "px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider",
    tableRow: "hover:bg-slate-50 transition-colors duration-150",
    tableCell: "px-4 py-3 whitespace-nowrap text-sm text-slate-500",
    tableCellBold: "px-4 py-3 whitespace-nowrap text-sm text-slate-800 font-medium",
    footer: "mt-16 py-6 text-center text-xs text-slate-500 border-t border-slate-200"
  };

  // --- JSX ---
  return (
    <div className="font-sans bg-slate-50 min-h-screen">
      {/* Header */}
      <header className={styles.header}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Landmark size={24} className="text-[var(--brand-primary)] mr-3" />
              <span className="text-xl font-semibold text-slate-800">Muscat Bay Reserve Fund</span>
            </div>
            <div className="flex items-center space-x-5">
              <button className="text-slate-500 hover:text-[var(--brand-accent)] focus:outline-none p-1 rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand-accent)]" aria-label="Search">
                <Search size={20} />
              </button>
              <button className="text-slate-500 hover:text-[var(--brand-accent)] focus:outline-none p-1 rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand-accent)]" aria-label="Notifications">
                <Bell size={20} />
              </button>
              <button className="text-slate-500 hover:text-[var(--brand-accent)] focus:outline-none p-1 rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand-accent)]" aria-label="User Account">
                <UserCircle size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.container}>
        {/* Navigation Tabs */}
        <div className={styles.navContainer}>
          <nav className={styles.nav} aria-label="Tabs">
            <button
              className={`${styles.tabBase} ${activeView === 'dashboard' ? styles.tabActive : styles.tabInactive}`}
              onClick={() => setActiveView('dashboard')}
            >
              <LayoutDashboard size={16} className={styles.icon} /> Dashboard
            </button>
            <button
              className={`${styles.tabBase} ${activeView === 'calculator' ? styles.tabActive : styles.tabInactive}`}
              onClick={() => setActiveView('calculator')}
            >
              <Calculator size={16} className={styles.icon} /> Calculator
            </button>
            <button
              className={`${styles.tabBase} ${activeView === 'assets' ? styles.tabActive : styles.tabInactive}`}
              onClick={() => setActiveView('assets')}
            >
              <Building2 size={16} className={styles.icon} /> Assets
            </button>
          </nav>
        </div>

        {/* --- Conditional Views --- */}

        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className={`space-y-10 ${styles.fadeIn}`}>
            <h1 className={styles.heading}>Dashboard Overview (2025 Projections)</h1>
            {/* Summary Cards */}
            <div className={styles.dashboardGrid}>
              <div className={`${styles.cardBase} ${styles.cardGradient1}`}>
                <div className={styles.cardPadding}>
                  <div className="flex items-center">
                    <div className={styles.cardIconContainer}><Landmark size={24} className="text-white" /></div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className={styles.cardLabel}>Total Properties</dt>
                        <dd className={styles.cardValue}>{dashboardData.totalProperties}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`${styles.cardBase} ${styles.cardGradient2}`}>
                 <div className={styles.cardPadding}>
                   <div className="flex items-center">
                     <div className={styles.cardIconContainer}><Banknote size={24} className="text-white" /></div>
                     <div className="ml-5 w-0 flex-1">
                       <dl>
                         <dt className={styles.cardLabel}>Total 2025 Contribution</dt>
                         <dd className={styles.cardValue}>{formatOMR(dashboardData.totalContribution)}</dd>
                       </dl>
                     </div>
                   </div>
                 </div>
               </div>
              <div className={`${styles.cardBase} ${styles.cardGradient3}`}>
                 <div className={styles.cardPadding}>
                   <div className="flex items-center">
                     <div className={styles.cardIconContainer}><Scale size={24} className="text-white" /></div>
                     <div className="ml-5 w-0 flex-1">
                       <dl>
                         <dt className={styles.cardLabel}>Avg. Contribution / Unit</dt>
                         <dd className={styles.cardValue}>{formatOMR(dashboardData.avgContribution)}</dd>
                       </dl>
                     </div>
                   </div>
                 </div>
               </div>
              <div className={`${styles.cardBase} ${styles.cardGradient4}`}>
                 <div className={styles.cardPadding}>
                   <div className="flex items-center">
                     <div className={styles.cardIconContainer}><Ruler size={24} className="text-white" /></div>
                     <div className="ml-5 w-0 flex-1">
                       <dl>
                         <dt className={styles.cardLabel}>Total BUA (sqm)</dt>
                         <dd className={styles.cardValue}>{dashboardData.totalBUA.toFixed(2)} sqm</dd>
                       </dl>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
            {/* Charts */}
            <div className={styles.chartGrid}>
              <div className={`${styles.cardWhite} ${styles.cardBase}`}>
                <h3 className="text-xl font-semibold text-slate-900 mb-6">Contribution by Sector</h3>
                <div className={styles.chartContainer}>
                  <Pie ref={sectorChartRef} data={sectorChartData} options={commonChartOptions} />
                </div>
              </div>
              <div className={`${styles.cardWhite} ${styles.cardBase}`}>
                <h3 className="text-xl font-semibold text-slate-900 mb-6">Contribution by Property Type</h3>
                <div className={styles.chartContainer}>
                  <Bar ref={typeChartRef} data={typeChartData} options={barChartOptions} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calculator View */}
        {activeView === 'calculator' && (
          <div className={`space-y-10 ${styles.fadeIn}`}>
            <div className={styles.formContainer}>
              <h2 className={styles.formTitle}>Reserve Fund Calculator</h2>
              <p className={styles.formSubtitle}>Estimate the annual reserve fund contribution for any property based on 2025 rates.</p>
              <div className={styles.formGrid}>
                {/* Zone */}
                <div>
                  <label htmlFor="zone-select" className={styles.label}>Zone</label>
                  <select id="zone-select" value={zone} onChange={handleZoneChange} className={styles.select}>
                    <option value="">Select Zone</option>
                    {availableZones.map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                {/* Type */}
                <div>
                  <label htmlFor="type-select" className={styles.label}>Property Type</label>
                  <select id="type-select" value={propertyType} onChange={handlePropertyTypeChange} className={styles.select} disabled={!zone}>
                    <option value="">Select Type</option>
                    {availableTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {/* Unit */}
                <div className="md:col-span-2">
                  <label htmlFor="unit-select" className={styles.label}>Unit</label>
                  <select id="unit-select" value={unit} onChange={handleUnitChange} className={styles.select} disabled={!zone || !propertyType || customBUAEnabled}>
                    <option value="">Select Unit</option>
                    {availableUnits.map((u) => (
                      <option key={u.unitNo} value={u.unitNo}>
                        {u.unitNo} - {u.unitType} ({u.bua.toFixed(2)} sqm)
                      </option>
                    ))}
                  </select>
                </div>
                {/* Custom BUA */}
                <div className={styles.inputGroup}>
                   <div className="relative flex items-start">
                     <div className="flex items-center h-5">
                       <input id="customBUACheckbox" type="checkbox" checked={customBUAEnabled} onChange={handleCustomBUACheckboxChange} className={styles.checkbox} />
                     </div>
                     <div className="ml-3 text-sm flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                       <label htmlFor="customBUACheckbox" className={styles.checkboxLabel}>Enter custom BUA (sqm)</label>
                       <input type="number" id="customBUA" value={customBUA} onChange={(e) => setCustomBUA(e.target.value)} className={styles.numberInput} placeholder="e.g., 450.5" disabled={!customBUAEnabled} />
                     </div>
                   </div>
                 </div>
              </div>
              <button onClick={handleCalculate} className={styles.calculateButton}>
                <Play size={18} className="-ml-1 mr-2" /> Calculate Contribution
              </button>
            </div>

            {/* Results */}
            {showResults && (
              <div id="resultsCard" className={`${styles.resultsCard} ${styles.fadeIn}`}>
                <div className={styles.resultsHeader}>
                   <h3 className={styles.resultsTitle}>Calculation Results</h3>
                </div>
                <div className={styles.resultsBody}>
                  <div className={styles.resultsTotalSection}>
                    <p className={styles.resultsTotalLabel}>Total Annual Contribution</p>
                    <p className={styles.resultsTotalValue}>{formatOMR(calculationResult.totalContrib)}</p>
                    <p className={styles.resultsMonthly}>{`(Approx. ${formatOMR(calculationResult.totalContrib ? calculationResult.totalContrib / 12 : null)} per month)`}</p>
                  </div>
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className={styles.resultsBreakdownTitle}>Contribution Breakdown</h4>
                    <dl className="space-y-3">
                      <div className={styles.resultsBreakdownItem}>
                        <dt className={styles.resultsBreakdownLabel}>
                          <Globe2 size={16} className="text-blue-500 mr-2" /> Master Community ({rates.masterCommunity.toFixed(3)} OMR/m²)
                        </dt>
                        <dd className={styles.resultsBreakdownValue}>{formatOMR(calculationResult.masterContrib)}</dd>
                      </div>
                      <div className={styles.resultsBreakdownItem}>
                        <dt className={styles.resultsBreakdownLabel}>
                          <MapPin size={16} className="text-green-500 mr-2" /> Zone ({calculationResult.zoneName}) ({calculationResult.zoneRate?.toFixed(3) ?? '--'} OMR/m²)
                        </dt>
                        <dd className={styles.resultsBreakdownValue}>{formatOMR(calculationResult.zoneContrib)}</dd>
                      </div>
                    </dl>
                  </div>
                  <p className={styles.resultsNote}>
                    Note: These calculations use 2025 projected rates (Zone rates derived from RFS report; Master Community rate of {rates.masterCommunity.toFixed(3)} OMR/sqm derived from analysis of provided list total area) and are subject to change. Official amounts should be confirmed with Muscat Bay OA/Management.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assets View */}
        {activeView === 'assets' && (
          <div className={`${styles.fadeIn}`}>
            <div className={`${styles.formContainer} border-0`}> {/* Re-use form container style */}
              <h2 className={styles.formTitle}>Assets Database</h2>
              <p className={styles.formSubtitle}>Browse the property database used for calculations.</p>
              <div className={styles.assetTableContainer}>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead className={styles.tableHeader}>
                      <tr>
                        <th className={styles.tableHeaderCell}>Unit No</th>
                        <th className={styles.tableHeaderCell}>Sector</th>
                        <th className={styles.tableHeaderCell}>Type</th>
                        <th className={styles.tableHeaderCell}>Unit Type</th>
                        <th className={`${styles.tableHeaderCell} text-right`}>BUA (sqm)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {propertyDatabase.map((prop, index) => (
                        <tr key={`${prop.unitNo}-${index}`} className={styles.tableRow}>
                          <td className={styles.tableCellBold}>{prop.unitNo}</td>
                          <td className={styles.tableCell}>{prop.sector}</td>
                          <td className={styles.tableCell}>{prop.type}</td>
                          <td className={styles.tableCell}>{prop.unitType}</td>
                          <td className={`${styles.tableCell} text-right`}>{prop.bua !== null ? prop.bua.toFixed(2) : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        © 2025 Muscat Bay Reserve Fund Management | Version 1.1.3 (Based on RFS Report LS/IB/2021/6003/REV.0)
      </footer>
    </div>
  );
};

export default ReserveFundDashboard;
