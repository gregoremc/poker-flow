import { useLocation, Link } from 'react-router-dom';
import { LayoutGrid, Wallet, Clock, Users, Percent, AlertCircle, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { path: '/', label: 'Mesas', icon: LayoutGrid },
  { path: '/caixa', label: 'Caixa', icon: Wallet },
  { path: '/jogadores', label: 'Jogadores', icon: UserCircle },
  { path: '/rake', label: 'Rake', icon: Percent },
  { path: '/receber', label: 'A Receber', icon: AlertCircle },
  { path: '/historico', label: 'Histórico', icon: Clock },
  { path: '/dealers', label: 'Dealers', icon: Users },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full min-w-[60px] touch-target transition-colors',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] mt-1 font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}