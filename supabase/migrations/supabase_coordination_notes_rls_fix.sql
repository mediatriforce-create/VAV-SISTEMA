-- Correção do erro RLS (Row Level Security) para Coordination Notes
-- O perfil 'Coord. Geral' e outros líderes precisam ter permissão de escrita.

DROP POLICY IF EXISTS "Liderança gerencia as notas do mural" ON coordination_notes;

CREATE POLICY "Liderança gerencia as notas do mural" ON coordination_notes
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'coordenador', 'Coordenação', 'Administração', 'Coord. Geral', 'Direção', 'Diretor', 'Presidente')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'coordenador', 'Coordenação', 'Administração', 'Coord. Geral', 'Direção', 'Diretor', 'Presidente')
        )
    );
