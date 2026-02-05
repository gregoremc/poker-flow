import { useState, useMemo } from 'react';
import { usePlayers } from '@/hooks/usePlayers';
import { useTables } from '@/hooks/useTables';
import { useTransactions } from '@/hooks/useTransactions';
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
import { Check, ChevronsUpDown, Plus, Banknote, CreditCard, Smartphone, Gift, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

interface BuyInModalProps {
  open: boolean;
  onClose: () => void;
  tableId: string;
}

const QUICK_AMOUNTS = [50, 100, 200, 300, 500];

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode; warning?: string }[] = [
  { value: 'pix', label: 'PIX', icon: <Smartphone className="h-4 w-4" /> },
  { value: 'cash', label: 'Dinheiro', icon: <Banknote className="h-4 w-4" /> },
  { value: 'debit', label: 'Débito', icon: <CreditCard className="h-4 w-4" /> },
  { value: 'credit', label: 'Crédito', icon: <CreditCard className="h-4 w-4" /> },
  { value: 'credit_fiado', label: 'Fiado', icon: <AlertCircle className="h-4 w-4" />, warning: 'Contas a Receber' },
  { value: 'bonus', label: 'Bônus', icon: <Gift className="h-4 w-4" />, warning: 'Não conta no caixa real' },
];

export function BuyInModal({ open, onClose, tableId }: BuyInModalProps) {
  const { players, addPlayer } = usePlayers();
  const { tables } = useTables();
  const { addBuyIn } = useTransactions();
  
  const [playerSearch, setPlayerSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string; credit_balance?: number; credit_limit?: number } | null>(null);
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [playerPopoverOpen, setPlayerPopoverOpen] = useState(false);

  const tableName = tables.find((t) => t.id === tableId)?.name || 'Mesa';

  const filteredPlayers = useMemo(() => {
    if (!playerSearch) return players;
    const search = playerSearch.toLowerCase();
    return players.filter((p) => p.name.toLowerCase().includes(search));
  }, [players, playerSearch]);

  const canCreateNewPlayer = playerSearch.length >= 2 && !filteredPlayers.some(
    (p) => p.name.toLowerCase() === playerSearch.toLowerCase()
  );

  // Check credit limit for fiado
  const creditLimitExceeded = paymentMethod === 'credit_fiado' && selectedPlayer && amount && 
    ((selectedPlayer.credit_balance || 0) + Number(amount)) > (selectedPlayer.credit_limit || 500);

  const handleSelectPlayer = (player: { id: string; name: string; credit_balance?: number; credit_limit?: number }) => {
    setSelectedPlayer(player);
    setPlayerPopoverOpen(false);
  };

  const handleCreatePlayer = async () => {
    if (playerSearch.length >= 2) {
      try {
        const newPlayer = await addPlayer(playerSearch);
        setSelectedPlayer({ id: newPlayer.id, name: newPlayer.name, credit_balance: 0, credit_limit: 500 });
        setPlayerPopoverOpen(false);
        setPlayerSearch('');
      } catch (error) {
        console.error('Error creating player:', error);
      }
    }
  };

  const handleSubmit = () => {
    if (!selectedPlayer || !amount || amount <= 0) return;
    
    if (creditLimitExceeded) {
      toast.error('Limite de crédito excedido!');
      return;
    }
    
    addBuyIn({
      table_id: tableId,
      player_id: selectedPlayer.id,
      amount: Number(amount),
      payment_method: paymentMethod,
      is_bonus: paymentMethod === 'bonus',
    });
    handleClose();
  };

  const handleClose = () => {
    setPlayerSearch('');
    setSelectedPlayer(null);
    setAmount('');
    setPaymentMethod('pix');
    onClose();
  };

  const isValid = selectedPlayer && amount && amount > 0 && !creditLimitExceeded;

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
                          <span className="flex-1">{player.name}</span>
                          {player.credit_balance > 0 && (
                            <span className="text-xs text-destructive">
                              Fiado: {formatCurrency(player.credit_balance)}
                            </span>
                          )}
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
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <Button
                  key={method.value}
                  type="button"
                  variant={paymentMethod === method.value ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod(method.value)}
                  className={cn(
                    'touch-target flex flex-col items-center gap-1 h-auto py-2',
                    paymentMethod === method.value 
                      ? method.value === 'credit_fiado' ? 'bg-orange-600' : method.value === 'bonus' ? 'bg-purple-600' : 'bg-primary' 
                      : 'bg-input border-border hover:bg-accent'
                  )}
                >
                  {method.icon}
                  <span className="text-xs">{method.label}</span>
                </Button>
              ))}
            </div>
            {PAYMENT_METHODS.find(m => m.value === paymentMethod)?.warning && (
              <p className="text-xs text-orange-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {PAYMENT_METHODS.find(m => m.value === paymentMethod)?.warning}
              </p>
            )}
            {creditLimitExceeded && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Limite de crédito excedido! Limite: {formatCurrency(selectedPlayer?.credit_limit || 500)}
              </p>
            )}
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
