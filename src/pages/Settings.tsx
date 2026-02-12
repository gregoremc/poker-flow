import { useState, useRef, useEffect } from 'react';
import { useClubSettings } from '@/hooks/useClubSettings';
import { useOrganization } from '@/hooks/useOrganization';
import { Header } from '@/components/poker/Header';
import { BottomNav } from '@/components/poker/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Save, Loader2, Spade } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Settings() {
  const { settings, isLoading, updateSettings, isUpdating, uploadLogo } = useClubSettings();
  const { organization, organizationId } = useOrganization();
  const [clubName, setClubName] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const logoUrl = organization?.logo_url || settings?.logo_url;

  useEffect(() => {
    if (settings) {
      setClubName(settings.club_name);
    }
  }, [settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    setUploading(true);
    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('club-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast.error('Erro ao fazer upload da logo');
        console.error(uploadError);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('club-assets')
        .getPublicUrl(filePath);

      // Save to organizations table
      if (organizationId) {
        const { error } = await supabase
          .from('organizations')
          .update({ logo_url: publicUrl })
          .eq('id', organizationId);
        
        if (error) {
          console.error('Org update error:', error);
          // Fallback to club_settings
          updateSettings({ logo_url: publicUrl });
        } else {
          toast.success('Logo atualizada!');
        }
      } else {
        updateSettings({ logo_url: publicUrl });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!clubName.trim()) {
      toast.error('O nome do clube não pode estar vazio');
      return;
    }
    updateSettings({ club_name: clubName.trim() });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <main className="container py-6 space-y-6">
        <h2 className="text-2xl font-bold">Configurações</h2>

        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Spade className="h-5 w-5 text-primary" />
              Identidade do Clube
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-3">
              <Label>Logo do Clube</Label>
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 rounded-lg bg-input border border-border flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Spade className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-input border-border"
                  >
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {uploading ? 'Enviando...' : 'Upload Logo'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG ou SVG. Máximo 2MB. Exibida no cabeçalho e recibos.
                  </p>
                </div>
              </div>
            </div>

            {/* Club Name */}
            <div className="space-y-2">
              <Label>Nome do Clube</Label>
              <Input
                value={clubName || settings?.club_name || ''}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Ex: Poker Club Premium"
                className="bg-input border-border"
              />
              <p className="text-xs text-muted-foreground">
                Este nome aparecerá no cabeçalho e nos PDFs gerados.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={isUpdating}
          className="w-full touch-target bg-primary hover:bg-primary/90"
        >
          {isUpdating ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Save className="mr-2 h-5 w-5" />
          )}
          Salvar Configurações
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
