import { createClient } from '@/lib/supabase/server';
import { Meeting } from '@/types/meeting';

export async function getMeetingsAction(): Promise<Meeting[]> {
    try {
        const supabase = await createClient();

        // Validar usuário autenticado
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return [];
        }

        // Buscar reuniões ordenadas por data e hora decrescente
        const { data, error } = await supabase
            .from('meetings')
            .select('*')
            .order('date', { ascending: false })
            .order('start_time', { ascending: false });

        if (error) {
            console.error('Erro ao buscar reuniões:', error);
            return [];
        }

        return data as Meeting[];
    } catch (error: unknown) {
        const digest = (error as { digest?: string })?.digest;
        if (digest === 'DYNAMIC_SERVER_USAGE') return [];
        console.error('Erro no Catch Geral [getMeetingsAction]:', error);
        return [];
    }
}
