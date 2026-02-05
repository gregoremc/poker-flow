 // Formatting utilities for the Poker Club system
 
 export function formatCurrency(value: number): string {
   return new Intl.NumberFormat('pt-BR', {
     style: 'currency',
     currency: 'BRL',
     minimumFractionDigits: 0,
     maximumFractionDigits: 0,
   }).format(value);
 }
 
 export function formatTime(date: Date): string {
   return new Intl.DateTimeFormat('pt-BR', {
     hour: '2-digit',
     minute: '2-digit',
   }).format(date);
 }
 
 export function formatDateTime(date: Date): string {
   return new Intl.DateTimeFormat('pt-BR', {
     day: '2-digit',
     month: '2-digit',
     hour: '2-digit',
     minute: '2-digit',
   }).format(date);
 }
 
 export function formatDate(date: Date): string {
   return new Intl.DateTimeFormat('pt-BR', {
     day: '2-digit',
     month: '2-digit',
     year: 'numeric',
   }).format(date);
 }
 
 export function getPaymentMethodLabel(method: string): string {
   const labels: Record<string, string> = {
     pix: 'PIX',
     cash: 'Dinheiro',
     debit: 'Débito',
     credit: 'Crédito',
   };
   return labels[method] || method;
 }