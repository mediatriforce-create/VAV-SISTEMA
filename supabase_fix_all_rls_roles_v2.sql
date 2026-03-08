-- ==========================================
-- RLS ROLE FIX SCRIPT
-- ==========================================

DROP POLICY IF EXISTS "Demands: View Access" ON public.demands;
create policy "Demands: View Access"
  on public.demands for select
  using (
    -- Case A: User is Admin (Coord. Geral, Presidente, Dir. Financeiro)
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Coordenadora ADM', 'Presid�ncia', 'Dire��o')
    )
    OR
    -- Case B: User is the Assignee
    assigned_to = auth.uid()
  );

DROP POLICY IF EXISTS "Demands: Create Access (Coord. Geral Only)" ON public.demands;
create policy "Demands: Create Access (Coord. Geral Only)"
  on public.demands for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'Coordenadora ADM'
    )
  );

DROP POLICY IF EXISTS "Demands: Update Access" ON public.demands;
create policy "Demands: Update Access"
  on public.demands for update
  using (
    -- Admin
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'Coordenadora ADM'
    )
    OR
    -- Assignee
    assigned_to = auth.uid()
  );

DROP POLICY IF EXISTS "Demands: Delete Access (Coord. Geral Only)" ON public.demands;
create policy "Demands: Delete Access (Coord. Geral Only)"
  on public.demands for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'Coordenadora ADM'
    )
  );

DROP POLICY IF EXISTS "Comments: View" ON public.demand_comments;
create policy "Comments: View"
  on public.demand_comments for select
  using (
    exists (
      select 1 from public.demands d
      where d.id = demand_id
      -- Logic duplication: check if user can see 'd'
      -- Since we can't easily recurse policy, we repeat logic:
      and (
        d.assigned_to = auth.uid()
        OR
        exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
          and profiles.role in ('Coordenadora ADM', 'Presid�ncia', 'Dire��o')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Comments: Insert" ON public.demand_comments;
create policy "Comments: Insert"
  on public.demand_comments for insert
  with check (
    exists (
      select 1 from public.demands d
      where d.id = demand_id
      and (
        d.assigned_to = auth.uid()
        OR
        exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
          and profiles.role in ('Coordenadora ADM', 'Presid�ncia', 'Dire��o')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Logs: View" ON public.demand_activity_log;
create policy "Logs: View"
  on public.demand_activity_log for select
  using (
     exists (
      select 1 from public.demands d
      where d.id = demand_id
      and (
        d.assigned_to = auth.uid()
        OR
        exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
          and profiles.role in ('Coordenadora ADM', 'Presid�ncia', 'Dire��o')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Logs: Insert" ON public.demand_activity_log;
create policy "Logs: Insert"
  on public.demand_activity_log for insert
  with check (
     exists (
      select 1 from public.demands d
      where d.id = demand_id
      and (
        d.assigned_to = auth.uid()
        OR
        exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
          and profiles.role in ('Coordenadora ADM', 'Presid�ncia', 'Dire��o')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Communication Assets: Full Access" ON public.communication_assets;
create policy "Communication Assets: Full Access"
  on public.communication_assets for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Estagiário(a) de Comunicação', 'Coordenadora ADM', 'Presid�ncia', 'Dire��o')
    )
  );

DROP POLICY IF EXISTS "Communication Folders: Full Access" ON public.communication_folders;
create policy "Communication Folders: Full Access"
  on public.communication_folders for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Estagiário(a) de Comunicação', 'Coordenadora ADM', 'Presid�ncia', 'Dire��o')
    )
  );

DROP POLICY IF EXISTS "Communication Files: Full Access" ON public.communication_files;
create policy "Communication Files: Full Access"
  on public.communication_files for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Estagiário(a) de Comunicação', 'Coordenadora ADM', 'Presid�ncia', 'Dire��o')
    )
  );

DROP POLICY IF EXISTS "Media Bucket: Insert" ON storage.objects;
create policy "Media Bucket: Insert" on storage.objects for insert
with check (
    bucket_id = 'communication_media' AND
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Estagiário(a) de Comunicação', 'Coordenadora ADM', 'Presid�ncia', 'Dire��o')
    )
);

DROP POLICY IF EXISTS "Media Bucket: Delete" ON storage.objects;
create policy "Media Bucket: Delete" on storage.objects for delete
using (
    bucket_id = 'communication_media' AND
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Estagiário(a) de Comunicação', 'Coordenadora ADM', 'Presid�ncia', 'Dire��o')
    )
);

DROP POLICY IF EXISTS "Files Bucket: Select" ON storage.objects;
create policy "Files Bucket: Select" on storage.objects for select
using (
    bucket_id = 'communication_files' AND
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Estagiário(a) de Comunicação', 'Coordenadora ADM', 'Presid�ncia', 'Dire��o')
    )
);

DROP POLICY IF EXISTS "Files Bucket: Insert" ON storage.objects;
create policy "Files Bucket: Insert" on storage.objects for insert
with check (
    bucket_id = 'communication_files' AND
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Estagiário(a) de Comunicação', 'Coordenadora ADM', 'Presid�ncia', 'Dire��o')
    )
);

DROP POLICY IF EXISTS "Files Bucket: Delete" ON storage.objects;
create policy "Files Bucket: Delete" on storage.objects for delete
using (
    bucket_id = 'communication_files' AND
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Estagiário(a) de Comunicação', 'Coordenadora ADM', 'Presid�ncia', 'Dire��o')
    )
);

DROP POLICY IF EXISTS "Communication Posts: Full Access" ON public.communication_posts;
create policy "Communication Posts: Full Access"
  on public.communication_posts for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Estagiário(a) de Comunicação', 'Coordenadora ADM', 'Presid�ncia', 'Dire��o')
    )
  );

DROP POLICY IF EXISTS "Google Config: Full Access" ON public.google_drive_config;
create policy "Google Config: Full Access"
  on public.google_drive_config for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Estagiário(a) de Comunicação', 'Coordenadora ADM', 'Presid�ncia', 'Dire��o')
    )
  );

DROP POLICY IF EXISTS "approval_submissions_delete" ON public.approval_submissions;
CREATE POLICY "approval_submissions_delete" ON public.approval_submissions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Coordenadora ADM', 'Presid�ncia', 'Dire��o')
        )
    );

DROP POLICY IF EXISTS "temp_approvals_delete" ON storage.objects;
CREATE POLICY "temp_approvals_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'temp_approvals'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Coordenadora ADM', 'Presid�ncia', 'Dire��o')
        )
    );

DROP POLICY IF EXISTS "Lideran�a gerencia as notas do mural" ON coordination_notes;
CREATE POLICY "Lideran�a gerencia as notas do mural" ON coordination_notes
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Coordenadora ADM', 'Presid�ncia', 'Dire��o')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Coordenadora ADM', 'Presid�ncia', 'Dire��o')
        )
    );


-- ==========================================
-- CORREÇÕES: APPROVAL SUBMISSIONS
-- ==========================================
DROP POLICY IF EXISTS "approval_submissions_select" ON public.approval_submissions;
CREATE POLICY "approval_submissions_select" ON public.approval_submissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "approval_submissions_insert" ON public.approval_submissions;
CREATE POLICY "approval_submissions_insert" ON public.approval_submissions FOR INSERT WITH CHECK (auth.uid() = requested_by);

DROP POLICY IF EXISTS "temp_approvals_insert" ON storage.objects;
CREATE POLICY "temp_approvals_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'temp_approvals' AND auth.uid() = owner);

DROP POLICY IF EXISTS "temp_approvals_select" ON storage.objects;
CREATE POLICY "temp_approvals_select" ON storage.objects FOR SELECT USING (bucket_id = 'temp_approvals');

-- ==========================================
-- CORREÇÕES: MODULOS ESQUECIDOS (FAIL-CLOSE FIX)
-- ==========================================

-- PEDAGOGIA KANBAN
DROP POLICY IF EXISTS "Pedagogia Kanban: Full Access" ON public.ped_kanban_cards;
CREATE POLICY "Pedagogia Kanban: Full Access" ON public.ped_kanban_cards FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Estagiário(a) de Pedagogia', 'Educador', 'Coordenação de Pedagogia', 'Direção', 'Presidência'))
);

DROP POLICY IF EXISTS "Pedagogia Comments: Full Access" ON public.ped_kanban_comments;
CREATE POLICY "Pedagogia Comments: Full Access" ON public.ped_kanban_comments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Estagiário(a) de Pedagogia', 'Educador', 'Coordenação de Pedagogia', 'Direção', 'Presidência'))
);

-- PEDAGOGIA BUCKETS
DROP POLICY IF EXISTS "Pedagogia Media Bucket: All" ON storage.objects;
CREATE POLICY "Pedagogia Media Bucket: All" ON storage.objects FOR ALL USING (
    bucket_id = 'pedagogia_media' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Estagiário(a) de Pedagogia', 'Educador', 'Coordenação de Pedagogia', 'Direção', 'Presidência'))
);

-- FINANCEIRO
DROP POLICY IF EXISTS "Financeiro Entries: Full Access" ON public.financial_entries;
CREATE POLICY "Financeiro Entries: Full Access" ON public.financial_entries FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Coordenadora ADM', 'Presidência', 'Direção', 'Estagiário(a) de ADM'))
);

-- CHAT E REUNIÕES
DROP POLICY IF EXISTS "Chat Rooms: Select" ON public.chat_rooms;
CREATE POLICY "Chat Rooms: Select" ON public.chat_rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Chat Messages: Insert" ON public.chat_messages;
CREATE POLICY "Chat Messages: Insert" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Meetings: Full Access" ON public.meetings;
CREATE POLICY "Meetings: Full Access" ON public.meetings FOR ALL USING (true);
