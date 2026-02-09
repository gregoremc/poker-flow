import { CashSession } from '@/types/poker';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Lock, Play } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SessionSelectorProps {
  sessions: CashSession[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (session: CashSession) => void;
}

export function SessionSelector({
  sessions,
  selectedSessionId,
  onSelectSession,
  onDeleteSession,
}: SessionSelectorProps) {
  if (sessions.length === 0) return null;

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  // If only one session, show as a simple badge
  if (sessions.length === 1) {
    const session = sessions[0];
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border">
        <div className="flex items-center gap-2 flex-1">
          {session.is_open ? (
            <Play className="h-4 w-4 text-success" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium">{session.name}</span>
          <Badge variant={session.is_open ? 'default' : 'secondary'} className="text-xs">
            {session.is_open ? 'Aberto' : 'Fechado'}
          </Badge>
          {session.responsible && (
            <span className="text-xs text-muted-foreground">• {session.responsible}</span>
          )}
          <span className="text-xs text-muted-foreground">
            {format(new Date(session.created_at), "HH:mm", { locale: ptBR })}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDeleteSession(session)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Multiple sessions - show dropdown
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border">
      <span className="text-sm text-muted-foreground whitespace-nowrap">Caixa:</span>
      <Select value={selectedSessionId || ''} onValueChange={onSelectSession}>
        <SelectTrigger className="flex-1 bg-input border-border">
          <SelectValue placeholder="Selecione um caixa" />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          {sessions.map(session => (
            <SelectItem key={session.id} value={session.id}>
              <div className="flex items-center gap-2">
                {session.is_open ? (
                  <Play className="h-3 w-3 text-success" />
                ) : (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
                <span>{session.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({format(new Date(session.created_at), "HH:mm")})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedSession && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDeleteSession(selectedSession)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
