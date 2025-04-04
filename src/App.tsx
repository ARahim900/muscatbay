
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Contracts from '@/pages/Contracts';
import Projects from '@/pages/Projects';
import Water from '@/pages/Water';
import WaterSystem from '@/pages/WaterSystem';
import WaterConsumptionTypes from '@/pages/WaterConsumptionTypes';
import Electricity from '@/pages/Electricity';
import ElectricitySystem from '@/pages/ElectricitySystem';
import HVAC from '@/pages/HVAC';
import PumpingStations from '@/pages/PumpingStations';
import STP from '@/pages/STP';
import STPPlant from '@/pages/STPPlant';
import STPDashboard from '@/pages/STPDashboard';
import STPAnalytics from '@/pages/STPAnalytics';
import Reports from '@/pages/Reports';
import Admin from '@/pages/Admin';
import OperatingExpenses from '@/pages/OperatingExpenses';
import ServiceCharges from '@/pages/ServiceCharges';
import AssetReserveFund from '@/pages/AssetReserveFund';
import ReserveFundCalculatorPage from '@/pages/ReserveFundCalculatorPage';
import NotFound from '@/pages/NotFound';
import Layout from '@/components/layout/Layout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Index /></Layout>} />
      <Route path="/contracts" element={<Layout><Contracts /></Layout>} />
      <Route path="/projects" element={<Layout><Projects /></Layout>} />
      <Route path="/water" element={<Layout><Water /></Layout>} />
      <Route path="/water-system" element={<Layout><WaterSystem /></Layout>} />
      <Route path="/water-consumption-types" element={<Layout><WaterConsumptionTypes /></Layout>} />
      <Route path="/electricity" element={<Layout><Electricity /></Layout>} />
      <Route path="/electricity-system" element={<Layout><ElectricitySystem /></Layout>} />
      <Route path="/hvac" element={<Layout><HVAC /></Layout>} />
      <Route path="/pumping-stations" element={<Layout><PumpingStations /></Layout>} />
      <Route path="/stp" element={<Layout><STP /></Layout>} />
      <Route path="/stp-plant" element={<Layout><STPPlant /></Layout>} />
      <Route path="/stp-dashboard" element={<Layout><STPDashboard /></Layout>} />
      <Route path="/stp-analytics" element={<Layout><STPAnalytics /></Layout>} />
      <Route path="/reports" element={<Layout><Reports /></Layout>} />
      <Route path="/admin" element={<Layout><Admin /></Layout>} />
      <Route path="/operating-expenses" element={<Layout><OperatingExpenses /></Layout>} />
      <Route path="/service-charges" element={<Layout><ServiceCharges /></Layout>} />
      <Route path="/asset-reserve-fund" element={<Layout><AssetReserveFund /></Layout>} />
      <Route path="/reserve-fund-calculator" element={<Layout><ReserveFundCalculatorPage /></Layout>} />
      <Route path="/auth" element={<Auth />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
