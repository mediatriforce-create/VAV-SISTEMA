import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Você não está logado(a)' });
    }

    // Pega o cargo atual no banco de dados
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    // Pega todos os canais que o usuário consegue enxergar
    const { data: channels, error: channelsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('type', 'channel');

    // Executa a função do PostgreSQL simulando o cargo para ver o que o Postgres retorna
    const testCases = ['Geral', 'Administração', 'Coordenação', 'Comunicação', 'Pedagogia'];
    const rpcResults: any = {};

    for (const ch of testCases) {
        // Tenta ver se a função consegue retornar TRUE ou FALSE para cada caso
        const { data } = await supabase.rpc('has_channel_access', { channel_name: ch }).single();
        rpcResults[ch] = data;
    }

    return NextResponse.json({
        diagnostico: 'INICIADO',
        usuario_id: user.id,
        cargo_no_perfil: profile?.role,
        canais_vistos_pelo_RLS: channels,
        canais_erro: channelsError,
        simulacao_das_regras_do_postgres: rpcResults
    }, { status: 200 });
}
