import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
async function test() {
  const { data, error } = await supabase.rpc('get_policies', { table_name: 'meetings' });
  console.log(JSON.stringify({ data, error }, null, 2));
}
test();
