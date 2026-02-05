 // Core types for Poker Club Financial System
 
 export type PaymentMethod = 'pix' | 'cash' | 'debit' | 'credit';
 
 export interface Player {
   id: string;
   name: string;
   createdAt: Date;
 }
 
 export interface Table {
   id: string;
   name: string;
   isActive: boolean;
   createdAt: Date;
 }
 
 export interface BuyIn {
   id: string;
   tableId: string;
   playerId: string;
   playerName: string;
   amount: number;
   paymentMethod: PaymentMethod;
   timestamp: Date;
 }
 
 export interface CashOut {
   id: string;
   tableId: string;
   playerId: string;
   playerName: string;
   chipValue: number; // Value of chips at cash-out
   totalBuyIn: number; // Sum of all buy-ins for this session
   profit: number; // chipValue - totalBuyIn
   timestamp: Date;
 }
 
 export interface Transaction {
   id: string;
   type: 'buy-in' | 'cash-out';
   tableId: string;
   tableName: string;
   playerId: string;
   playerName: string;
   amount: number;
   paymentMethod?: PaymentMethod;
   profit?: number;
   timestamp: Date;
 }
 
 export interface DailySummary {
   date: string;
   totalBuyIns: number;
   totalCashOuts: number;
   balance: number;
   transactionCount: number;
 }
 
 // Active session for a player at a table
 export interface ActiveSession {
   playerId: string;
   playerName: string;
   tableId: string;
   totalBuyIn: number;
   buyInCount: number;
   startTime: Date;
 }