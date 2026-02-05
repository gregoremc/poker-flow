import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CashControl from "./pages/CashControl";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Dealers from "./pages/Dealers";
import Rake from "./pages/Rake";
import Receivables from "./pages/Receivables";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/caixa" element={<CashControl />} />
          <Route path="/historico" element={<History />} />
          <Route path="/dealers" element={<Dealers />} />
          <Route path="/rake" element={<Rake />} />
          <Route path="/receber" element={<Receivables />} />
          <Route path="/configuracoes" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
