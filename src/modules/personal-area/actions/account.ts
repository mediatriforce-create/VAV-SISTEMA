'use server';

import { createClient } from '@/lib/supabase/server';
import { StandardResponse } from '../types/v2';

export async function updateAccountCredentials(params: { password?: string }): Promise<StandardResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Acesso negado.');

        // O Supabase Auth lida com a Criptografia Salgada Nativa antes de Inserir no DB.
        const { error } = await supabase.auth.updateUser({
            password: params.password,
        });

        if (error) throw new Error(`Falha de segurança na atualização: ${error.message}`);

        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
