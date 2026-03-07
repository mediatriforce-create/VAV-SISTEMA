-- Drop the old overly restrictive policy
DROP POLICY IF EXISTS "Users can view their own meetings" ON public.meetings;

-- Create a new policy that allows all authenticated users to view all meetings
CREATE POLICY "Users can view all meetings"
  ON public.meetings
  FOR SELECT
  USING (auth.role() = 'authenticated');
