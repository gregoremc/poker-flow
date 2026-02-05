 import { useMemo, useState } from 'react';
 import { usePoker } from '@/contexts/PokerContext';
 import { Header } from '@/components/poker/Header';
 import { BottomNav } from '@/components/poker/BottomNav';
 import { Card, CardContent } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { ArrowDownLeft, ArrowUpRight, Clock, Filter } from 'lucide-react';
 import { formatCurrency, formatTime, getPaymentMethodLabel } from '@/lib/format';
 import { cn } from '@/lib/utils';
 import { Transaction } from '@/types/poker';
 
 type FilterType = 'all' | 'buy-in' | 'cash-out';
 
 export default function History() {
   const { state } = usePoker();
   const [filter, setFilter] = useState<FilterType>('all');
 
   // Group transactions by hour
   const groupedTransactions = useMemo(() => {
     const filtered = filter === 'all' 
       ? state.transactions 
       : state.transactions.filter((t) => t.type === filter);
 
     const groups = new Map<string, Transaction[]>();
     
     for (const transaction of filtered) {
       const date = new Date(transaction.timestamp);
       const hour = date.toLocaleString('pt-BR', { 
         day: '2-digit', 
         month: '2-digit',
         hour: '2-digit'
       });
       
       if (!groups.has(hour)) {
         groups.set(hour, []);
       }
       groups.get(hour)!.push(transaction);
     }
 
     return Array.from(groups.entries()).map(([hour, transactions]) => ({
       hour,
       transactions,
       total: transactions.reduce((sum, t) => {
         if (t.type === 'buy-in') return sum + t.amount;
         return sum - t.amount;
       }, 0),
     }));
   }, [state.transactions, filter]);
 
   return (
     <div className="min-h-screen pb-20">
       <Header title="Histórico" subtitle="Transações por hora" />
 
       <main className="container py-6">
         {/* Filter buttons */}
         <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
           <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
           <Button
             variant={filter === 'all' ? 'default' : 'outline'}
             size="sm"
             onClick={() => setFilter('all')}
             className={cn(
               filter === 'all' ? 'bg-primary' : 'bg-input border-border'
             )}
           >
             Todas
           </Button>
           <Button
             variant={filter === 'buy-in' ? 'default' : 'outline'}
             size="sm"
             onClick={() => setFilter('buy-in')}
             className={cn(
               filter === 'buy-in' ? 'bg-success text-success-foreground' : 'bg-input border-border'
             )}
           >
             Buy-ins
           </Button>
           <Button
             variant={filter === 'cash-out' ? 'default' : 'outline'}
             size="sm"
             onClick={() => setFilter('cash-out')}
             className={cn(
               filter === 'cash-out' ? 'bg-gold text-gold-foreground' : 'bg-input border-border'
             )}
           >
             Cash-outs
           </Button>
         </div>
 
         {/* Transaction list */}
         <ScrollArea className="h-[calc(100vh-240px)]">
           <div className="space-y-6">
             {groupedTransactions.length === 0 ? (
               <div className="text-center py-12">
                 <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                 <p className="text-muted-foreground">
                   Nenhuma transação registrada
                 </p>
               </div>
             ) : (
               groupedTransactions.map(({ hour, transactions, total }) => (
                 <div key={hour}>
                   {/* Hour header */}
                   <div className="flex items-center justify-between mb-3 sticky top-0 bg-background py-2">
                     <div className="flex items-center gap-2">
                       <Clock className="h-4 w-4 text-muted-foreground" />
                       <span className="text-sm font-medium text-muted-foreground">
                         {hour}
                       </span>
                     </div>
                     <span 
                       className={cn(
                         'money-value text-sm',
                         total >= 0 ? 'text-success' : 'text-destructive'
                       )}
                     >
                       {total >= 0 ? '+' : ''}{formatCurrency(total)}
                     </span>
                   </div>
 
                   {/* Transactions in this hour */}
                   <div className="space-y-2">
                     {transactions.map((transaction) => (
                       <Card key={transaction.id} className="card-glow">
                         <CardContent className="py-3 px-4">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                               <div 
                                 className={cn(
                                   'p-2 rounded-lg',
                                   transaction.type === 'buy-in' 
                                     ? 'bg-success/10' 
                                     : 'bg-gold/10'
                                 )}
                               >
                                 {transaction.type === 'buy-in' ? (
                                   <ArrowDownLeft className="h-4 w-4 text-success" />
                                 ) : (
                                   <ArrowUpRight className="h-4 w-4 text-gold" />
                                 )}
                               </div>
                               <div>
                                 <p className="font-medium">{transaction.playerName}</p>
                                 <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                   <span>{transaction.tableName}</span>
                                   <span>•</span>
                                   <span>{formatTime(new Date(transaction.timestamp))}</span>
                                   {transaction.paymentMethod && (
                                     <>
                                       <span>•</span>
                                       <span>{getPaymentMethodLabel(transaction.paymentMethod)}</span>
                                     </>
                                   )}
                                 </div>
                               </div>
                             </div>
                             <div className="text-right">
                               <p 
                                 className={cn(
                                   'money-value text-lg',
                                   transaction.type === 'buy-in' ? 'text-success' : 'text-gold'
                                 )}
                               >
                                 {transaction.type === 'buy-in' ? '+' : '-'}
                                 {formatCurrency(transaction.amount)}
                               </p>
                               {transaction.type === 'cash-out' && transaction.profit !== undefined && (
                                 <Badge 
                                   variant="secondary" 
                                   className={cn(
                                     'text-2xs',
                                     transaction.profit >= 0 
                                       ? 'bg-success/10 text-success' 
                                       : 'bg-destructive/10 text-destructive'
                                   )}
                                 >
                                   {transaction.profit >= 0 ? '+' : ''}{formatCurrency(transaction.profit)}
                                 </Badge>
                               )}
                             </div>
                           </div>
                         </CardContent>
                       </Card>
                     ))}
                   </div>
                 </div>
               ))
             )}
           </div>
         </ScrollArea>
       </main>
 
       <BottomNav />
     </div>
   );
 }