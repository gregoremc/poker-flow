 import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
 import { 
   Player, 
   Table, 
   BuyIn, 
   CashOut, 
   Transaction, 
   ActiveSession,
   PaymentMethod 
 } from '@/types/poker';
 
 // Generate unique IDs
 const generateId = () => crypto.randomUUID();
 
 interface PokerState {
   players: Player[];
   tables: Table[];
   buyIns: BuyIn[];
   cashOuts: CashOut[];
   transactions: Transaction[];
 }
 
 type PokerAction =
   | { type: 'ADD_PLAYER'; payload: { name: string } }
   | { type: 'ADD_TABLE'; payload: { name: string } }
   | { type: 'TOGGLE_TABLE'; payload: { tableId: string } }
   | { type: 'ADD_BUYIN'; payload: { tableId: string; playerId: string; playerName: string; amount: number; paymentMethod: PaymentMethod } }
   | { type: 'ADD_CASHOUT'; payload: { tableId: string; playerId: string; playerName: string; chipValue: number } }
   | { type: 'LOAD_STATE'; payload: PokerState };
 
 const initialState: PokerState = {
   players: [
     { id: '1', name: 'Carlos Silva', createdAt: new Date() },
     { id: '2', name: 'Ana Santos', createdAt: new Date() },
     { id: '3', name: 'Pedro Lima', createdAt: new Date() },
     { id: '4', name: 'Mariana Costa', createdAt: new Date() },
     { id: '5', name: 'João Oliveira', createdAt: new Date() },
   ],
   tables: [
     { id: '1', name: 'Mesa 1', isActive: true, createdAt: new Date() },
     { id: '2', name: 'Mesa 2', isActive: true, createdAt: new Date() },
     { id: '3', name: 'Mesa 3', isActive: false, createdAt: new Date() },
   ],
   buyIns: [],
   cashOuts: [],
   transactions: [],
 };
 
 function pokerReducer(state: PokerState, action: PokerAction): PokerState {
   switch (action.type) {
     case 'ADD_PLAYER': {
       const newPlayer: Player = {
         id: generateId(),
         name: action.payload.name,
         createdAt: new Date(),
       };
       return { ...state, players: [...state.players, newPlayer] };
     }
 
     case 'ADD_TABLE': {
       const newTable: Table = {
         id: generateId(),
         name: action.payload.name,
         isActive: true,
         createdAt: new Date(),
       };
       return { ...state, tables: [...state.tables, newTable] };
     }
 
     case 'TOGGLE_TABLE': {
       const tables = state.tables.map((t) =>
         t.id === action.payload.tableId ? { ...t, isActive: !t.isActive } : t
       );
       return { ...state, tables };
     }
 
     case 'ADD_BUYIN': {
       const { tableId, playerId, playerName, amount, paymentMethod } = action.payload;
       const table = state.tables.find((t) => t.id === tableId);
       const timestamp = new Date();
       
       const newBuyIn: BuyIn = {
         id: generateId(),
         tableId,
         playerId,
         playerName,
         amount,
         paymentMethod,
         timestamp,
       };
 
       const newTransaction: Transaction = {
         id: generateId(),
         type: 'buy-in',
         tableId,
         tableName: table?.name || 'Mesa',
         playerId,
         playerName,
         amount,
         paymentMethod,
         timestamp,
       };
 
       return {
         ...state,
         buyIns: [...state.buyIns, newBuyIn],
         transactions: [newTransaction, ...state.transactions],
       };
     }
 
     case 'ADD_CASHOUT': {
       const { tableId, playerId, playerName, chipValue } = action.payload;
       const table = state.tables.find((t) => t.id === tableId);
       const timestamp = new Date();
 
       // Calculate total buy-ins for this player at this table (without cash-out yet)
       const playerBuyIns = state.buyIns.filter(
         (b) => b.playerId === playerId && b.tableId === tableId
       );
       const playerCashOuts = state.cashOuts.filter(
         (c) => c.playerId === playerId && c.tableId === tableId
       );
 
       // Sum all buy-ins minus previously cashed out
       const totalBuyInAll = playerBuyIns.reduce((sum, b) => sum + b.amount, 0);
       const totalCashedOut = playerCashOuts.reduce((sum, c) => sum + c.totalBuyIn, 0);
       const totalBuyIn = totalBuyInAll - totalCashedOut;
       
       const profit = chipValue - totalBuyIn;
 
       const newCashOut: CashOut = {
         id: generateId(),
         tableId,
         playerId,
         playerName,
         chipValue,
         totalBuyIn,
         profit,
         timestamp,
       };
 
       const newTransaction: Transaction = {
         id: generateId(),
         type: 'cash-out',
         tableId,
         tableName: table?.name || 'Mesa',
         playerId,
         playerName,
         amount: chipValue,
         profit,
         timestamp,
       };
 
       return {
         ...state,
         cashOuts: [...state.cashOuts, newCashOut],
         transactions: [newTransaction, ...state.transactions],
       };
     }
 
     case 'LOAD_STATE':
       return action.payload;
 
     default:
       return state;
   }
 }
 
 interface PokerContextType {
   state: PokerState;
   addPlayer: (name: string) => void;
   addTable: (name: string) => void;
   toggleTable: (tableId: string) => void;
   addBuyIn: (tableId: string, playerId: string, playerName: string, amount: number, paymentMethod: PaymentMethod) => void;
   addCashOut: (tableId: string, playerId: string, playerName: string, chipValue: number) => void;
   getTableBuyInsTotal: (tableId: string) => number;
   getActiveSessions: (tableId: string) => ActiveSession[];
   getPlayerSessionTotal: (tableId: string, playerId: string) => number;
   getTodaySummary: () => { totalIn: number; totalOut: number; balance: number };
 }
 
 const PokerContext = createContext<PokerContextType | undefined>(undefined);
 
 const STORAGE_KEY = 'poker-club-data';
 
 export function PokerProvider({ children }: { children: ReactNode }) {
   const [state, dispatch] = useReducer(pokerReducer, initialState);
 
   // Load state from localStorage on mount
   useEffect(() => {
     try {
       const saved = localStorage.getItem(STORAGE_KEY);
       if (saved) {
         const parsed = JSON.parse(saved);
         // Convert date strings back to Date objects
         const loadedState: PokerState = {
           ...parsed,
           players: parsed.players.map((p: Player) => ({ ...p, createdAt: new Date(p.createdAt) })),
           tables: parsed.tables.map((t: Table) => ({ ...t, createdAt: new Date(t.createdAt) })),
           buyIns: parsed.buyIns.map((b: BuyIn) => ({ ...b, timestamp: new Date(b.timestamp) })),
           cashOuts: parsed.cashOuts.map((c: CashOut) => ({ ...c, timestamp: new Date(c.timestamp) })),
           transactions: parsed.transactions.map((t: Transaction) => ({ ...t, timestamp: new Date(t.timestamp) })),
         };
         dispatch({ type: 'LOAD_STATE', payload: loadedState });
       }
     } catch (error) {
       console.error('Error loading state from localStorage:', error);
     }
   }, []);
 
   // Save state to localStorage on changes
   useEffect(() => {
     try {
       localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
     } catch (error) {
       console.error('Error saving state to localStorage:', error);
     }
   }, [state]);
 
   const addPlayer = (name: string) => dispatch({ type: 'ADD_PLAYER', payload: { name } });
   const addTable = (name: string) => dispatch({ type: 'ADD_TABLE', payload: { name } });
   const toggleTable = (tableId: string) => dispatch({ type: 'TOGGLE_TABLE', payload: { tableId } });
   
   const addBuyIn = (tableId: string, playerId: string, playerName: string, amount: number, paymentMethod: PaymentMethod) => {
     dispatch({ type: 'ADD_BUYIN', payload: { tableId, playerId, playerName, amount, paymentMethod } });
   };
 
   const addCashOut = (tableId: string, playerId: string, playerName: string, chipValue: number) => {
     dispatch({ type: 'ADD_CASHOUT', payload: { tableId, playerId, playerName, chipValue } });
   };
 
   const getTableBuyInsTotal = (tableId: string): number => {
     return state.buyIns
       .filter((b) => b.tableId === tableId)
       .reduce((sum, b) => sum + b.amount, 0);
   };
 
   const getActiveSessions = (tableId: string): ActiveSession[] => {
     const tableBuyIns = state.buyIns.filter((b) => b.tableId === tableId);
     const tableCashOuts = state.cashOuts.filter((c) => c.tableId === tableId);
 
     // Group by player
     const playerMap = new Map<string, ActiveSession>();
 
     for (const buyIn of tableBuyIns) {
       const existing = playerMap.get(buyIn.playerId);
       if (existing) {
         existing.totalBuyIn += buyIn.amount;
         existing.buyInCount += 1;
       } else {
         playerMap.set(buyIn.playerId, {
           playerId: buyIn.playerId,
           playerName: buyIn.playerName,
           tableId,
           totalBuyIn: buyIn.amount,
           buyInCount: 1,
           startTime: buyIn.timestamp,
         });
       }
     }
 
     // Subtract cash-outs
     for (const cashOut of tableCashOuts) {
       const existing = playerMap.get(cashOut.playerId);
       if (existing) {
         existing.totalBuyIn -= cashOut.totalBuyIn;
         if (existing.totalBuyIn <= 0) {
           playerMap.delete(cashOut.playerId);
         }
       }
     }
 
     return Array.from(playerMap.values());
   };
 
   const getPlayerSessionTotal = (tableId: string, playerId: string): number => {
     const buyIns = state.buyIns
       .filter((b) => b.tableId === tableId && b.playerId === playerId)
       .reduce((sum, b) => sum + b.amount, 0);
     
     const cashOuts = state.cashOuts
       .filter((c) => c.tableId === tableId && c.playerId === playerId)
       .reduce((sum, c) => sum + c.totalBuyIn, 0);
 
     return buyIns - cashOuts;
   };
 
   const getTodaySummary = () => {
     const today = new Date().toDateString();
     
     const todayBuyIns = state.buyIns
       .filter((b) => new Date(b.timestamp).toDateString() === today)
       .reduce((sum, b) => sum + b.amount, 0);
 
     const todayCashOuts = state.cashOuts
       .filter((c) => new Date(c.timestamp).toDateString() === today)
       .reduce((sum, c) => sum + c.chipValue, 0);
 
     return {
       totalIn: todayBuyIns,
       totalOut: todayCashOuts,
       balance: todayBuyIns - todayCashOuts,
     };
   };
 
   return (
     <PokerContext.Provider
       value={{
         state,
         addPlayer,
         addTable,
         toggleTable,
         addBuyIn,
         addCashOut,
         getTableBuyInsTotal,
         getActiveSessions,
         getPlayerSessionTotal,
         getTodaySummary,
       }}
     >
       {children}
     </PokerContext.Provider>
   );
 }
 
 export function usePoker() {
   const context = useContext(PokerContext);
   if (context === undefined) {
     throw new Error('usePoker must be used within a PokerProvider');
   }
   return context;
 }