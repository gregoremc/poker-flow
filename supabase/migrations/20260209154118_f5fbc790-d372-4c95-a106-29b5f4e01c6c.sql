
-- Add CRM fields to players table
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create player_attachments table
CREATE TABLE IF NOT EXISTS public.player_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.player_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON public.player_attachments FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for player attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('player-attachments', 'player-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read player attachments" ON storage.objects FOR SELECT USING (bucket_id = 'player-attachments');
CREATE POLICY "Public insert player attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'player-attachments');
CREATE POLICY "Public update player attachments" ON storage.objects FOR UPDATE USING (bucket_id = 'player-attachments');
CREATE POLICY "Public delete player attachments" ON storage.objects FOR DELETE USING (bucket_id = 'player-attachments');
