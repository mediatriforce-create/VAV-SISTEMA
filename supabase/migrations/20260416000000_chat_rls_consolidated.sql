-- =========================================================================
-- CONSOLIDAÇÃO RLS DO CHAT — Conserta recursão infinita em room_participants
-- =========================================================================
-- Erro 42P17: "infinite recursion detected in policy for relation room_participants"
-- Causa: policy de room_participants fazia subquery em room_participants.
-- Solução: usar funções SECURITY DEFINER que não disparam RLS.
-- Também alinha roles do banco com Role[] em src/lib/permissions.ts.
-- =========================================================================

-- 1. LIMPEZA TOTAL das policies legadas
DROP POLICY IF EXISTS "Usuários veem DMs que participam" ON rooms;
DROP POLICY IF EXISTS "Usuários veem canais permitidos pela sua Role" ON rooms;
DROP POLICY IF EXISTS "Usuários podem criar DMs" ON rooms;
DROP POLICY IF EXISTS "Acesso Total as Salas Logados" ON rooms;

DROP POLICY IF EXISTS "Ver participantes de DMs que faço parte" ON room_participants;
DROP POLICY IF EXISTS "Permitir ingressar em DMs" ON room_participants;
DROP POLICY IF EXISTS "Acesso Total aos Participantes Logados" ON room_participants;

DROP POLICY IF EXISTS "Ler mensagens autorizadas" ON messages;
DROP POLICY IF EXISTS "Enviar mensagens em salas autorizadas" ON messages;
DROP POLICY IF EXISTS "Acesso Total Envio e Leitura Mensagens Logados" ON messages;

-- 2. FUNÇÕES SECURITY DEFINER (não disparam RLS — quebram a recursão)

CREATE OR REPLACE FUNCTION public.get_my_chat_rooms()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT room_id FROM room_participants WHERE profile_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.has_channel_access(channel_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  IF channel_name = 'Geral' THEN
    RETURN true;
  END IF;

  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();

  -- Alta gestão acessa tudo (cobre nomes legados e atuais)
  IF user_role IN (
    'Presidência', 'Direção', 'Coordenadora ADM', 'Coordenação de Pedagogia',
    'Coord. Geral', 'Presidente', 'Dir. Financeiro'
  ) THEN
    RETURN true;
  END IF;

  -- Mapeamento setorial (cobre nomes novos do permissions.ts e legados)
  IF channel_name = 'Administração' AND user_role IN (
    'Estagiário(a) de ADM', 'Estágio ADM', 'Coordenadora ADM'
  ) THEN
    RETURN true;
  ELSIF channel_name = 'Comunicação' AND user_role IN (
    'Estagiário(a) de Comunicação', 'Comunicação'
  ) THEN
    RETURN true;
  ELSIF channel_name = 'Coordenação' AND user_role IN (
    'Coordenação de Pedagogia', 'Coord. Pedagógica'
  ) THEN
    RETURN true;
  ELSIF channel_name = 'Pedagogia' AND user_role IN (
    'Coordenação de Pedagogia', 'Educador', 'Estagiário(a) de Pedagogia',
    'Coord. Pedagógica', 'Educadora', 'Estágio Pedagógico'
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 3. POLICIES recriadas SEM recursão

-- rooms: ver DMs onde participo + canais que minha role permite
CREATE POLICY "rooms_select" ON rooms
FOR SELECT TO authenticated
USING (
  (type = 'dm' AND id IN (SELECT public.get_my_chat_rooms()))
  OR
  (type = 'channel' AND public.has_channel_access(name))
);

CREATE POLICY "rooms_insert_dm" ON rooms
FOR INSERT TO authenticated
WITH CHECK (type = 'dm');

-- room_participants: ver participantes apenas das minhas salas (sem auto-referência)
CREATE POLICY "room_participants_select" ON room_participants
FOR SELECT TO authenticated
USING (room_id IN (SELECT public.get_my_chat_rooms()));

-- Inserir-se em uma DM: o próprio usuário, ou qualquer participante de uma DM existente adicionando outro
CREATE POLICY "room_participants_insert" ON room_participants
FOR INSERT TO authenticated
WITH CHECK (
  profile_id = auth.uid()
  OR room_id IN (SELECT public.get_my_chat_rooms())
);

-- messages: ler de DMs que participo OU canais que tenho acesso
CREATE POLICY "messages_select" ON messages
FOR SELECT TO authenticated
USING (
  room_id IN (SELECT public.get_my_chat_rooms())
  OR room_id IN (
    SELECT id FROM rooms WHERE type = 'channel' AND public.has_channel_access(name)
  )
);

-- messages: enviar apenas como eu mesmo, em salas que tenho acesso
CREATE POLICY "messages_insert" ON messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND (
    room_id IN (SELECT public.get_my_chat_rooms())
    OR room_id IN (
      SELECT id FROM rooms WHERE type = 'channel' AND public.has_channel_access(name)
    )
  )
);
