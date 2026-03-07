import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testUpload() {
  const filePath = 'global_calendar/test_upload.txt';
  const fileContent = 'test data';

  const { data, error } = await supabase.storage
      .from('communication_media')
      .upload(filePath, fileContent, {
          contentType: 'text/plain',
          upsert: true
      });

  console.log(JSON.stringify({ data, error }, null, 2));
}

testUpload();
