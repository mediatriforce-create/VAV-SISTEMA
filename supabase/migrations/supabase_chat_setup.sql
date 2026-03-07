-- =========================================================================
-- ARQUITETURA DE BANCO DE DADOS: MÓDULO DE CHAT REALTIME (VAV CENTRAL)
-- =========================================================================

-- 1. Criação de Tipos e Tabelas Base

-- Enumera os tipos de salas possíveis
CREATE TYPE chat_room_type AS ENUM ('channel', 'dm');

-- Tabela de Salas (Armazena canais globais e contêineres para DMs)
CREATE TABLE IF NOT EXISTS rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type chat_room_type NOT NULL,
    name TEXT, -- Preenchido apenas para canais (ex: 'Geral', 'Comunicação', 'Diretoria'). Null para DMs.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Participantes (Mapeia quem está em qual DM. Canais globais usam verificação direta pela 'role')
CREATE TABLE IF NOT EXISTS room_participants (
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (room_id, profile_id)
);

-- Tabela de Mensagens (Onde a mágica do Realtime acontece)
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Segurança - Habilitando RLS (Row Level Security)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 3. Criação de Policies Estritas (Acesso de Leitura e Escrita Seguro)

-- ==========================================
-- POLICIES PARA 'rooms'
-- ==========================================
-- A: Usuário pode ver DMs se ele for um participante
CREATE POLICY "Usuários veem DMs que participam" ON rooms
FOR SELECT USING (
    type = 'dm' AND id IN (
        SELECT room_id FROM room_participants WHERE profile_id = auth.uid()
    )
);

-- B: Usuário pode ver canais baseados na Role ou o Canal 'Geral'
CREATE POLICY "Usuários veem canais permitidos pela sua Role" ON rooms
FOR SELECT USING (
    type = 'channel' AND (
        name = 'Geral' OR
        name = (SELECT role FROM profiles WHERE id = auth.uid())
    )
);

-- C: Usuários podem criar novas DMs
CREATE POLICY "Usuários podem criar DMs" ON rooms
FOR INSERT WITH CHECK (
    type = 'dm'
);

-- ==========================================
-- POLICIES PARA 'room_participants'
-- ==========================================
-- A: Ver participantes de salas que você tem acesso
CREATE POLICY "Ver participantes de DMs que faço parte" ON room_participants
FOR SELECT USING (
    room_id IN (
        SELECT id FROM rooms WHERE type = 'dm' AND id IN (
            SELECT room_id FROM room_participants AS rp WHERE rp.profile_id = auth.uid()
        )
    )
);

-- B: Inserir participantes ao criar nova DM
CREATE POLICY "Permitir ingressar em DMs" ON room_participants
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
);

-- ==========================================
-- POLICIES PARA 'messages'
-- ==========================================
-- A: Ler mensagens apenas de salas que tenha autorização (DM ou Channel da Role)
CREATE POLICY "Ler mensagens autorizadas" ON messages
FOR SELECT USING (
    room_id IN (
         SELECT id FROM rooms WHERE 
            (type = 'channel' AND (name = 'Geral' OR name = (SELECT role FROM profiles WHERE id = auth.uid())))
            OR
            (type = 'dm' AND id IN (SELECT room_id FROM room_participants WHERE profile_id = auth.uid()))
    )
);

-- B: Enviar mensagem (Inserir)
CREATE POLICY "Enviar mensagens em salas autorizadas" ON messages
FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    room_id IN (
         SELECT id FROM rooms WHERE 
            (type = 'channel' AND (name = 'Geral' OR name = (SELECT role FROM profiles WHERE id = auth.uid())))
            OR
            (type = 'dm' AND id IN (SELECT room_id FROM room_participants WHERE profile_id = auth.uid()))
    )
);


-- 4. ATIVAÇÃO DO SUPABASE REALTIME NA TABELA DE MENSAGENS
-- Adiciona a tabela messages à publicação oficial de realtime do Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE messages;


-- 5. CARGA INICIAL (SEED) DE CANAIS SETORIAIS
-- Cria os Canais baseados nas Roles do sistema automaticamente
INSERT INTO rooms (type, name) VALUES 
('channel', 'Geral'),
('channel', 'Administração'),
('channel', 'Coordenação'),
('channel', 'Comunicação'),
('channel', 'Pedagogia');
