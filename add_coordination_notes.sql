-- =========================================================================
-- VAV CENTRAL - ADD COORDINATION NOTES & REJECTION STATUS
-- Esse script adiciona os campos que permitem a Coordenação
-- incluir uma nota de justificativa e marcar itens como 'rejeitados'.
-- =========================================================================

-- 1. ADD COLUMNS TO DEMANDS
ALTER TABLE public.demands 
ADD COLUMN IF NOT EXISTS coordination_note TEXT,
ADD COLUMN IF NOT EXISTS is_rejected BOOLEAN DEFAULT FALSE;

-- 2. ADD COLUMNS TO PED_KANBAN_CARDS
ALTER TABLE public.ped_kanban_cards
ADD COLUMN IF NOT EXISTS coordination_note TEXT,
ADD COLUMN IF NOT EXISTS is_rejected BOOLEAN DEFAULT FALSE;

-- Nota: Como já rodamos scripts anteriores, o RLS das tabelas
-- herda a visualização e atualização da linha para esses novos campos.
