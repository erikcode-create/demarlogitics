import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Shippers from "./pages/Shippers";
import ShipperDetail from "./pages/ShipperDetail";
import Carriers from "./pages/Carriers";
import CarrierDetail from "./pages/CarrierDetail";
import Loads from "./pages/Loads";
import LoadDetail from "./pages/LoadDetail";
import Contracts from "./pages/Contracts";
import ContractNew from "./pages/ContractNew";
import ContractDetail from "./pages/ContractDetail";
import Alerts from "./pages/Alerts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/shippers" element={<Shippers />} />
              <Route path="/shippers/:id" element={<ShipperDetail />} />
              <Route path="/carriers" element={<Carriers />} />
              <Route path="/carriers/:id" element={<CarrierDetail />} />
              <Route path="/loads" element={<Loads />} />
              <Route path="/loads/:id" element={<LoadDetail />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/contracts/new" element={<ContractNew />} />
              <Route path="/contracts/:id" element={<ContractDetail />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
