-- =========================================================================
-- VAV CENTRAL - APPROVAL SUBMISSIONS + TEMP STORAGE + ADMIN SECTOR
-- =========================================================================

-- 1. Adicionar 'administracao' ao CHECK de sector em demands
ALTER TABLE public.demands DROP CONSTRAINT IF EXISTS demands_sector_check;
ALTER TABLE public.demands ADD CONSTRAINT demands_sector_check
    CHECK (sector IN ('comunicacao', 'pedagogia', 'administracao'));

-- 2. Criar tabela de entregas temporárias (expurgo após aprovação)
CREATE TABLE IF NOT EXISTS public.approval_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Referência polimórfica: pode ser uma demand OU um ped_kanban_card
    demand_id UUID REFERENCES public.demands(id) ON DELETE CASCADE,
    ped_card_id UUID REFERENCES public.ped_kanban_cards(id) ON DELETE CASCADE,

    -- Quem fez a entrega
    submitted_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),

    -- Conteúdo da entrega
    justification_text TEXT,
    file_urls TEXT[] DEFAULT '{}',

    -- Constraint: deve ter pelo menos uma referência
    CONSTRAINT at_least_one_reference CHECK (demand_id IS NOT NULL OR ped_card_id IS NOT NULL)
);

-- 3. RLS para approval_submissions
ALTER TABLE public.approval_submissions ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode VER (coordenação precisa ver, responsável também)
DROP POLICY IF EXISTS "approval_submissions_select" ON public.approval_submissions;
CREATE POLICY "approval_submissions_select" ON public.approval_submissions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Qualquer autenticado pode INSERIR (responsável submete a entrega)
DROP POLICY IF EXISTS "approval_submissions_insert" ON public.approval_submissions;
CREATE POLICY "approval_submissions_insert" ON public.approval_submissions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Apenas Coord. Geral pode DELETAR (expurgo após aprovação)
DROP POLICY IF EXISTS "approval_submissions_delete" ON public.approval_submissions;
CREATE POLICY "approval_submissions_delete" ON public.approval_submissions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Coord. Geral', 'Presidente', 'Dir. Financeiro')
        )
    );

-- 4. Criar o bucket de storage para arquivos temporários
INSERT INTO storage.buckets (id, name, public)
VALUES ('temp_approvals', 'temp_approvals', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. Políticas de storage para o bucket temp_approvals
-- Qualquer autenticado pode fazer UPLOAD
DROP POLICY IF EXISTS "temp_approvals_upload" ON storage.objects;
CREATE POLICY "temp_approvals_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'temp_approvals' AND auth.role() = 'authenticated'
    );

-- Qualquer autenticado pode VER (coordenação precisa ver os anexos)
DROP POLICY IF EXISTS "temp_approvals_select" ON storage.objects;
CREATE POLICY "temp_approvals_select" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'temp_approvals' AND auth.role() = 'authenticated'
    );

-- Apenas Coord. Geral pode DELETAR (expurgo)
DROP POLICY IF EXISTS "temp_approvals_delete" ON storage.objects;
CREATE POLICY "temp_approvals_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'temp_approvals'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Coord. Geral', 'Presidente', 'Dir. Financeiro')
        )
    );

-- =========================================================================
-- NOTAS:
-- • approval_submissions armazena texto + URLs dos arquivos no bucket
-- • Quando a Coordenação aprova, o frontend:
--   1. Deleta os arquivos do bucket temp_approvals
--   2. Deleta o registro de approval_submissions
--   3. Atualiza o status da demanda/card
-- • Resultado: zero bytes residuais após ciclo completo
-- =========================================================================
