 import { useState } from 'react';
 import { usePoker } from '@/contexts/PokerContext';
 import { Header } from '@/components/poker/Header';
 import { BottomNav } from '@/components/poker/BottomNav';
 import { TableCard } from '@/components/poker/TableCard';
 import { BuyInModal } from '@/components/poker/BuyInModal';
 import { CashOutModal } from '@/components/poker/CashOutModal';
 import { AddTableModal } from '@/components/poker/AddTableModal';
 import { Button } from '@/components/ui/button';
 import { Plus } from 'lucide-react';
 
 export default function Index() {
   const { state } = usePoker();
   const [buyInTableId, setBuyInTableId] = useState<string | null>(null);
   const [cashOutTableId, setCashOutTableId] = useState<string | null>(null);
   const [showAddTable, setShowAddTable] = useState(false);
 
   const activeTables = state.tables.filter((t) => t.isActive);
   const inactiveTables = state.tables.filter((t) => !t.isActive);
 
   return (
     <div className="min-h-screen pb-20">
       <Header title="Poker Club" subtitle="Gestão Financeira" />
 
       <main className="container py-6">
         {/* Quick Add Table */}
         <div className="flex items-center justify-between mb-6">
           <div>
             <h2 className="text-lg font-semibold">
               Mesas Ativas ({activeTables.length})
             </h2>
           </div>
           <Button
             onClick={() => setShowAddTable(true)}
             size="sm"
             className="bg-primary hover:bg-primary/90"
           >
             <Plus className="h-4 w-4 mr-1" />
             Nova Mesa
           </Button>
         </div>
 
         {/* Active Tables */}
         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
           {activeTables.map((table) => (
             <TableCard
               key={table.id}
               table={table}
               onBuyIn={setBuyInTableId}
               onCashOut={setCashOutTableId}
             />
           ))}
           {activeTables.length === 0 && (
             <div className="col-span-full text-center py-12">
               <p className="text-muted-foreground mb-4">
                 Nenhuma mesa ativa no momento
               </p>
               <Button
                 onClick={() => setShowAddTable(true)}
                 variant="outline"
                 className="border-primary/30 text-primary hover:bg-primary/10"
               >
                 <Plus className="h-4 w-4 mr-2" />
                 Criar primeira mesa
               </Button>
             </div>
           )}
         </div>
 
         {/* Inactive Tables */}
         {inactiveTables.length > 0 && (
           <div>
             <h3 className="text-sm font-medium text-muted-foreground mb-4">
               Mesas Inativas ({inactiveTables.length})
             </h3>
             <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
               {inactiveTables.map((table) => (
                 <TableCard
                   key={table.id}
                   table={table}
                   onBuyIn={setBuyInTableId}
                   onCashOut={setCashOutTableId}
                 />
               ))}
             </div>
           </div>
         )}
       </main>
 
       <BottomNav />
 
       {/* Modals */}
       <BuyInModal
         open={!!buyInTableId}
         onClose={() => setBuyInTableId(null)}
         tableId={buyInTableId || ''}
       />
       <CashOutModal
         open={!!cashOutTableId}
         onClose={() => setCashOutTableId(null)}
         tableId={cashOutTableId || ''}
       />
       <AddTableModal
         open={showAddTable}
         onClose={() => setShowAddTable(false)}
       />
     </div>
   );
 }
