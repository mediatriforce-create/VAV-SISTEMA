-- =========================================================================
-- CORREÇÃO DE EMERGÊNCIA: LOOP DE RECURSÃO INFINITA (RLS)
-- =========================================================================

-- O Postgres bloqueou a tabela 'rooms' e 'room_participants' porque a Política A olhava para a B, 
-- e a Política B olhava para a A, gerando um loop infinito de verificações de permissão (Erro 42P17).

-- 1. DROP nas Políticas Antigas que causam loop
DROP POLICY IF EXISTS "Usuários veem DMs que participam" ON rooms;
DROP POLICY IF EXISTS "Ver participantes de DMs que faço parte" ON room_participants;
DROP POLICY IF EXISTS "Ler mensagens autorizadas" ON messages;
DROP POLICY IF EXISTS "Enviar mensagens em salas autorizadas" ON messages;

-- 2. Nova Abordagem: Função Segura (Security Definer) 
-- Isso permite o Postgres olhar em quais DMs o usuário está *SEM* disparar novamente o RLS, quebrando o Loop!
CREATE OR REPLACE FUNCTION get_my_chat_rooms()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT room_id FROM room_participants WHERE profile_id = auth.uid();
$$;

-- 3. Recriando as Políticas Otimizadas

-- As DMs que eu posso ver são aquelas onde o ID está na minha lista de Salas Pessoais
CREATE POLICY "Usuários veem DMs que participam" ON rooms
FOR SELECT USING (
    type = 'dm' AND id IN (SELECT get_my_chat_rooms())
);

-- Os Participantes que eu posso ver são aqueles que estão nas minhas Salas Pessoais
CREATE POLICY "Ver participantes de DMs que faço parte" ON room_participants
FOR SELECT USING (
    room_id IN (SELECT get_my_chat_rooms())
);

-- Mensagens que posso Ler (DMs ou Canais Abertos para minha Role)
CREATE POLICY "Ler mensagens autorizadas" ON messages
FOR SELECT USING (
    -- Posso ler das minhas DMs
    room_id IN (SELECT get_my_chat_rooms())
    OR 
    -- Posso ler dos Canais que me pertencem
    room_id IN (
        SELECT id FROM rooms WHERE 
        type = 'channel' AND (name = 'Geral' OR name = (SELECT role FROM profiles WHERE id = auth.uid()))
    )
);

-- Mensagens que posso Escrever
CREATE POLICY "Enviar mensagens em salas autorizadas" ON messages
FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND (
        room_id IN (SELECT get_my_chat_rooms())
        OR
        room_id IN (
            SELECT id FROM rooms WHERE 
            type = 'channel' AND (name = 'Geral' OR name = (SELECT role FROM profiles WHERE id = auth.uid()))
        )
    )
);
