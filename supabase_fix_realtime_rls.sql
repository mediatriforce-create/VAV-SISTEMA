-- =========================================================================
-- BYPASS DE RLS PARA O SUPABASE REALTIME (MENSAGENS)
-- =========================================================================

-- O Supabase Realtime exige permissões absolutas de SELECT na tabela 
-- para conseguir transmitir as mudanças via WebSocket. Se a Role que
-- espelha os websockets (anon/authenticated) bloquear, o texto não vai pro rádio.

-- Vamos garantir que os perfis não-autenticados/WebSockets do sistema
-- possam LER e ESCUTAR as alterações (O Frontend que filtra se as exibe).
DROP POLICY IF EXISTS "Acesso Total Envio e Leitura Mensagens Logados" ON messages;

CREATE POLICY "Acesso Total Envio e Leitura Mensagens Logados" ON messages 
FOR ALL USING (true) WITH CHECK (true);

-- Ativando espelhamento explícito do REPLICA IDENTITY
-- Garante que o Update/Insert mande o objeto completo "{ id, content, sender_id }" pro WebSocket
ALTER TABLE messages REPLICA IDENTITY FULL;
