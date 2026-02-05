 import { Toaster } from "@/components/ui/toaster";
 import { Toaster as Sonner } from "@/components/ui/sonner";
 import { TooltipProvider } from "@/components/ui/tooltip";
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import { HashRouter, Routes, Route } from "react-router-dom";
 import { PokerProvider } from "@/contexts/PokerContext";
 import Index from "./pages/Index";
 import CashControl from "./pages/CashControl";
 import History from "./pages/History";
 import NotFound from "./pages/NotFound";
 
 const queryClient = new QueryClient();
 
 const App = () => (
   <QueryClientProvider client={queryClient}>
     <TooltipProvider>
       <PokerProvider>
         <Toaster />
         <Sonner />
         <HashRouter>
           <Routes>
             <Route path="/" element={<Index />} />
             <Route path="/caixa" element={<CashControl />} />
             <Route path="/historico" element={<History />} />
             <Route path="*" element={<NotFound />} />
           </Routes>
         </HashRouter>
       </PokerProvider>
     </TooltipProvider>
   </QueryClientProvider>
 );
 
 export default App;
