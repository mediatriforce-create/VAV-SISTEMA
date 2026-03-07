-- =========================================================================
-- VAV CENTRAL - MÓDULO PEDAGOGIA (FASE 2)
-- Planejamento de Aulas, Banco de Atividades e Base BNCC
-- =========================================================================

-- 1. HABILIDADES BNCC (Catálogo Base)
-- Permite que a escola cadastre as diretrizes da Base Nacional Comum Curricular.
CREATE TABLE IF NOT EXISTS public.bncc_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE, -- Ex: EF15LP01
    description TEXT NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    year_group TEXT NOT NULL, -- Ex: "1º ao 5º Ano" ou "3º Ano"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BANCO DE ATIVIDADES (Repositório)
-- Arquivos, PDFs, Links e documentações que os professores podem reaproveitar.
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    activity_type TEXT NOT NULL DEFAULT 'Documento', -- PDF, Link, Quiz, Texto, etc.
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false, -- Se true, visível para outros professores
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativos (Arquivos reais) atrelados à Atividade
CREATE TABLE IF NOT EXISTS public.activity_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    drive_file_id TEXT, -- Caso venha do Google Drive API
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PLANO DE AULA (Planejamento)
-- Registro do professor sobre o que será lecionado em datas futuras.
CREATE TABLE IF NOT EXISTS public.lesson_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_date DATE NOT NULL,
    theme TEXT NOT NULL,
    objectives TEXT,
    methodology TEXT,
    status TEXT DEFAULT 'Rascunho' CHECK (status IN ('Rascunho', 'Publicado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TRIGGER PARA UPDATED_AT DO PLANO DE AULA
CREATE OR REPLACE FUNCTION update_lesson_plan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lesson_plan_updated_at ON public.lesson_plans;
CREATE TRIGGER trigger_update_lesson_plan_updated_at
BEFORE UPDATE ON public.lesson_plans
FOR EACH ROW
EXECUTE FUNCTION update_lesson_plan_updated_at();

-- 4. VINCULAÇÕES (N:N) - PLANO DE AULA
-- Vinculando BNCC ao Plano
CREATE TABLE IF NOT EXISTS public.plan_skills (
    plan_id UUID REFERENCES public.lesson_plans(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES public.bncc_skills(id) ON DELETE CASCADE,
    PRIMARY KEY (plan_id, skill_id)
);

-- Vinculando Atividades do Banco ao Plano
CREATE TABLE IF NOT EXISTS public.plan_activities (
    plan_id UUID REFERENCES public.lesson_plans(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
    PRIMARY KEY (plan_id, activity_id)
);


-- =========================================================================
-- ROW LEVEL SECURITY (TEMPORARIAMENTE DESATIVADA PARA FACILIDADE DE DEV)
-- Baseado na política atual de "tudo liberado" (Fase 1), manteremos a mesma
-- linha até fecharmos o sistema de perfis.
-- =========================================================================

-- Desabilitar RLS estrito (descomente as linhas de Policy quando for para produção)
ALTER TABLE public.bncc_skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_activities DISABLE ROW LEVEL SECURITY;

-- Exemplo futuro de RLS:
-- ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Professores gerenciam seus próprios planos" ON public.lesson_plans FOR ALL USING (teacher_id = auth.uid() OR is_coordination());
