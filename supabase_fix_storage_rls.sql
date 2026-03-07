-- Remover as politicas antigas que continham os cargos com nomes desatualizados
DROP POLICY IF EXISTS "Media Bucket: Insert" ON storage.objects;
DROP POLICY IF EXISTS "Media Bucket: Delete" ON storage.objects;
DROP POLICY IF EXISTS "Files Bucket: Insert" ON storage.objects;
DROP POLICY IF EXISTS "Files Bucket: Delete" ON storage.objects;

-- Criar as novas com as roles corretas do sistema atual
CREATE POLICY "Media Bucket: Insert" ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'communication_media' AND
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Comunicação', 'Coordenadora ADM', 'Direção', 'Presidência', 'Estagiário(a) de Comunicação', 'Coordenação de Pedagogia')
    )
);

CREATE POLICY "Media Bucket: Delete" ON storage.objects FOR DELETE
USING (
    bucket_id = 'communication_media' AND
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Comunicação', 'Coordenadora ADM', 'Direção', 'Presidência', 'Estagiário(a) de Comunicação', 'Coordenação de Pedagogia')
    )
);

CREATE POLICY "Files Bucket: Insert" ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'communication_files' AND
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Comunicação', 'Coordenadora ADM', 'Direção', 'Presidência', 'Estagiário(a) de Comunicação')
    )
);

CREATE POLICY "Files Bucket: Delete" ON storage.objects FOR DELETE
USING (
    bucket_id = 'communication_files' AND
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Comunicação', 'Coordenadora ADM', 'Direção', 'Presidência', 'Estagiário(a) de Comunicação')
    )
);
