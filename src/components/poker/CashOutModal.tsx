 import { useState } from 'react';
 import { usePoker } from '@/contexts/PokerContext';
 import { ActiveSession } from '@/types/poker';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { ArrowUpRight, TrendingUp, TrendingDown, Minus, ChevronLeft } from 'lucide-react';
 import { formatCurrency, formatTime } from '@/lib/format';
 import { cn } from '@/lib/utils';
 
 interface CashOutModalProps {
   open: boolean;
   onClose: () => void;
   tableId: string;
 }
 
 export function CashOutModal({ open, onClose, tableId }: CashOutModalProps) {
   const { state, getActiveSessions, addCashOut } = usePoker();
   const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
   const [chipValue, setChipValue] = useState<number | ''>('');
 
   const tableName = state.tables.find((t) => t.id === tableId)?.name || 'Mesa';
   const activeSessions = getActiveSessions(tableId);
 
   const profit = selectedSession && chipValue !== '' 
     ? Number(chipValue) - selectedSession.totalBuyIn 
     : 0;
 
   const handleSubmit = () => {
     if (!selectedSession || chipValue === '' || Number(chipValue) < 0) return;
     
     addCashOut(tableId, selectedSession.playerId, selectedSession.playerName, Number(chipValue));
     handleClose();
   };
 
   const handleClose = () => {
     setSelectedSession(null);
     setChipValue('');
     onClose();
   };
 
   const handleBack = () => {
     setSelectedSession(null);
     setChipValue('');
   };
 
   const isValid = selectedSession && chipValue !== '' && Number(chipValue) >= 0;
 
   return (
     <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
       <DialogContent className="modal-solid sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="text-xl font-bold flex items-center gap-2">
             {selectedSession && (
               <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 -ml-2">
                 <ChevronLeft className="h-5 w-5" />
               </Button>
             )}
             <ArrowUpRight className="h-5 w-5 text-gold" />
             Cash-out - {tableName}
           </DialogTitle>
         </DialogHeader>
 
         {!selectedSession ? (
           /* Player List */
           <ScrollArea className="max-h-[400px] py-4">
             <div className="space-y-2">
               {activeSessions.length === 0 ? (
                 <p className="text-center text-muted-foreground py-8">
                   Nenhum jogador ativo nesta mesa
                 </p>
               ) : (
                 activeSessions.map((session) => (
                   <Button
                     key={session.playerId}
                     variant="outline"
                     className="w-full touch-target justify-between bg-input border-border hover:bg-accent group"
                     onClick={() => setSelectedSession(session)}
                   >
                     <div className="flex flex-col items-start">
                       <span className="font-semibold">{session.playerName}</span>
                       <span className="text-xs text-muted-foreground">
                         {session.buyInCount} buy-in{session.buyInCount > 1 ? 's' : ''} • 
                         Desde {formatTime(session.startTime)}
                       </span>
                     </div>
                     <div className="flex items-center gap-2">
                       <span className="money-value text-gold">
                         {formatCurrency(session.totalBuyIn)}
                       </span>
                       <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                   </Button>
                 ))
               )}
             </div>
           </ScrollArea>
         ) : (
           /* Cash-out Form */
           <div className="space-y-6 py-4">
             {/* Player info */}
             <div className="p-4 rounded-lg bg-secondary/50 border border-border">
               <p className="font-semibold text-lg">{selectedSession.playerName}</p>
               <div className="flex items-center justify-between mt-2">
                 <span className="text-sm text-muted-foreground">Total em jogo:</span>
                 <span className="money-value text-gold text-lg">
                   {formatCurrency(selectedSession.totalBuyIn)}
                 </span>
               </div>
             </div>
 
             {/* Chip value input */}
             <div className="space-y-2">
               <Label className="text-sm font-medium">Valor das Fichas</Label>
               <Input
                 type="number"
                 placeholder="0"
                 value={chipValue}
                 onChange={(e) => setChipValue(e.target.value ? Number(e.target.value) : '')}
                 className="touch-target text-2xl font-mono font-bold text-center bg-input border-border"
                 autoFocus
               />
             </div>
 
             {/* Profit/Loss calculation */}
             {chipValue !== '' && (
               <div 
                 className={cn(
                   'p-4 rounded-lg border flex items-center justify-between',
                   profit > 0 
                     ? 'bg-success/10 border-success/30' 
                     : profit < 0 
                     ? 'bg-destructive/10 border-destructive/30'
                     : 'bg-secondary/50 border-border'
                 )}
               >
                 <div className="flex items-center gap-2">
                   {profit > 0 ? (
                     <TrendingUp className="h-5 w-5 text-success" />
                   ) : profit < 0 ? (
                     <TrendingDown className="h-5 w-5 text-destructive" />
                   ) : (
                     <Minus className="h-5 w-5 text-muted-foreground" />
                   )}
                   <span className="text-sm font-medium">
                     {profit > 0 ? 'Lucro' : profit < 0 ? 'Prejuízo' : 'Empate'}
                   </span>
                 </div>
                 <span 
                   className={cn(
                     'money-value text-xl',
                     profit > 0 ? 'text-success' : profit < 0 ? 'text-destructive' : 'text-muted-foreground'
                   )}
                 >
                   {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                 </span>
               </div>
             )}
           </div>
         )}
 
         {selectedSession && (
           <Button
             onClick={handleSubmit}
             disabled={!isValid}
             className="w-full touch-target text-lg font-semibold bg-gold text-gold-foreground hover:bg-gold/90"
           >
             <ArrowUpRight className="mr-2 h-5 w-5" />
             Confirmar Cash-out
           </Button>
         )}
       </DialogContent>
     </Dialog>
   );
 }