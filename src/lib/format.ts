import { PaymentMethod } from '@/types/poker';

// Formatting utilities for the Poker Club system

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(date);
}

export function getPaymentMethodLabel(method: PaymentMethod | string): string {
  const labels: Record<string, string> = {
    pix: 'PIX',
    cash: 'Dinheiro',
    debit: 'Débito',
    credit: 'Crédito',
    credit_fiado: 'Fiado',
    bonus: 'Bônus',
    fichas: 'Fichas',
  };
  return labels[method] || method;
}