
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import WaterDistributionPage from './pages/WaterDistributionPage';
import ElectricityDistributionPage from './pages/ElectricityDistributionPage';
import ServiceChargesPage from './pages/ServiceChargesPage';
import PropertyManagement from './pages/PropertyManagement';
import AdminPage from './pages/AdminPage';
import ReserveFundCalculatorPage from './pages/ReserveFundCalculatorPage';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/water-distribution" element={<Layout><WaterDistributionPage /></Layout>} />
        <Route path="/electricity-distribution" element={<Layout><ElectricityDistributionPage /></Layout>} />
        <Route path="/service-charges" element={<Layout><ServiceChargesPage /></Layout>} />
        <Route path="/reserve-fund-calculator" element={<Layout><ReserveFundCalculatorPage /></Layout>} />
        <Route path="/property" element={<Layout><PropertyManagement /></Layout>} />
        <Route path="/admin" element={<Layout><AdminPage /></Layout>} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
