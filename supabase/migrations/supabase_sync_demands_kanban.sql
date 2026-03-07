-- =========================================================================
-- VAV CENTRAL - TRIGGER: SINCRONIZAR DEMANDS → KANBAN PEDAGOGIA
-- Quando uma demanda com sector='pedagogia' é criada na tabela demands,
-- automaticamente cria um card no Kanban de Pedagogia (ped_kanban_cards).
-- =========================================================================

-- 1. Adicionar coluna demand_id na tabela ped_kanban_cards (campo de ligação)
ALTER TABLE public.ped_kanban_cards
ADD COLUMN IF NOT EXISTS demand_id UUID REFERENCES public.demands(id) ON DELETE CASCADE UNIQUE;

-- Comentário: UNIQUE garante que uma demanda gera no máximo 1 card.
-- ON DELETE CASCADE remove o card se a demanda for deletada.

-- 2. Função que faz o INSERT automático no kanban de pedagogia
CREATE OR REPLACE FUNCTION sync_demand_to_ped_kanban()
RETURNS TRIGGER AS $$
BEGIN
    -- Só dispara para demandas do setor de Pedagogia
    IF NEW.sector = 'pedagogia' THEN
        INSERT INTO public.ped_kanban_cards (
            title,
            description,
            card_type,
            column_status,
            due_date,
            created_by,
            demand_id
        ) VALUES (
            NEW.title,
            COALESCE(NEW.description, '') || E'\n\n👑 Demanda Oficial da Coordenação',
            'Demanda Coordenação',
            'backlog',  -- Sempre entra na primeira coluna
            NEW.due_date,
            NEW.created_by,
            NEW.id       -- Ligação direta com a demanda original
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SECURITY DEFINER: Executa com os privilegios do owner (bypassa RLS)

-- 3. Criar o trigger na tabela demands (AFTER INSERT)
DROP TRIGGER IF EXISTS trigger_demand_to_ped_kanban ON public.demands;

CREATE TRIGGER trigger_demand_to_ped_kanban
AFTER INSERT ON public.demands
FOR EACH ROW
EXECUTE FUNCTION sync_demand_to_ped_kanban();

-- =========================================================================
-- NOTAS:
-- • O Kanban de Comunicação NÃO precisa de trigger porque já usa a tabela
--   demands diretamente (filtra por sector='comunicacao').
-- • Se a demanda for deletada, o card vinculado é removido automaticamente
--   (ON DELETE CASCADE no demand_id).
-- • O card aparece com card_type='Demanda Coordenação' para diferenciação visual.
-- =========================================================================
