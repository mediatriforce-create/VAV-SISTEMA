-- ==============================================================================
-- SCRIPT DE LIMPEZA TOTAL (WIPE) DO BANCO DE DADOS
-- Atenção: Isso apagará TODOS os usuários, perfis, demandas, mensagens do chat, etc.
-- ==============================================================================

-- 0. Remover amarras de chaves estrangeiras que bloqueiam a exclusão (Cascata manual)
-- A ordem importa! Apagamos os "filhos" primeiro para poder apagar os "pais" depois.
DO $$ 
BEGIN 
  -- Executamos os truncates dentro de um bloco PL/pgSQL para capturar se a tabela existe ou não.
  -- Usamos isso para não quebrar a execução se alguma feature não existir ainda (Ex: Chat)
  
  EXECUTE 'TRUNCATE TABLE financial_entries CASCADE;';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN EXECUTE 'TRUNCATE TABLE ped_cards CASCADE;'; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'TRUNCATE TABLE demands CASCADE;'; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'TRUNCATE TABLE personal_calendar_events CASCADE;'; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'TRUNCATE TABLE coordination_notes CASCADE;'; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'TRUNCATE TABLE chat_channels CASCADE;'; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'TRUNCATE TABLE messages CASCADE;'; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- 1. Apagar todos os usuários da base de autenticação principal.
-- O Supabase cuida da cascata. Como 'profiles' e a maioria das outras tabelas
-- têm "ON DELETE CASCADE" ligado ao auth.users, apagar os usuários reais destrói
-- os perfis.
DELETE FROM auth.users;

-- 2. Garantia de limpeza (truncar tabelas secundárias caso algo tenha sobrado sem dono)
DO $$ BEGIN EXECUTE 'TRUNCATE TABLE profiles CASCADE;'; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'TRUNCATE TABLE whitelist CASCADE;'; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Banco de dados zerado e pronto para a V2 do sistema Viva a Vida!
