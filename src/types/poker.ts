// Core types for Poker Club Financial System
// Note: Supabase returns dates as strings, not Date objects

export type PaymentMethod = 'pix' | 'cash' | 'debit' | 'credit' | 'credit_fiado' | 'bonus';

export interface Player {
  id: string;
  name: string;
  credit_balance: number;
  credit_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Dealer {
  id: string;
  name: string;
  is_active: boolean;
  total_tips: number;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  name: string;
  session_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChipType {
  id: string;
  color: string;
  value: number;
  sort_order: number;
  created_at: string;
}

export interface ChipInventory {
  [chipTypeId: string]: number;
}

export interface CashSession {
  id: string;
  name: string;
  responsible: string | null;
  session_date: string;
  is_open: boolean;
  initial_chip_inventory: ChipInventory | null;
  final_chip_inventory: ChipInventory | null;
  notes: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuyIn {
  id: string;
  table_id: string;
  player_id: string;
  session_id: string | null;
  amount: number;
  payment_method: PaymentMethod;
  is_bonus: boolean;
  created_at: string;
  // Joined fields
  player?: Player;
  table?: Table;
}

export interface CashOut {
  id: string;
  table_id: string;
  player_id: string;
  session_id: string | null;
  chip_value: number;
  total_buy_in: number;
  profit: number;
  payment_method: PaymentMethod;
  created_at: string;
  // Joined fields
  player?: Player;
  table?: Table;
}

export interface DealerTip {
  id: string;
  dealer_id: string;
  session_id: string | null;
  table_id: string | null;
  amount: number;
  notes: string | null;
  created_at: string;
  // Joined fields
  dealer?: Dealer;
}

export interface CreditRecord {
  id: string;
  player_id: string;
  buy_in_id: string | null;
  amount: number;
  is_paid: boolean;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  // Joined fields
  player?: Player;
}

export interface ClubSettings {
  id: string;
  club_name: string;
  logo_url: string | null;
  credit_limit_per_player: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  type: 'buy-in' | 'cash-out' | 'dealer-tip';
  table_id?: string;
  table_name?: string;
  player_id?: string;
  player_name?: string;
  dealer_id?: string;
  dealer_name?: string;
  amount: number;
  payment_method?: PaymentMethod;
  profit?: number;
  is_bonus?: boolean;
  timestamp: Date;
}

export interface DailySummary {
  date: string;
  totalBuyIns: number;
  totalCashOuts: number;
  totalBonuses: number;
  totalCredits: number;
  totalDealerTips: number;
  balance: number;
  realBalance: number; // balance - bonuses
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
