'use server';

import { createClient } from '@/lib/supabase/server';
import { DocumentCategory, DocumentListResponse, DocumentUploadResponse, SignedUrlResponse } from '../types';

export async function uploadDocument(
    formData: FormData,
    category: DocumentCategory,
    title: string
): Promise<DocumentUploadResponse> {
    try {
        const file = formData.get('file') as File;
        if (!file) throw new Error('Nenhum arquivo providenciado.');

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Acesso negado.');

        // Valida tamanho (5MB) rigorosamente via Backend
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Arquivo excede o tamanho máximo de 5MB.');
        }

        // Validação estrita de extensão (Arquivos Executáveis Bloqueados)
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        if (!['pdf', 'jpg', 'jpeg', 'png'].includes(fileExt || '')) {
            throw new Error('Formato inválido. Aceito apenas PDF, JPG, e PNG.');
        }

        const uuid = crypto.randomUUID();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

        // Caminho de salvamento arquitetural estrito: vault/[user_id]/[category]/[filename]-[uuid].[ext]
        const storagePath = `${user.id}/${category}/${safeName}-${uuid}.${fileExt}`;

        // Envio SSR blindado pro Storage
        const { error: uploadError } = await supabase.storage
            .from('vault')
            .upload(storagePath, file, { upsert: false });

        if (uploadError) throw new Error(`Falha de segurança no upload: ${uploadError.message}`);

        // Inserção da Trilha de Auditoria no DB (DB Ref)
        const { data: insertedDoc, error: dbError } = await supabase
            .from('personal_documents')
            .insert({
                user_id: user.id,
                title: title.trim(),
                category: category,
                storage_path: storagePath
            })
            .select()
            .single();

        if (dbError) throw new Error(`Erro ao finalizar registro: ${dbError.message}`);

        return { success: true, document: insertedDoc };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function getUserDocuments(category?: DocumentCategory): Promise<DocumentListResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Acesso negado.');

        let query = supabase
            .from('personal_documents')
            .select('*')
            .order('created_at', { ascending: false });

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data: data as any }; // Cast provisório pro interface TS
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function getDocumentSignedUrl(storagePath: string): Promise<SignedUrlResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Acesso negado.');

        // O RLS do Bucket garante que um User não pode gerar URL de um [user_id] que não é o dele!
        // Validando geração da signed url de curtição duração (60 segundos)
        const { data, error } = await supabase.storage
            .from('vault')
            .createSignedUrl(storagePath, 60);

        if (error || !data) throw new Error('Falha ao gerar link. Documento protegido.');

        return { success: true, signedUrl: data.signedUrl };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
