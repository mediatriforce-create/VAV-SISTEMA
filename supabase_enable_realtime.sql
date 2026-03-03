-- =========================================================================
-- ATIVANDO O MOTOR DE TEMPO REAL (WEBSOCKETS) NO SUPABASE
-- =========================================================================

-- O Supabase, por padrão, desliga as notificações em tempo real para economizar banda.
-- O frontend VAV depende ativamente disso para o chat funcionar sem precisar de F5.

-- Comando 1: Criar a publicação se ela não existir
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

-- Comando 2: Adicionar a tabela `messages` e a tabela `rooms` no motor de tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

-- Só para segurança, também garantimos em `room_participants` caso venhamos a ter DMs instantâneas
ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;

-- Pronto! O frontend agora escutará os `INSERTS` magicamente pelo WebSocket.
