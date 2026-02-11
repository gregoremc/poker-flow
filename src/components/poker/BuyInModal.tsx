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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
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
import { CurrencyInput } from '@/components/poker/CurrencyInput';
import { Check, ChevronsUpDown, Plus, Banknote, CreditCard, Smartphone, Gift, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';

interface BuyInModalProps {
  open: boolean;
  onClose: () => void;
  tableId: string;
  sessionId?: string;
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

export function BuyInModal({ open, onClose, tableId, sessionId }: BuyInModalProps) {
  const { players, addPlayer } = usePlayers();
  const { tables } = useTables();
  const { addBuyIn } = useTransactions();
  
  const [playerSearch, setPlayerSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string; credit_balance?: number } | null>(null);
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [playerPopoverOpen, setPlayerPopoverOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tableName = tables.find((t) => t.id === tableId)?.name || 'Mesa';

  const filteredPlayers = useMemo(() => {
    if (!playerSearch) return players;
    const search = playerSearch.toLowerCase();
    return players.filter((p) => p.name.toLowerCase().includes(search));
  }, [players, playerSearch]);

  const canCreateNewPlayer = playerSearch.length >= 2 && !filteredPlayers.some(
    (p) => p.name.toLowerCase() === playerSearch.toLowerCase()
  );

  const handleSelectPlayer = (player: { id: string; name: string; credit_balance?: number }) => {
    setSelectedPlayer(player);
    setPlayerPopoverOpen(false);
  };

  const handleCreatePlayer = async () => {
    if (playerSearch.length >= 2) {
      try {
        const newPlayer = await addPlayer({ name: playerSearch });
        setSelectedPlayer({ id: newPlayer.id, name: newPlayer.name, credit_balance: 0 });
        setPlayerPopoverOpen(false);
        setPlayerSearch('');
      } catch (error) {
        console.error('Error creating player:', error);
      }
    }
  };

  const handleSubmit = () => {
    if (!selectedPlayer) {
      setErrorMessage('Selecione um jogador para continuar.');
      return;
    }
    if (!amount || amount <= 0) {
      setErrorMessage('Informe um valor válido maior que zero.');
      return;
    }
    if (amount > 1_000_000) {
      setErrorMessage('O valor máximo permitido é R$ 1.000.000.');
      return;
    }

    try {
      addBuyIn({
        table_id: tableId,
        player_id: selectedPlayer.id,
        amount: Number(amount),
        payment_method: paymentMethod,
        is_bonus: paymentMethod === 'bonus',
        session_id: sessionId,
      });
      handleClose();
    } catch (error: any) {
      setErrorMessage(error?.message || 'Erro desconhecido ao processar o buy-in. Tente novamente.');
    }
  };

  const handleClose = () => {
    setPlayerSearch('');
    setSelectedPlayer(null);
    setAmount('');
    setPaymentMethod('pix');
    setErrorMessage(null);
    onClose();
  };

  const isValid = selectedPlayer && amount && amount > 0;

  return (
    <>
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
                <PopoverContent className="w-full p-0 bg-popover border-border z-50" align="start" sideOffset={4}>
                  <Command className="bg-popover" shouldFilter={false}>
                    <CommandInput 
                      placeholder="Digite o nome..." 
                      value={playerSearch}
                      onValueChange={setPlayerSearch}
                      className="touch-target"
                    />
                    <div className="max-h-[200px] overflow-y-auto overscroll-contain" onWheel={(e) => e.stopPropagation()}>
                    <CommandList className="max-h-none overflow-visible">
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
                    </div>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Amount with Currency Mask */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Valor</Label>
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                autoFocus={false}
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
            {amount ? <span className="ml-2 opacity-80">{formatCurrency(Number(amount))}</span> : null}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <AlertDialog open={!!errorMessage} onOpenChange={() => setErrorMessage(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Erro no Buy-in
            </AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorMessage(null)}>
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
