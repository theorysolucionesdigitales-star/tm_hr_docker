import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import AppLayout from "./components/AppLayout";

import Clientes from "./pages/Clientes";
import ClienteDetail from "./pages/ClienteDetail";
import Procesos from "./pages/Procesos";
import ProcesoDetail from "./pages/ProcesoDetail";
import Usuarios from "./pages/Usuarios";
import NotFound from "./pages/NotFound";
import PublicReport from "./pages/PublicReport";
import { ThemeProvider } from "@/components/ThemeProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos de cache estable para navegaciones instantáneas
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <AppLayout />
  );
};

const AuthRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/clientes" replace />;
  return <Auth />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<AuthRoute />} />
              <Route path="/reporte/:token" element={<PublicReport />} />
              <Route path="/" element={<ProtectedRoutes />}>
                <Route index element={<Navigate to="/clientes" replace />} />

                <Route path="clientes" element={<Clientes />} />
                <Route path="clientes/:id" element={<ClienteDetail />} />
                <Route path="procesos" element={<Procesos />} />
                <Route path="procesos/:id" element={<ProcesoDetail />} />
                <Route path="usuarios" element={<Usuarios />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
