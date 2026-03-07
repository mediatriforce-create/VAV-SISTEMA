-- =========================================================================
-- ARQUITETURA DE DADOS: MÓDULO DE CHAT V2 (TOTALMENTE LIVRE)
-- =========================================================================

-- 1. DELEÇÃO SEGURA (GARANTIA DE TERRENO LIMPO ONDE TUDO VAI COMEÇAR DO ZERO)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS room_participants CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- 2. CRIAÇÃO DAS TABELAS (Abolimos ENUM complexos para Texto Seguro)
CREATE TABLE rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('channel', 'dm')),
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE room_participants (
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (room_id, profile_id)
);

CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. HABILITANDO O REALTIME NA PUBLICAÇÃO PRINCIPAL DO WEBSOCKET
-- Se não fizermos isso, o chat não tem vida ao vivo
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 4. SEGURANÇA MÁXIMA PARA A ONG (MAS TOTALMENTE ABERTA PARA AS EQUIPES VEREM AS SALAS)
-- Ligamos as chaves, mas a fechadura agora roda com 'true' para todos do sistema.
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso Total as Salas Logados" ON rooms 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acesso Total aos Participantes Logados" ON room_participants 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acesso Total Envio e Leitura Mensagens Logados" ON messages 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. CARGA INICIAL (INSERÇÃO BRUTA DIRETA, À PROVA DE BALAS, DAS SALAS OFICIAIS)
INSERT INTO rooms (type, name) VALUES 
('channel', 'Geral'),
('channel', 'Administração'),
('channel', 'Coordenação'),
('channel', 'Comunicação'),
('channel', 'Pedagogia');
