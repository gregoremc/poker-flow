 import { formatDate } from '@/lib/format';
 import { Spade } from 'lucide-react';
 
 interface HeaderProps {
   title: string;
   subtitle?: string;
 }
 
 export function Header({ title, subtitle }: HeaderProps) {
   const today = formatDate(new Date());
 
   return (
     <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border safe-area-top">
       <div className="container py-4">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-primary/10">
               <Spade className="h-6 w-6 text-primary" />
             </div>
             <div>
               <h1 className="text-xl font-bold">{title}</h1>
               {subtitle && (
                 <p className="text-sm text-muted-foreground">{subtitle}</p>
               )}
             </div>
           </div>
           <div className="text-right">
             <p className="text-sm font-medium text-muted-foreground">{today}</p>
           </div>
         </div>
       </div>
     </header>
   );
 }