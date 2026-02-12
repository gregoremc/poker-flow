import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import CashControl from "./pages/CashControl";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Dealers from "./pages/Dealers";
import Rake from "./pages/Rake";
import Receivables from "./pages/Receivables";
import Players from "./pages/Players";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/caixa" element={<ProtectedRoute><CashControl /></ProtectedRoute>} />
            <Route path="/historico" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/dealers" element={<ProtectedRoute><Dealers /></ProtectedRoute>} />
            <Route path="/rake" element={<ProtectedRoute><Rake /></ProtectedRoute>} />
            <Route path="/receber" element={<ProtectedRoute><Receivables /></ProtectedRoute>} />
            <Route path="/jogadores" element={<ProtectedRoute><Players /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
