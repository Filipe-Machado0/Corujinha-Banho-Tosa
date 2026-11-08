-- ==============================================================================
-- CORUJINHA BANHO & TOSA - SCHEMA SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/fmbrycxpmpszeyizkuub/sql/new
-- ==============================================================================

-- 1. Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  pet_name TEXT NOT NULL,
  pet_breed TEXT,
  pet_size TEXT,
  service TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT DEFAULT 'confirmado',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- 2. Tabela de Horários Bloqueados pela Loja
CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- 3. Ativar RLS (Row Level Security)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

-- 4. Criar Políticas de Acesso Público (Anon / Publishable Key)
DROP POLICY IF EXISTS "Public appointments select" ON public.appointments;
CREATE POLICY "Public appointments select" ON public.appointments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public appointments insert" ON public.appointments;
CREATE POLICY "Public appointments insert" ON public.appointments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public appointments update" ON public.appointments;
CREATE POLICY "Public appointments update" ON public.appointments FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public appointments delete" ON public.appointments;
CREATE POLICY "Public appointments delete" ON public.appointments FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public blocked_slots select" ON public.blocked_slots;
CREATE POLICY "Public blocked_slots select" ON public.blocked_slots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public blocked_slots insert" ON public.blocked_slots;
CREATE POLICY "Public blocked_slots insert" ON public.blocked_slots FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public blocked_slots update" ON public.blocked_slots;
CREATE POLICY "Public blocked_slots update" ON public.blocked_slots FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public blocked_slots delete" ON public.blocked_slots;
CREATE POLICY "Public blocked_slots delete" ON public.blocked_slots FOR DELETE USING (true);

-- 5. Habilitar Notificações Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_slots;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;
