
import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import AssetLifecycle from '@/pages/AssetLifecycle';
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
import PropertyManagement from '@/pages/PropertyManagement';
import ServiceCharges from '@/pages/ServiceCharges';
import NotFound from '@/pages/NotFound';
import Layout from '@/components/layout/Layout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route element={<Layout><div></div></Layout>}>
        <Route path="/alm" element={<AssetLifecycle />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/water" element={<Water />} />
        <Route path="/water-system" element={<WaterSystem />} />
        <Route path="/water-consumption-types" element={<WaterConsumptionTypes />} />
        <Route path="/electricity" element={<Electricity />} />
        <Route path="/electricity-system" element={<ElectricitySystem />} />
        <Route path="/hvac" element={<HVAC />} />
        <Route path="/pumping-stations" element={<PumpingStations />} />
        <Route path="/stp" element={<STP />} />
        <Route path="/stp-plant" element={<STPPlant />} />
        <Route path="/stp-dashboard" element={<STPDashboard />} />
        <Route path="/stp-analytics" element={<STPAnalytics />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/operating-expenses" element={<OperatingExpenses />} />
        <Route path="/property-management" element={<PropertyManagement />} />
        <Route path="/service-charges" element={<ServiceCharges />} />
      </Route>
      <Route path="/auth" element={<Auth />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
