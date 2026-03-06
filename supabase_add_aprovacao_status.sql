-- =========================================================================
-- VAV CENTRAL - ADICIONAR STATUS "APROVAÇÃO" NOS KANBANS
-- Permite que cards/demandas fiquem em "Esperando Aprovação" antes de concluir
-- =========================================================================

-- 1. PEDAGOGIA: Adicionar 'aprovacao' ao CHECK de column_status
-- Primeiro remove a constraint antiga, depois adiciona a nova
ALTER TABLE public.ped_kanban_cards DROP CONSTRAINT IF EXISTS ped_kanban_cards_column_status_check;
ALTER TABLE public.ped_kanban_cards ADD CONSTRAINT ped_kanban_cards_column_status_check
    CHECK (column_status IN ('backlog', 'planejado', 'andamento', 'aprovacao', 'concluido'));

-- 2. COMUNICAÇÃO/COORDENAÇÃO: Adicionar 'aprovacao' ao CHECK de status em demands
ALTER TABLE public.demands DROP CONSTRAINT IF EXISTS demands_status_check;
ALTER TABLE public.demands ADD CONSTRAINT demands_status_check
    CHECK (status IN ('a_fazer', 'em_andamento', 'revisao', 'aprovacao', 'finalizado'));

-- =========================================================================
-- NOTAS:
-- • 'aprovacao' fica ENTRE 'andamento'/'revisao' e 'concluido'/'finalizado'
-- • Cards arrastados para esta coluna aguardam aval da Coordenação
-- • A aprovação em si será feita na tela da Coordenação
-- =========================================================================
