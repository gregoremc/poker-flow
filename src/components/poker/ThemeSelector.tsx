import { useTheme, THEME_OPTIONS } from '@/hooks/useTheme';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Palette } from 'lucide-react';

export function ThemeSelector() {
  const { theme, mode, setTheme, toggleMode } = useTheme();

  const current = THEME_OPTIONS.find((t) => t.value === theme);

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Palette className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover border-border min-w-[160px]">
          {THEME_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={theme === opt.value ? 'bg-accent text-accent-foreground' : ''}
            >
              <span className="mr-2">{opt.emoji}</span>
              {opt.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={toggleMode}>
            {mode === 'dark' ? (
              <>
                <Sun className="mr-2 h-4 w-4" /> Modo Claro
              </>
            ) : (
              <>
                <Moon className="mr-2 h-4 w-4" /> Modo Escuro
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
