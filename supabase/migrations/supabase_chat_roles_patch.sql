-- =========================================================================
-- CORREÇÃO DEFINITIVA: MAPEAMENTO DE ROLES PARA CANAIS (RLS)
-- =========================================================================

-- Cria a função inteligente que verifica se a Role tem acesso ao Canal
CREATE OR REPLACE FUNCTION public.has_channel_access(channel_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Canal 'Geral' é sempre aberto
  IF channel_name = 'Geral' THEN
    RETURN true;
  END IF;

  -- Pega o cargo do usuário logado
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  
  -- Segurança 1: Cargos de Alta Gestão acessam todos os canais
  IF user_role IN ('Coord. Geral', 'Presidente', 'Dir. Financeiro') THEN
    RETURN true;
  END IF;

  -- Segurança 2: Mapeamento Específico Setorial
  IF channel_name = 'Administração' AND user_role IN ('Estágio ADM') THEN
    RETURN true;
  ELSIF channel_name = 'Comunicação' AND user_role IN ('Comunicação') THEN
    RETURN true;
  ELSIF channel_name = 'Coordenação' AND user_role IN ('Coord. Pedagógica') THEN
    RETURN true;
  ELSIF channel_name = 'Pedagogia' AND user_role IN ('Coord. Pedagógica', 'Educadora', 'Estágio Pedagógico') THEN
    RETURN true;
  END IF;

  -- Bloqueia tudo que não couber nestas regras
  RETURN false;
END;
$$;

-- Atualizar Políticas existentes para usar essa nova mente inteligente

-- Política 1: Rooms (Quais canais listar)
DROP POLICY IF EXISTS "Usuários veem canais permitidos pela sua Role" ON rooms;
CREATE POLICY "Usuários veem canais permitidos pela sua Role" ON rooms
FOR SELECT USING (
    type = 'channel' AND has_channel_access(name)
);

-- Política 2: Messages (Leitura)
DROP POLICY IF EXISTS "Ler mensagens autorizadas" ON messages;
CREATE POLICY "Ler mensagens autorizadas" ON messages
FOR SELECT USING (
    room_id IN (SELECT get_my_chat_rooms()) -- DMs
    OR 
    room_id IN (
        SELECT id FROM rooms WHERE type = 'channel' AND has_channel_access(name)
    ) -- Canais Mapeados
);

-- Política 3: Messages (Envio)
DROP POLICY IF EXISTS "Enviar mensagens em salas autorizadas" ON messages;
CREATE POLICY "Enviar mensagens em salas autorizadas" ON messages
FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND (
        room_id IN (SELECT get_my_chat_rooms()) -- DMs
        OR
        room_id IN (
            SELECT id FROM rooms WHERE type = 'channel' AND has_channel_access(name)
        ) -- Canais Mapeados
    )
);
