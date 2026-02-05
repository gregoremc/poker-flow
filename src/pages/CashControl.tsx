 import { usePoker } from '@/contexts/PokerContext';
 import { Header } from '@/components/poker/Header';
 import { BottomNav } from '@/components/poker/BottomNav';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
 import { formatCurrency } from '@/lib/format';
 import { cn } from '@/lib/utils';
 
 export default function CashControl() {
   const { getTodaySummary, state } = usePoker();
   const summary = getTodaySummary();
 
   // Calculate payment method breakdown
   const today = new Date().toDateString();
   const todayBuyIns = state.buyIns.filter(
     (b) => new Date(b.timestamp).toDateString() === today
   );
 
   const paymentBreakdown = todayBuyIns.reduce(
     (acc, b) => {
       acc[b.paymentMethod] = (acc[b.paymentMethod] || 0) + b.amount;
       return acc;
     },
     {} as Record<string, number>
   );
 
   const paymentLabels: Record<string, string> = {
     pix: 'PIX',
     cash: 'Dinheiro',
     debit: 'Débito',
     credit: 'Crédito',
   };
 
   return (
     <div className="min-h-screen pb-20">
       <Header title="Controle de Caixa" subtitle="Resumo do dia" />
 
       <main className="container py-6 space-y-6">
         {/* Main Balance Card */}
         <Card className="card-glow border-primary/20 overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
           <CardContent className="pt-6 relative">
             <div className="text-center">
               <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                 Saldo do Dia
               </p>
               <div className="flex items-center justify-center gap-3">
                 <Wallet className="h-8 w-8 text-primary" />
                 <span 
                   className={cn(
                     'money-value text-5xl',
                     summary.balance >= 0 ? 'text-gold' : 'text-destructive'
                   )}
                 >
                   {formatCurrency(summary.balance)}
                 </span>
               </div>
               <div className="flex items-center justify-center gap-1 mt-2">
                 {summary.balance >= 0 ? (
                   <TrendingUp className="h-4 w-4 text-success" />
                 ) : (
                   <TrendingDown className="h-4 w-4 text-destructive" />
                 )}
                 <span className="text-sm text-muted-foreground">
                   {summary.balance >= 0 ? 'Lucro' : 'Prejuízo'} operacional
                 </span>
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* In/Out Summary */}
         <div className="grid grid-cols-2 gap-4">
           <Card className="card-glow">
             <CardContent className="pt-6">
               <div className="flex items-center gap-3 mb-3">
                 <div className="p-2 rounded-lg bg-success/10">
                   <ArrowDownLeft className="h-5 w-5 text-success" />
                 </div>
                 <span className="text-sm text-muted-foreground">Entradas</span>
               </div>
               <p className="money-value text-2xl text-success">
                 {formatCurrency(summary.totalIn)}
               </p>
             </CardContent>
           </Card>
 
           <Card className="card-glow">
             <CardContent className="pt-6">
               <div className="flex items-center gap-3 mb-3">
                 <div className="p-2 rounded-lg bg-destructive/10">
                   <ArrowUpRight className="h-5 w-5 text-destructive" />
                 </div>
                 <span className="text-sm text-muted-foreground">Saídas</span>
               </div>
               <p className="money-value text-2xl text-destructive">
                 {formatCurrency(summary.totalOut)}
               </p>
             </CardContent>
           </Card>
         </div>
 
         {/* Payment Method Breakdown */}
         <Card className="card-glow">
           <CardHeader>
             <CardTitle className="text-lg">Entradas por Forma de Pagamento</CardTitle>
           </CardHeader>
           <CardContent>
             {Object.keys(paymentBreakdown).length === 0 ? (
               <p className="text-center text-muted-foreground py-4">
                 Nenhuma entrada registrada hoje
               </p>
             ) : (
               <div className="space-y-3">
                 {Object.entries(paymentBreakdown).map(([method, amount]) => (
                   <div key={method} className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">
                       {paymentLabels[method] || method}
                     </span>
                     <span className="money-value text-lg">
                       {formatCurrency(amount)}
                     </span>
                   </div>
                 ))}
               </div>
             )}
           </CardContent>
         </Card>
       </main>
 
       <BottomNav />
     </div>
   );
 }