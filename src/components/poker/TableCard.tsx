 import { Table } from '@/types/poker';
 import { usePoker } from '@/contexts/PokerContext';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Plus, Users, ArrowUpRight, Power } from 'lucide-react';
 import { formatCurrency } from '@/lib/format';
 
 interface TableCardProps {
   table: Table;
   onBuyIn: (tableId: string) => void;
   onCashOut: (tableId: string) => void;
 }
 
 export function TableCard({ table, onBuyIn, onCashOut }: TableCardProps) {
   const { getTableBuyInsTotal, getActiveSessions, toggleTable } = usePoker();
   
   const totalBuyIns = getTableBuyInsTotal(table.id);
   const activeSessions = getActiveSessions(table.id);
   const playerCount = activeSessions.length;
 
   return (
     <Card 
       className={`card-glow transition-all duration-300 ${
         table.isActive 
           ? 'border-primary/30 hover:border-primary/50' 
           : 'border-border opacity-60'
       }`}
     >
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <CardTitle className="text-xl font-bold">{table.name}</CardTitle>
           <div className="flex items-center gap-2">
             {table.isActive && (
               <div className="pulse-live">
                 <Badge variant="default" className="bg-primary text-primary-foreground">
                   Ativa
                 </Badge>
               </div>
             )}
             <Button
               variant="ghost"
               size="icon"
               onClick={() => toggleTable(table.id)}
               className="h-8 w-8"
             >
               <Power className={`h-4 w-4 ${table.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
             </Button>
           </div>
         </div>
       </CardHeader>
 
       <CardContent className="space-y-4">
         {/* Stats */}
         <div className="grid grid-cols-2 gap-4">
           <div className="space-y-1">
             <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Buy-ins</p>
             <p className="money-value text-2xl text-gold">{formatCurrency(totalBuyIns)}</p>
           </div>
           <div className="space-y-1">
             <p className="text-xs text-muted-foreground uppercase tracking-wider">Jogadores</p>
             <div className="flex items-center gap-2">
               <Users className="h-5 w-5 text-muted-foreground" />
               <span className="text-2xl font-bold">{playerCount}</span>
             </div>
           </div>
         </div>
 
         {/* Active players preview */}
         {playerCount > 0 && (
           <div className="flex flex-wrap gap-1">
             {activeSessions.slice(0, 3).map((session) => (
               <Badge key={session.playerId} variant="secondary" className="text-xs">
                 {session.playerName.split(' ')[0]}
               </Badge>
             ))}
             {playerCount > 3 && (
               <Badge variant="secondary" className="text-xs">
                 +{playerCount - 3}
               </Badge>
             )}
           </div>
         )}
 
         {/* Action buttons */}
         {table.isActive && (
           <div className="grid grid-cols-2 gap-3 pt-2">
             <Button
               onClick={() => onBuyIn(table.id)}
               className="btn-quick-action bg-primary hover:bg-primary/90"
             >
               <Plus className="h-5 w-5" />
               Buy-in
             </Button>
             <Button
               onClick={() => onCashOut(table.id)}
               variant="outline"
               className="btn-quick-action border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/50"
               disabled={playerCount === 0}
             >
               <ArrowUpRight className="h-5 w-5" />
               Cash-out
             </Button>
           </div>
         )}
       </CardContent>
     </Card>
   );
 }