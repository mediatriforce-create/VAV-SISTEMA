-- Rename Banco 1 to Bradesco
UPDATE public.banks 
SET name = 'Bradesco' 
WHERE name = 'Banco 1';

-- Optional: Verify
SELECT * FROM public.banks;
