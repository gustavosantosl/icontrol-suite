import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TenantProvider } from "@/contexts/TenantContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Contas from "./pages/Contas";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import ClientesFornecedores from "./pages/ClientesFornecedores";
import Usuarios from "./pages/Usuarios";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TenantProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <AuthGuard>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/contas" element={
              <AuthGuard>
                <AppLayout>
                  <Contas />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/clientes-fornecedores" element={
              <AuthGuard>
                <AppLayout>
                  <ClientesFornecedores />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/relatorios" element={
              <AuthGuard>
                <AppLayout>
                  <Relatorios />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/configuracoes" element={
              <AuthGuard requireRoles={['admin', 'manager']}>
                <AppLayout>
                  <Configuracoes />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/usuarios" element={
              <AuthGuard requireRoles={['admin', 'manager']}>
                <AppLayout>
                  <Usuarios />
                </AppLayout>
              </AuthGuard>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TenantProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
