import { formatDate } from '@/lib/format';
import { useClubSettings } from '@/hooks/useClubSettings';
import { useAuth } from '@/hooks/useAuth';
import { Spade, Settings, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeSelector } from './ThemeSelector';
import { toast } from '@/hooks/use-toast';

export function Header() {
  const { settings } = useClubSettings();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const today = formatDate(new Date());

  const handleLogout = async () => {
    await signOut();
    toast({ title: 'Sessão encerrada' });
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border safe-area-top">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {settings?.logo_url ? (
                <img 
                  src={settings.logo_url} 
                  alt="Logo" 
                  className="h-10 w-10 object-contain"
                />
              ) : (
                <Spade className="h-10 w-10 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">{settings?.club_name || 'Poker Club'}</h1>
              <p className="text-sm text-muted-foreground">Gestão Financeira</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground hidden sm:block">{today}</p>
            <ThemeSelector />
            <Link to="/configuracoes">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
