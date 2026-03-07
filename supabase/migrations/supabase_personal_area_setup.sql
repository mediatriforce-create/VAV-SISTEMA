-- =========================================================================
-- ARQUITETURA DE DADOS E SEGURANÇA: MÓDULO ÁREA PESSOAL (COFRE DIGITAL)
-- =========================================================================

-- 1. CRIAÇÃO DO ENUM PARA CATEGORIAS DE DOCUMENTOS
-- Obs: Usaremos texto constraint ou ENUM nativo. Para maior flexibilidade futura sem lock no banco, check constraint em TEXT é mais seguro e fácil de expandir, 
-- mas conforme seu requisito exato, criaremos o TYPE ENUM oficial se preferido. Vamos de ENUM para seguir o requisito estrito.
DO $$ BEGIN
    CREATE TYPE document_category AS ENUM ('payslip', 'contract', 'id_card', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. CRIAÇÃO DA TABELA personal_documents
CREATE TABLE IF NOT EXISTS personal_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category document_category NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar segurança
ALTER TABLE personal_documents ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS RLS (Row Level Security) - TABELA personal_documents
-- O usuário só pode SELECT, INSERT, UPDATE, DELETE os SEUS PRÓPRIOS documentos.
-- (Bypass de admin pode ser feito via policies estendidas caso exista uma tabela de roles, mas por hora o core é auth.uid() = user_id)

DROP POLICY IF EXISTS "Usuários gerenciam apenas seus próprios documentos" ON personal_documents;
CREATE POLICY "Usuários gerenciam apenas seus próprios documentos" ON personal_documents
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Se tivermos a tabela "profiles" com campo role = 'admin', podemos adicionar uma regra de Admin depois.
-- Por enquanto, o escopo garante o Cofre 100% privado.

-- =========================================================================
-- CONFIGURAÇÃO DE BUCKET (STORAGE) - SUPABASE
-- =========================================================================

-- Inserindo o bucket "vault" no storage oficial do Supabase. O bucket é PRIVADO por padrão (public: false)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vault', 'vault', false)
ON CONFLICT (id) DO NOTHING;

-- Ativar RLS nos objetos do Storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS (Row Level Security) - SUPABASE STORAGE (Bucket: vault)
-- Nota Crítica: O array de path (storage.foldername(name))[1] deve ser igual ao UID.
-- Ou seja, arquivos DEVEM ser upados na pasta raiz com o nome do ID do usuário, ex: vault/USER_ID/...

-- Permitir INSERT apenas na própria pasta
DROP POLICY IF EXISTS "Permitir upload seguro na pasta privada" ON storage.objects;
CREATE POLICY "Permitir upload seguro na pasta privada" ON storage.objects
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        bucket_id = 'vault' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Permitir SELECT (Get Signed URL/Download) apenas na própria pasta
DROP POLICY IF EXISTS "Permitir leitura isolada de arquivos próprios" ON storage.objects;
CREATE POLICY "Permitir leitura isolada de arquivos próprios" ON storage.objects
    FOR SELECT 
    TO authenticated 
    USING (
        bucket_id = 'vault' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Permitir UPDATE apenas na própria pasta
DROP POLICY IF EXISTS "Permitir update na pasta privada" ON storage.objects;
CREATE POLICY "Permitir update na pasta privada" ON storage.objects
    FOR UPDATE 
    TO authenticated 
    USING (
        bucket_id = 'vault' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Permitir DELETE apenas na própria pasta
DROP POLICY IF EXISTS "Permitir delete na pasta privada" ON storage.objects;
CREATE POLICY "Permitir delete na pasta privada" ON storage.objects
    FOR DELETE 
    TO authenticated 
    USING (
        bucket_id = 'vault' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- SCRIPT CONCLUÍDO. Infraestrutura de Cofre blindada com sucesso.
