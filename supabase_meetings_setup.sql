-- Criação da tabela de reuniões (meetings) e configuração do Row Level Security (RLS)

-- 1. Cria a tabela 'meetings'
CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  meet_link text,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- 2. Habilita o RLS (Row Level Security) na tabela
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- 3. Cria as Políticas de Segurança
-- Usuários podem visualizar e administrar apenas as reuniões que eles mesmos criaram
CREATE POLICY "Users can view their own meetings"
  ON public.meetings
  FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own meetings"
  ON public.meetings
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own meetings"
  ON public.meetings
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own meetings"
  ON public.meetings
  FOR DELETE
  USING (auth.uid() = created_by);

-- 4. Cria um índice para consultas comuns (Filtrar por usuário e data)
CREATE INDEX idx_meetings_created_by_date ON public.meetings (created_by, date);
