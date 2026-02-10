-- Add 'fichas' to the payment_method enum
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'fichas';