-- =========================================================================
-- VAV CENTRAL - MÓDULO PEDAGOGIA (FASE 2)
-- Configuração do Bucket de Storage para o Banco de Atividades
-- =========================================================================

-- 1. Cria o bucket chamado 'pedagogia_activities' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('pedagogia_activities', 'pedagogia_activities', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Segurança (Row Level Security) para o bucket

-- Permitir leitura pública dos arquivos (como 'public' é true, isso ajuda, mas garantimos com política)
CREATE POLICY "Leitura Pública de Atividades" ON storage.objects
FOR SELECT USING (bucket_id = 'pedagogia_activities');

-- Permitir upload/inserção para usuários autenticados
CREATE POLICY "Upload para Usuários Autenticados" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'pedagogia_activities' AND auth.role() = 'authenticated'
);

-- Permitir que o usuário delete seus próprios arquivos
CREATE POLICY "Usuário deleta seus arquivos" ON storage.objects
FOR DELETE USING (
    bucket_id = 'pedagogia_activities' AND auth.uid() = owner
);

-- Permitir que o usuário atualize seus próprios arquivos
CREATE POLICY "Usuário atualiza seus arquivos" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'pedagogia_activities' AND auth.uid() = owner
);
