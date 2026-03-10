import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import SetPassword from "./pages/SetPassword";
import SalesLanding from "./pages/SalesLanding";
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
import ContractBulkCreate from "./pages/ContractBulkCreate";
import Alerts from "./pages/Alerts";
import OutboundCalls from "./pages/OutboundCalls";
import SalesPipeline from "./pages/SalesPipeline";
import SalesTasks from "./pages/SalesTasks";
import EmailTemplates from "./pages/EmailTemplates";
import SalesDashboard from "./pages/SalesDashboard";
import PerformanceTracker from "./pages/PerformanceTracker";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<SalesLanding />} />
        <Route path="/*" element={
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
              <Route path="/contracts/bulk-create" element={<ContractBulkCreate />} />
              <Route path="/contracts/:id" element={<ContractDetail />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/sales/calls" element={<OutboundCalls />} />
              <Route path="/sales/pipeline" element={<SalesPipeline />} />
              <Route path="/sales/tasks" element={<SalesTasks />} />
              <Route path="/sales/templates" element={<EmailTemplates />} />
              <Route path="/sales/dashboard" element={<SalesDashboard />} />
              <Route path="/sales/performance" element={<PerformanceTracker />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        } />
      </Routes>
    </AppProvider>
  );
}

function AuthGate() {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (session) return <Navigate to="/dashboard" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthGate />} />
            <Route path="/set-password" element={<SetPassword />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
