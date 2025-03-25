import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./components/theme/theme-provider";
import NotFound from "./pages/NotFound";
import Water from "./pages/Water";
import Electricity from "./pages/Electricity";
import ElectricitySystem from "./pages/ElectricitySystem";
import WaterSystem from "./pages/WaterSystem";
import WaterConsumptionTypes from "./pages/WaterConsumptionTypes";
import STP from "./pages/STP";
import STPPlant from "./pages/STPPlant";
import STPDashboard from "./pages/STPDashboard";
import STPAnalytics from "./pages/STPAnalytics";
import PumpingStations from "./pages/PumpingStations";
import HVAC from "./pages/HVAC";
import Reports from "./pages/Reports";
import Projects from "./pages/Projects";
import Contracts from "./pages/Contracts";
import AssetLifecycle from "./pages/AssetLifecycle";
import Admin from "./pages/Admin";
import { Toaster } from "./components/ui/toaster";
import OperatingExpenses from "./pages/OperatingExpenses";

function App() {
  const storedTheme = localStorage.getItem("vite-ui-theme") || "light";

  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Index />} />
              <Route path="water" element={<Water />} />
              <Route path="water-types" element={<WaterConsumptionTypes />} />
              <Route path="water-system" element={<WaterSystem />} />
              <Route path="electricity" element={<Electricity />} />
              <Route path="electricity-system" element={<ElectricitySystem />} />
              <Route path="stp" element={<STP />} />
              <Route path="stp-dashboard" element={<STPDashboard />} />
              <Route path="stp-plant" element={<STPPlant />} />
              <Route path="stp-analytics" element={<STPAnalytics />} />
              <Route path="pumping-stations" element={<PumpingStations />} />
              <Route path="hvac" element={<HVAC />} />
              <Route path="reports" element={<Reports />} />
              <Route path="projects" element={<Projects />} />
              <Route path="contracts" element={<Contracts />} />
              <Route path="alm" element={<AssetLifecycle />} />
              <Route path="operating-expenses" element={<OperatingExpenses />} />
              <Route path="admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </ThemeProvider>
      </AuthProvider>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
