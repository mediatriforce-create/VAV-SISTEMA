-- =========================================================================
-- ARQUITETURA DE DADOS E SEGURANÇA: MÓDULO ÁREA PESSOAL V2 
-- (Calendário Local e Mural da Coordenação)
-- =========================================================================

-- =========================================================================
-- 1. TABELA DE CALENDÁRIO PESSOAL (Eventos Privados do Usuário)
-- =========================================================================
CREATE TABLE IF NOT EXISTS personal_calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar segurança RLS pesada (Somente o proprietário vê e mexe no seu calendário)
ALTER TABLE personal_calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários gerenciam apenas seus próprios eventos de calendário" ON personal_calendar_events;
CREATE POLICY "Usuários gerenciam apenas seus próprios eventos de calendário" ON personal_calendar_events
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Opcional: Índice para buscar rapidamente os eventos por usuário e data
CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON personal_calendar_events(user_id, event_date);


-- =========================================================================
-- 2. TABELA DE MURAL DA COORDENAÇÃO (Observações/Lembretes dos Líderes)
-- =========================================================================
CREATE TABLE IF NOT EXISTS coordination_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar segurança RLS (Mural Seguro: Usuário só LÊ. Coordenação INSERE.)
ALTER TABLE coordination_notes ENABLE ROW LEVEL SECURITY;

-- POLÍTICA 1: O colaborador alvo (target_user_id) consegue LER a observação destinada a ele
DROP POLICY IF EXISTS "Colaborador pode ler observações destinadas a ele" ON coordination_notes;
CREATE POLICY "Colaborador pode ler observações destinadas a ele" ON coordination_notes
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = target_user_id);

-- POLÍTICA 2: Quem ESCREVE/ATUALIZA/DELETA são apenas perfis com role de Coordenação/Admin.
-- Assumindo que você tem uma tabela `profiles` com uma coluna `role` que rege o sistema.
-- Vamos fazer um SELECT interno para cruzar a permissão de RLS e dar super-poderes aos Líderes.

DROP POLICY IF EXISTS "Liderança gerencia as notas do mural" ON coordination_notes;
CREATE POLICY "Liderança gerencia as notas do mural" ON coordination_notes
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'coordenador', 'Coordenação', 'Administração')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'coordenador', 'Coordenação', 'Administração')
        )
    );

-- Índice para otimizar o carregamento do Mural do usuário
CREATE INDEX IF NOT EXISTS idx_notes_target_user ON coordination_notes(target_user_id);

-- SCRIPT CONCLUÍDO. Infraestrutura de Calendário e Mural blindada com sucesso.
