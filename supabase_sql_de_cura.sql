-- =========================================================================
-- SQL DE CURA: LIMPEZA E RECARGA ESTÁTICA DAS SALAS DO CHAT
-- =========================================================================

-- 1. LIMPEZA TOTAL (RESET DOS CANAIS)
-- Removemos todos os canais existentes para evitar duplicações ou conflitos.
-- O CASCADE (se houvesse na constraint) limparia as mensagens, mas aqui 
-- limitamos a exclusão apenas para as salas do tipo 'channel'.
DELETE FROM rooms WHERE type = 'channel';

-- 2. INSERÇÃO ESTÁTICA (HARDCODED) E SEGURA
-- Criamos as 5 salas obrigatórias do sistema. 
-- Sem laços dinâmicos, sem variáveis de array, totalmente direto 
-- para garantir 100% de compatibilidade com o executor do Supabase.
INSERT INTO rooms (type, name) VALUES 
('channel', 'Geral'),
('channel', 'Administração'),
('channel', 'Coordenação'),
('channel', 'Comunicação'),
('channel', 'Pedagogia');
