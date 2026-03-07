-- --- SCRIPT DE LIMPEZA DE DADOS ---
-- Este script deleta TODAS as transações financeiras, mas MANTÉM os usuários e perfis.

-- 1. Deletar todas as transações (Entradas e Saídas)
DELETE FROM financial_entries;

-- 2. (Opcional) Deletar os bancos cadastrados
-- Se você quiser manter os bancos (BB, Bradesco, etc) e só limpar os lançamentos, MANTENHA A LINHA ABAIXO COMENTADA.
-- DELETE FROM banks;

-- 3. Resetar contadores de ID (se aplicável, para tabelas com SERIAL/IDENTITY)
-- ALTER SEQUENCE financial_entries_id_seq RESTART WITH 1;
