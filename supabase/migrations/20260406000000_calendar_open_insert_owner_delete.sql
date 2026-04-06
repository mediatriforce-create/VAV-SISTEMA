-- Atualiza políticas do calendário global:
-- - Qualquer usuário autenticado pode criar eventos
-- - Usuário pode deletar seus próprios eventos
-- - Liderança pode deletar qualquer evento

-- Remove políticas antigas
DROP POLICY IF EXISTS "Líderes podem criar eventos do calendário" ON public.global_calendar_events;
DROP POLICY IF EXISTS "Líderes podem deletar eventos" ON public.global_calendar_events;

-- Qualquer usuário autenticado pode criar (associando ao próprio id)
CREATE POLICY "Usuários autenticados podem criar eventos"
ON public.global_calendar_events
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = created_by
);

-- Dono pode deletar seu próprio evento; liderança pode deletar qualquer um
CREATE POLICY "Dono ou liderança podem deletar eventos"
ON public.global_calendar_events
FOR DELETE
TO authenticated
USING (
    auth.uid() = created_by
    OR public.is_leadership_role(auth.uid())
);
