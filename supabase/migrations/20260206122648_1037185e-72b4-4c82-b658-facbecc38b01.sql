-- Drop existing foreign keys and recreate with ON DELETE CASCADE
ALTER TABLE public.buy_ins DROP CONSTRAINT IF EXISTS buy_ins_table_id_fkey;
ALTER TABLE public.buy_ins ADD CONSTRAINT buy_ins_table_id_fkey 
  FOREIGN KEY (table_id) REFERENCES public.tables(id) ON DELETE CASCADE;

ALTER TABLE public.cash_outs DROP CONSTRAINT IF EXISTS cash_outs_table_id_fkey;
ALTER TABLE public.cash_outs ADD CONSTRAINT cash_outs_table_id_fkey 
  FOREIGN KEY (table_id) REFERENCES public.tables(id) ON DELETE CASCADE;

ALTER TABLE public.rake_entries DROP CONSTRAINT IF EXISTS rake_entries_table_id_fkey;
ALTER TABLE public.rake_entries ADD CONSTRAINT rake_entries_table_id_fkey 
  FOREIGN KEY (table_id) REFERENCES public.tables(id) ON DELETE CASCADE;

-- Also cascade credit_records when buy_in is deleted
ALTER TABLE public.credit_records DROP CONSTRAINT IF EXISTS credit_records_buy_in_id_fkey;
ALTER TABLE public.credit_records ADD CONSTRAINT credit_records_buy_in_id_fkey 
  FOREIGN KEY (buy_in_id) REFERENCES public.buy_ins(id) ON DELETE CASCADE;