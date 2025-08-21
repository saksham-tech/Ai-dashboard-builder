import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DashboardProvider } from "./context/DashboardContext";
import Index from "./pages/Index";
import DataView from "./pages/DataView";
import AIAssistant from "./pages/AIAssistant";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Login from "./pages/Login";
import { ThemeProvider } from "./components/theme-provider";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/data" element={<ProtectedRoute><DataView /></ProtectedRoute>} />
    <Route path="/ai" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <DashboardProvider>
              <Toaster />
              <Sonner />
              <AppRoutes />
            </DashboardProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;