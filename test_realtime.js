const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Faltam variaveis de ambiente.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("=== INICIANDO OBSERVAÇÃO RAW WEBSOCKET ===");

const channel = supabase
    .channel('test-channel-global')
    .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
            console.log("🔥 [RAW WEBSOCKET] EVENTO RECEBIDO DO POSTGRES:", payload);
        }
    )
    .subscribe((status, err) => {
        console.log("STATUS DA INSCRIÇÃO WEBSOCKET:", status);
        if (err) console.error("ERRO:", err);
    });

console.log("Aguardando novas mensagens. (Por favor mande uma mensagem no chat do navegador para testarmos)");

// Mantém rodando por 40 segundos e depois fecha
setTimeout(() => {
    supabase.removeChannel(channel);
    console.log("Encerrando teste raw.");
    process.exit(0);
}, 40000);
