import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlans() {
    const { data: plans, error } = await supabase.from('lesson_plans').select('*');
    if (error) {
        console.error('Erro ao ler', error);
    } else {
        console.log('Total de planos:', plans.length);
        console.log(plans);
    }
}

checkPlans();
