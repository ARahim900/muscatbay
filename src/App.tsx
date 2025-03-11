
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Electricity from "./pages/Electricity";
import Water from "./pages/Water";
import STP from "./pages/STP";
import Projects from "./pages/Projects";
import AssetLifecycleManagement from "./pages/AssetLifecycleManagement";
import ZoneDetails from "./pages/ZoneDetails";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/electricity" element={<Electricity />} />
          <Route path="/stp" element={<STP />} />
          <Route path="/water" element={<Water />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/alm" element={<AssetLifecycleManagement />} />
          <Route path="/zone-details" element={<ZoneDetails />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
