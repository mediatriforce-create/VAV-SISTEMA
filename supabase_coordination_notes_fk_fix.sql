-- Ajustando a chave estrangeira para o frontend conseguir buscar os nomes!
-- Como a tabela foi criada apontando para 'auth.users', a consulta tenta trazer os nomes do 'profiles' e falha silenciosamente, não retornando as notas lidas.

ALTER TABLE coordination_notes DROP CONSTRAINT IF EXISTS coordination_notes_author_id_fkey;
ALTER TABLE coordination_notes ADD CONSTRAINT coordination_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE coordination_notes DROP CONSTRAINT IF EXISTS coordination_notes_target_user_id_fkey;
ALTER TABLE coordination_notes ADD CONSTRAINT coordination_notes_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES profiles(id) ON DELETE CASCADE;
