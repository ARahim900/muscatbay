
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import ALM from '@/pages/ALM';
import ReserveFundCalculatorPage from '@/pages/ReserveFundCalculatorPage';
import Projects from '@/pages/Projects';
import Electricity from '@/pages/Electricity';
import ReserveFundDashboard from '@/pages/ReserveFundDashboard';
import ServiceCharges from '@/pages/ServiceCharges';
import Admin from '@/pages/Admin';
import STP from '@/pages/STP';
import Auth from '@/pages/Auth';
import PropertyManagement from '@/pages/PropertyManagement';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import STPPlant from '@/pages/STPPlant';
import Contracts from '@/pages/Contracts';
import OperatingExpenses from '@/pages/OperatingExpenses';
import HVAC from '@/pages/HVAC';
import Reports from '@/pages/Reports';
import PumpingStations from '@/pages/PumpingStations';
import Water from '@/pages/Water';
import WaterSystem from '@/pages/WaterSystem';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/alm" element={<ALM />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/electricity" element={<Electricity />} />
        <Route path="/electricity-system" element={<Electricity />} />
        <Route path="/reserve-fund-calculator" element={<ReserveFundCalculatorPage />} />
        <Route path="/reserve-fund-dashboard" element={<ReserveFundDashboard />} />
        <Route path="/service-charges" element={<ServiceCharges />} />
        <Route path="/stp" element={<STP />} />
        <Route path="/stp-dashboard" element={<STP />} />
        <Route path="/stp-plant" element={<STPPlant />} />
        <Route path="/water" element={<Water />} />
        <Route path="/water-system" element={<WaterSystem />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/property-management" element={<PropertyManagement />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/operating-expenses" element={<OperatingExpenses />} />
        <Route path="/hvac" element={<HVAC />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/pumping-stations" element={<PumpingStations />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
