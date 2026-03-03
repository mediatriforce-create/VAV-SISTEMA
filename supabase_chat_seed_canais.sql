-- =========================================================================
-- CARGA INICIAL À PROVA DE FALHAS: CRIANDO OS CANAIS SETORIAIS 
-- =========================================================================

-- O script anterior falhou silenciosamente no Supabase porque o PostgreSQL
-- exige CAST estrito do tipo ENUM ('chat_room_type') quando usamos SELECT.
-- Este script usa blocos diretos (INSERT INTO VALUES) que são 100% garantidos.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM rooms WHERE name = 'Administração') THEN
        INSERT INTO rooms (type, name) VALUES ('channel'::chat_room_type, 'Administração');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM rooms WHERE name = 'Coordenação') THEN
        INSERT INTO rooms (type, name) VALUES ('channel'::chat_room_type, 'Coordenação');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM rooms WHERE name = 'Comunicação') THEN
        INSERT INTO rooms (type, name) VALUES ('channel'::chat_room_type, 'Comunicação');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM rooms WHERE name = 'Pedagogia') THEN
        INSERT INTO rooms (type, name) VALUES ('channel'::chat_room_type, 'Pedagogia');
    END IF;
END $$;
