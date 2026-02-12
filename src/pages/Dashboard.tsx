import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCashSession } from '@/hooks/useCashSession';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Header } from '@/components/poker/Header';
import { BottomNav } from '@/components/poker/BottomNav';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  LayoutGrid,
  Loader2,
  DollarSign,
  Coins,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export default function Dashboard() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { session, sessions, isLoading: loadingSession } = useCashSession(today, selectedSessionId);
  const dashboard = useDashboardData(session?.id);
  const navigate = useNavigate();

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpis = [
    {
      title: 'Lucro Bruto',
      value: dashboard.grossProfit,
      icon: TrendingUp,
      accent: 'text-gold',
      bg: 'bg-gold/10',
      border: 'border-gold/20',
    },
    {
      title: 'Total Buy-ins',
      value: dashboard.totalBuyIns,
      icon: ArrowDownCircle,
      accent: 'text-success',
      bg: 'bg-success/10',
      border: 'border-success/20',
    },
    {
      title: 'Total Cash-outs',
      value: dashboard.totalCashOuts,
      icon: ArrowUpCircle,
      accent: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/20',
    },
    {
      title: 'Saldo Pendente',
      value: dashboard.pendingCredits,
      icon: AlertTriangle,
      accent: 'text-destructive',
      bg: 'bg-destructive/10',
      border: 'border-destructive/20',
    },
  ];

  const pieChartConfig = Object.fromEntries(
    dashboard.paymentDistribution.map((d) => [
      d.method,
      { label: d.label, color: d.color },
    ])
  );

  const barChartConfig = {
    rake: { label: 'Rake', color: 'hsl(var(--gold))' },
  };

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <main className="container py-6 space-y-6">
        {/* Session Selector */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            {sessions.length > 1 && (
              <Select value={session?.id || ''} onValueChange={setSelectedSessionId}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Selecione um caixa" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.is_open ? '🟢' : '🔴'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {session && sessions.length <= 1 && (
              <div>
                <h2 className="text-lg font-semibold">{session.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {session.is_open ? '🟢 Caixa Aberto' : '🔴 Caixa Fechado'}
                </p>
              </div>
            )}
            {!session && (
              <p className="text-sm text-muted-foreground">Nenhum caixa hoje</p>
            )}
          </div>
          <Button
            onClick={() => navigate('/mesas')}
            className="bg-gold text-gold-foreground hover:bg-gold/90 font-semibold shadow-lg"
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Ir para Mesas
          </Button>
        </div>

        {/* KPI Cards */}
        {dashboard.isLoading ? (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <Card
                key={kpi.title}
                className={`card-glow border ${kpi.border} relative overflow-hidden`}
              >
                <CardContent className="p-4">
                  <div className={`inline-flex p-2 rounded-lg ${kpi.bg} mb-2`}>
                    <kpi.icon className={`h-5 w-5 ${kpi.accent}`} />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {kpi.title}
                  </p>
                  <p className={`text-xl font-mono font-bold ${kpi.accent} mt-1`}>
                    {formatCurrency(kpi.value)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Secondary KPIs */}
        {!dashboard.isLoading && (
          <div className="grid gap-4 grid-cols-2">
            <Card className="card-glow border border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="inline-flex p-2 rounded-lg bg-gold/10">
                  <Coins className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rake Total</p>
                  <p className="text-lg font-mono font-bold text-gold">
                    {formatCurrency(dashboard.totalRake)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="card-glow border border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="inline-flex p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Caixinhas</p>
                  <p className="text-lg font-mono font-bold text-primary">
                    {formatCurrency(dashboard.totalTips)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        {!dashboard.isLoading && session && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Payment Distribution Pie Chart */}
            <Card className="card-glow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Métodos de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard.paymentDistribution.length > 0 ? (
                  <ChartContainer config={pieChartConfig} className="h-[250px] w-full">
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) =>
                              formatCurrency(Number(value))
                            }
                          />
                        }
                      />
                      <Pie
                        data={dashboard.paymentDistribution}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        strokeWidth={2}
                        stroke="hsl(var(--background))"
                      >
                        {dashboard.paymentDistribution.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                    Sem dados de pagamento
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rake by Table Bar Chart */}
            <Card className="card-glow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Rake por Mesa
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard.rakeByTable.length > 0 ? (
                  <ChartContainer config={barChartConfig} className="h-[250px] w-full">
                    <BarChart data={dashboard.rakeByTable}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="table"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `R$${v}`}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) =>
                              formatCurrency(Number(value))
                            }
                          />
                        }
                      />
                      <Bar
                        dataKey="rake"
                        fill="hsl(var(--gold))"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                    Sem dados de rake
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
