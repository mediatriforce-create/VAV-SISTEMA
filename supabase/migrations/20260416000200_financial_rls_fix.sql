-- Drop old policies
DROP POLICY IF EXISTS "Financial Entries: Full Access for Admins" ON financial_entries;
DROP POLICY IF EXISTS "Financial Docs: Admin View" ON storage.objects;
DROP POLICY IF EXISTS "Financial Docs: Admin Upload" ON storage.objects;
DROP POLICY IF EXISTS "Financial Docs: Admin Delete" ON storage.objects;

-- Create new policy for financial_entries
CREATE POLICY "Financial Entries: Full Access for Admins"
  ON financial_entries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Coordenadora ADM', 'Presidência', 'Direção', 'Estagiário(a) de ADM')
    )
  );

-- Create new policies for storage financial_docs
CREATE POLICY "Financial Docs: Admin View"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'financial_docs'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Coordenadora ADM', 'Presidência', 'Direção', 'Estagiário(a) de ADM')
    )
  );

CREATE POLICY "Financial Docs: Admin Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'financial_docs'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Coordenadora ADM', 'Presidência', 'Direção', 'Estagiário(a) de ADM')
    )
  );

CREATE POLICY "Financial Docs: Admin Delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'financial_docs'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Coordenadora ADM', 'Presidência', 'Direção', 'Estagiário(a) de ADM')
    )
  );
