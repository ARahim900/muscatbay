
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Electricity from "./pages/Electricity";
import Water from "./pages/Water";
import Projects from "./pages/Projects";
import AssetLifecycleManagement from "./pages/AssetLifecycleManagement";
import Auth from "./pages/Auth";
import WaterConsumptionTypes from './pages/WaterConsumptionTypes';
import Contracts from './pages/Contracts';
import STP from './pages/STP';
import WaterSystem from './pages/WaterSystem';
import ElectricitySystem from './pages/ElectricitySystem';
import "@/styles/index.css";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/electricity" element={<ProtectedRoute><Electricity /></ProtectedRoute>} />
            <Route path="/electricity-system" element={<ProtectedRoute><ElectricitySystem /></ProtectedRoute>} />
            <Route path="/stp" element={<ProtectedRoute><STP /></ProtectedRoute>} />
            <Route path="/water" element={<ProtectedRoute><Water /></ProtectedRoute>} />
            <Route path="/water-consumption-types" element={<ProtectedRoute><WaterConsumptionTypes /></ProtectedRoute>} />
            <Route path="/water-system" element={<ProtectedRoute><WaterSystem /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/alm" element={<ProtectedRoute><AssetLifecycleManagement /></ProtectedRoute>} />
            <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
