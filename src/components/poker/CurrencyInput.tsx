import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value: number | '';
  onChange: (value: number | '') => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  max?: number;
}

const MAX_VALUE = 1_000_000;

export function CurrencyInput({ 
  value, 
  onChange, 
  placeholder = 'R$ 0', 
  className,
  autoFocus,
  max = MAX_VALUE
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState(
    value ? formatForDisplay(Number(value)) : ''
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    
    if (!raw) {
      setDisplayValue('');
      onChange('');
      return;
    }

    const numericValue = parseInt(raw, 10);
    
    if (numericValue > max) {
      return;
    }
    
    setDisplayValue(formatForDisplay(numericValue));
    onChange(numericValue);
  }, [onChange, max]);

  const handleFocus = useCallback(() => {
    // Keep formatted value on focus
  }, []);

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={displayValue ? `R$ ${displayValue}` : ''}
      onChange={handleChange}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={cn(
        'touch-target text-2xl font-mono font-bold text-center bg-input border-border',
        className
      )}
      autoFocus={autoFocus}
    />
  );
}

function formatForDisplay(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}
