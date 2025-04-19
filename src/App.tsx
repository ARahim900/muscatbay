
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Electricity from './pages/Electricity';
import STP from './pages/STP';
import STPDashboard from './pages/STPDashboard';
import STPAnalytics from './pages/STPAnalytics';
import STPPlant from './pages/STPPlant';
import Auth from './pages/Auth';
import AssetLifecycle from './pages/AssetLifecycle';
import Water from './pages/Water';
import WaterSystem from './pages/WaterSystem';
import WaterZoneAnalysis from './pages/WaterZoneAnalysis';
import WaterConsumptionTypes from './pages/WaterConsumptionTypes';
import WaterLossAnalysis from './pages/WaterLossAnalysis';
import WaterDashboard from './pages/WaterDashboard';
import NotFound from './pages/NotFound';
import ServiceCharges from './pages/ServiceCharges';
import Admin from './pages/Admin';
import PropertyManagement from './pages/PropertyManagement';
import OperatingExpenses from './pages/OperatingExpenses';
import Reports from './pages/Reports';
import ElectricitySystem from './pages/ElectricitySystem';
import HVAC from './pages/HVAC';
import PumpingStations from './pages/PumpingStations';
import Projects from './pages/Projects';
import Contracts from './pages/Contracts';
import { Toaster } from './components/ui/toaster';
import { ThemeProvider } from './components/theme/theme-provider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

// Fix the ProtectedRoute props issue
interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Index />} />
        <Route path="/water" element={<Water />} />
        <Route path="/water-system" element={<WaterSystem />} />
        <Route path="/water-zone-analysis" element={<WaterZoneAnalysis />} />
        <Route path="/water-consumption-types" element={<WaterConsumptionTypes />} />
        <Route path="/water-loss-analysis" element={<WaterLossAnalysis />} />
        <Route path="/water-dashboard" element={<WaterDashboard />} />
        <Route path="/electricity" element={<Electricity />} />
        <Route path="/electricity-system" element={<ElectricitySystem />} />
        <Route path="/hvac" element={<HVAC />} />
        <Route path="/pumping-stations" element={<PumpingStations />} />
        <Route path="/stp" element={<STP />} />
        <Route path="/stp-dashboard" element={<STPDashboard />} />
        <Route path="/stp-analytics" element={<STPAnalytics />} />
        <Route path="/stp-plant" element={<STPPlant />} />
        <Route path="/service-charges" element={<ServiceCharges />} />
        <Route path="/operating-expenses" element={<OperatingExpenses />} />
        <Route path="/property-management" element={<PropertyManagement />} />
        <Route path="/asset-lifecycle" element={<AssetLifecycle />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}>
            <Admin />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
