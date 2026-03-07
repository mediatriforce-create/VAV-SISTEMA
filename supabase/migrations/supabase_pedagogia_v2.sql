-- =========================================================================
-- VAV CENTRAL - MÓDULO PEDAGOGIA V2 (REFAÇÃO)
-- Kanban + Atividades Simples + Arquivos de Aula
-- =========================================================================

-- 1. KANBAN DE PEDAGOGIA
CREATE TABLE IF NOT EXISTS public.ped_kanban_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    column_status TEXT NOT NULL DEFAULT 'backlog' CHECK (column_status IN ('backlog', 'planejado', 'andamento', 'concluido')),
    title TEXT NOT NULL,
    card_type TEXT,
    description TEXT,
    due_date DATE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vínculo Kanban ↔ Turmas (N:N)
CREATE TABLE IF NOT EXISTS public.ped_kanban_card_classes (
    card_id UUID REFERENCES public.ped_kanban_cards(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, class_id)
);

-- 2. ATIVIDADES DO DIA (registro simples)
CREATE TABLE IF NOT EXISTS public.ped_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PASTAS DE ARQUIVOS
CREATE TABLE IF NOT EXISTS public.ped_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    school_year TEXT DEFAULT 'multi',
    folder_type TEXT DEFAULT 'materiais',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ARQUIVOS
CREATE TABLE IF NOT EXISTS public.ped_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_id UUID REFERENCES public.ped_folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    drive_file_id TEXT,
    file_type TEXT DEFAULT 'doc',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. VÍNCULOS N:N

-- Atividade ↔ Arquivos
CREATE TABLE IF NOT EXISTS public.ped_activity_files (
    activity_id UUID REFERENCES public.ped_activities(id) ON DELETE CASCADE,
    file_id UUID REFERENCES public.ped_files(id) ON DELETE CASCADE,
    PRIMARY KEY (activity_id, file_id)
);

-- Kanban ↔ Arquivos
CREATE TABLE IF NOT EXISTS public.ped_kanban_card_files (
    card_id UUID REFERENCES public.ped_kanban_cards(id) ON DELETE CASCADE,
    file_id UUID REFERENCES public.ped_files(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, file_id)
);

-- TRIGGER para updated_at no Kanban
CREATE OR REPLACE FUNCTION update_ped_kanban_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ped_kanban_updated_at ON public.ped_kanban_cards;
CREATE TRIGGER trigger_ped_kanban_updated_at
BEFORE UPDATE ON public.ped_kanban_cards
FOR EACH ROW
EXECUTE FUNCTION update_ped_kanban_updated_at();

-- =========================================================================
-- RLS DESABILITADO (dev)
-- =========================================================================
ALTER TABLE public.ped_kanban_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ped_kanban_card_classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ped_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ped_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ped_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ped_activity_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ped_kanban_card_files DISABLE ROW LEVEL SECURITY;
