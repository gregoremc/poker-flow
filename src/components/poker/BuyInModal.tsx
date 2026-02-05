 import { useState, useMemo } from 'react';
 import { usePoker } from '@/contexts/PokerContext';
 import { PaymentMethod } from '@/types/poker';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
 } from '@/components/ui/command';
 import {
   Popover,
   PopoverContent,
   PopoverTrigger,
 } from '@/components/ui/popover';
 import { Check, ChevronsUpDown, Plus, Banknote, CreditCard, Smartphone } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { formatCurrency } from '@/lib/format';
 
 interface BuyInModalProps {
   open: boolean;
   onClose: () => void;
   tableId: string;
 }
 
 const QUICK_AMOUNTS = [50, 100, 200, 300, 500];
 
 const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
   { value: 'pix', label: 'PIX', icon: <Smartphone className="h-4 w-4" /> },
   { value: 'cash', label: 'Dinheiro', icon: <Banknote className="h-4 w-4" /> },
   { value: 'debit', label: 'Débito', icon: <CreditCard className="h-4 w-4" /> },
   { value: 'credit', label: 'Crédito', icon: <CreditCard className="h-4 w-4" /> },
 ];
 
 export function BuyInModal({ open, onClose, tableId }: BuyInModalProps) {
   const { state, addBuyIn, addPlayer } = usePoker();
   const [playerSearch, setPlayerSearch] = useState('');
   const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string } | null>(null);
   const [amount, setAmount] = useState<number | ''>('');
   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
   const [playerPopoverOpen, setPlayerPopoverOpen] = useState(false);
   const [isNewPlayer, setIsNewPlayer] = useState(false);
 
   const tableName = state.tables.find((t) => t.id === tableId)?.name || 'Mesa';
 
   const filteredPlayers = useMemo(() => {
     if (!playerSearch) return state.players;
     const search = playerSearch.toLowerCase();
     return state.players.filter((p) => p.name.toLowerCase().includes(search));
   }, [state.players, playerSearch]);
 
   const canCreateNewPlayer = playerSearch.length >= 2 && !filteredPlayers.some(
     (p) => p.name.toLowerCase() === playerSearch.toLowerCase()
   );
 
   const handleSelectPlayer = (player: { id: string; name: string }) => {
     setSelectedPlayer(player);
     setPlayerPopoverOpen(false);
     setIsNewPlayer(false);
   };
 
   const handleCreatePlayer = () => {
     if (playerSearch.length >= 2) {
       const newId = crypto.randomUUID();
       addPlayer(playerSearch);
       setSelectedPlayer({ id: newId, name: playerSearch });
       setPlayerPopoverOpen(false);
       setIsNewPlayer(true);
     }
   };
 
   const handleSubmit = () => {
     if (!selectedPlayer || !amount || amount <= 0) return;
     
     addBuyIn(tableId, selectedPlayer.id, selectedPlayer.name, amount, paymentMethod);
     handleClose();
   };
 
   const handleClose = () => {
     setPlayerSearch('');
     setSelectedPlayer(null);
     setAmount('');
     setPaymentMethod('pix');
     setIsNewPlayer(false);
     onClose();
   };
 
   const isValid = selectedPlayer && amount && amount > 0;
 
   return (
     <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
       <DialogContent className="modal-solid sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="text-xl font-bold flex items-center gap-2">
             <Plus className="h-5 w-5 text-primary" />
             Novo Buy-in - {tableName}
           </DialogTitle>
         </DialogHeader>
 
         <div className="space-y-6 py-4">
           {/* Player Selection */}
           <div className="space-y-2">
             <Label className="text-sm font-medium">Jogador</Label>
             <Popover open={playerPopoverOpen} onOpenChange={setPlayerPopoverOpen}>
               <PopoverTrigger asChild>
                 <Button
                   variant="outline"
                   role="combobox"
                   className="w-full justify-between touch-target bg-input border-border hover:bg-accent"
                 >
                   {selectedPlayer ? selectedPlayer.name : 'Buscar jogador...'}
                   <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-full p-0 bg-popover border-border" align="start">
                 <Command className="bg-popover">
                   <CommandInput 
                     placeholder="Digite o nome..." 
                     value={playerSearch}
                     onValueChange={setPlayerSearch}
                     className="touch-target"
                   />
                   <CommandList className="max-h-60">
                     <CommandEmpty>
                       {canCreateNewPlayer ? (
                         <Button
                           variant="ghost"
                           className="w-full justify-start"
                           onClick={handleCreatePlayer}
                         >
                           <Plus className="mr-2 h-4 w-4" />
                           Criar "{playerSearch}"
                         </Button>
                       ) : (
                         'Nenhum jogador encontrado.'
                       )}
                     </CommandEmpty>
                     <CommandGroup>
                       {filteredPlayers.map((player) => (
                         <CommandItem
                           key={player.id}
                           value={player.name}
                           onSelect={() => handleSelectPlayer(player)}
                           className="touch-target cursor-pointer"
                         >
                           <Check
                             className={cn(
                               'mr-2 h-4 w-4',
                               selectedPlayer?.id === player.id ? 'opacity-100' : 'opacity-0'
                             )}
                           />
                           {player.name}
                         </CommandItem>
                       ))}
                       {canCreateNewPlayer && filteredPlayers.length > 0 && (
                         <CommandItem
                           value={`create-${playerSearch}`}
                           onSelect={handleCreatePlayer}
                           className="touch-target cursor-pointer text-primary"
                         >
                           <Plus className="mr-2 h-4 w-4" />
                           Criar "{playerSearch}"
                         </CommandItem>
                       )}
                     </CommandGroup>
                   </CommandList>
                 </Command>
               </PopoverContent>
             </Popover>
           </div>
 
           {/* Amount */}
           <div className="space-y-2">
             <Label className="text-sm font-medium">Valor</Label>
             <Input
               type="number"
               placeholder="0"
               value={amount}
               onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
               className="touch-target text-2xl font-mono font-bold text-center bg-input border-border"
             />
             {/* Quick amount buttons */}
             <div className="flex flex-wrap gap-2">
               {QUICK_AMOUNTS.map((val) => (
                 <Button
                   key={val}
                   type="button"
                   variant="secondary"
                   size="sm"
                   onClick={() => setAmount(val)}
                   className={cn(
                     'flex-1 min-w-[60px]',
                     amount === val && 'ring-2 ring-primary'
                   )}
                 >
                   {formatCurrency(val)}
                 </Button>
               ))}
             </div>
           </div>
 
           {/* Payment Method */}
           <div className="space-y-2">
             <Label className="text-sm font-medium">Forma de Pagamento</Label>
             <div className="grid grid-cols-2 gap-2">
               {PAYMENT_METHODS.map((method) => (
                 <Button
                   key={method.value}
                   type="button"
                   variant={paymentMethod === method.value ? 'default' : 'outline'}
                   onClick={() => setPaymentMethod(method.value)}
                   className={cn(
                     'touch-target flex items-center gap-2',
                     paymentMethod === method.value 
                       ? 'bg-primary' 
                       : 'bg-input border-border hover:bg-accent'
                   )}
                 >
                   {method.icon}
                   {method.label}
                 </Button>
               ))}
             </div>
           </div>
         </div>
 
         {/* Submit */}
         <Button
           onClick={handleSubmit}
           disabled={!isValid}
           className="w-full touch-target text-lg font-semibold bg-primary hover:bg-primary/90"
         >
           <Plus className="mr-2 h-5 w-5" />
           Registrar Buy-in
           {amount && <span className="ml-2 opacity-80">{formatCurrency(Number(amount))}</span>}
         </Button>
       </DialogContent>
     </Dialog>
   );
 }