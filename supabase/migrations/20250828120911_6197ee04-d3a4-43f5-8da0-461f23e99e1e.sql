-- Update parties table for ERP compatibility
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS party_type TEXT CHECK (party_type IN ('CLIENTE', 'FORNECEDOR'));
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS legal_name TEXT;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS trade_name TEXT;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS state_registration TEXT;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS municipal_registration TEXT;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS address_number TEXT;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS address_neighborhood TEXT;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS address_state TEXT;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS address_zipcode TEXT;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_parties_updated_at
  BEFORE UPDATE ON public.parties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing name field to be legal_name if legal_name is null
UPDATE public.parties SET legal_name = name WHERE legal_name IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_parties_party_type ON public.parties(party_type);
CREATE INDEX IF NOT EXISTS idx_parties_tax_id ON public.parties(tax_id);
CREATE INDEX IF NOT EXISTS idx_parties_tenant_id ON public.parties(tenant_id);