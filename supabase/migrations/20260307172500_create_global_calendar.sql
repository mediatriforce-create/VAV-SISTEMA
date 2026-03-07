-- Create Global Calendar Table
CREATE TABLE IF NOT EXISTS public.global_calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    image_url TEXT,
    link_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.global_calendar_events ENABLE ROW LEVEL SECURITY;

-- Política de Leitura Pública (todos os usuarios logados)
CREATE POLICY "Qualquer pessoa pode ver os eventos globais"
ON public.global_calendar_events
FOR SELECT
TO authenticated
USING (true);

-- Criar funcão de auxilio pra checar liderança
CREATE OR REPLACE FUNCTION public.is_leadership_role(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = check_user_id;
    RETURN user_role IN ('Coordenadora ADM', 'Coordenação de Pedagogia', 'Direção', 'Presidência');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política de Inserção Restrita (Apenas lideres logados e associando event pra eles mesmos inicialmente)
CREATE POLICY "Líderes podem criar eventos do calendário"
ON public.global_calendar_events
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = created_by AND 
    public.is_leadership_role(auth.uid())
);

-- Politica de Exclusão Restrita
CREATE POLICY "Líderes podem deletar eventos"
ON public.global_calendar_events
FOR DELETE
TO authenticated
USING (
   public.is_leadership_role(auth.uid())
);

-- Politica de Update Restrita
CREATE POLICY "Lideres podem atualizar eventos"
ON public.global_calendar_events
FOR UPDATE
TO authenticated
USING (
   public.is_leadership_role(auth.uid())
);
