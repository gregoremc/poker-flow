import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Building2, UserPlus, Plus, Loader2, Shield } from 'lucide-react';
import { Header } from '@/components/poker/Header';

interface Org {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

interface UserEntry {
  id: string;
  email: string;
  display_name: string;
  organization_name: string;
  organization_id: string;
  created_at: string;
}

export default function MasterAdmin() {
  const navigate = useNavigate();
  const { isAdmin, userRole } = useOrganization();
  const { session } = useAuth();

  const [orgs, setOrgs] = useState<Org[]>([]);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // New org form
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);

  // New user form
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userDisplayName, setUserDisplayName] = useState('');
  const [userOrgId, setUserOrgId] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  const callAdmin = async (action: string, body?: object) => {
    const options: RequestInit & { headers: Record<string, string> } = {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-manager?action=${action}`,
      options
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [orgsData, usersData] = await Promise.all([
        callAdmin('list-orgs'),
        callAdmin('list-users'),
      ]);
      setOrgs(orgsData);
      setUsers(usersData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin && session) loadData();
  }, [isAdmin, session]);

  if (userRole !== undefined && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground mb-4">Esta página é exclusiva para administradores.</p>
            <Button onClick={() => navigate('/')}>Voltar ao Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateOrg = async () => {
    if (!orgName.trim() || !orgSlug.trim()) {
      toast({ title: 'Preencha nome e slug', variant: 'destructive' });
      return;
    }
    setCreatingOrg(true);
    try {
      await callAdmin('create-org', { name: orgName.trim(), slug: orgSlug.trim().toLowerCase() });
      toast({ title: 'Organização criada!' });
      setOrgName('');
      setOrgSlug('');
      loadData();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
    setCreatingOrg(false);
  };

  const handleCreateUser = async () => {
    if (!userEmail.trim() || !userPassword.trim() || !userOrgId) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    setCreatingUser(true);
    try {
      await callAdmin('create-user', {
        email: userEmail.trim(),
        password: userPassword,
        organization_id: userOrgId,
        display_name: userDisplayName.trim() || undefined,
      });
      toast({ title: 'Usuário criado!' });
      setUserEmail('');
      setUserPassword('');
      setUserDisplayName('');
      setUserOrgId('');
      loadData();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
    setCreatingUser(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Painel Master
            </h1>
            <p className="text-sm text-muted-foreground">Gerenciamento de Organizações e Usuários</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Create Org */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5" /> Nova Organização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Nome do Clube</Label>
                  <Input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Poker Club SP" />
                </div>
                <div className="space-y-1">
                  <Label>Slug (identificador único)</Label>
                  <Input value={orgSlug} onChange={e => setOrgSlug(e.target.value)} placeholder="poker-club-sp" />
                </div>
                <Button onClick={handleCreateOrg} disabled={creatingOrg} className="w-full">
                  {creatingOrg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Criar Organização
                </Button>
              </CardContent>
            </Card>

            {/* Create User */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserPlus className="h-5 w-5" /> Novo Usuário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>E-mail</Label>
                  <Input type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="usuario@email.com" />
                </div>
                <div className="space-y-1">
                  <Label>Senha</Label>
                  <Input type="password" value={userPassword} onChange={e => setUserPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="space-y-1">
                  <Label>Nome de exibição</Label>
                  <Input value={userDisplayName} onChange={e => setUserDisplayName(e.target.value)} placeholder="João Silva" />
                </div>
                <div className="space-y-1">
                  <Label>Organização</Label>
                  <Select value={userOrgId} onValueChange={setUserOrgId}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {orgs.map(org => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateUser} disabled={creatingUser} className="w-full">
                  {creatingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Criar Usuário
                </Button>
              </CardContent>
            </Card>

            {/* Orgs List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Organizações ({orgs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {orgs.map(org => (
                    <div key={org.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-xs text-muted-foreground">/{org.slug}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(org.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usuários ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{u.display_name || u.email}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded">
                        {u.organization_name || 'Sem org'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
