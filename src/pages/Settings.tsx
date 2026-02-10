import { useState, useRef } from 'react';
import { useClubSettings } from '@/hooks/useClubSettings';
import { Header } from '@/components/poker/Header';
import { BottomNav } from '@/components/poker/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Save, Loader2, Spade } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { settings, isLoading, updateSettings, isUpdating, uploadLogo } = useClubSettings();
  const [clubName, setClubName] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when settings load
  useState(() => {
    if (settings) {
      setClubName(settings.club_name);
      
    }
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    setUploading(true);
    try {
      const logoUrl = await uploadLogo(file);
      if (logoUrl) {
        updateSettings({ logo_url: logoUrl });
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

    updateSettings({ 
      club_name: clubName.trim(),
    });
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

        {/* Club Identity */}
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
                <div className="h-20 w-20 rounded-lg bg-input border border-border flex items-center justify-center overflow-hidden">
                  {settings?.logo_url ? (
                    <img 
                      src={settings.logo_url} 
                      alt="Logo" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Spade className="h-8 w-8 text-muted-foreground" />
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
                    PNG, JPG ou SVG. Máximo 2MB.
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

        {/* Save Button */}
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
