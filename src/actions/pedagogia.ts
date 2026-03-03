'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Class, PedKanbanCard, PedActivity, PedFolder, PedFile } from '@/types/pedagogia';

const MODULE_PATH = '/dashboard/pedagogia';

// ============================================================
// TURMAS (reutiliza tabela 'classes')
// ============================================================

export async function getMyClasses(): Promise<{ success: boolean; data?: Class[]; message?: string }> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('classes')
            .select(`*, teacher:teacher_id (id, full_name, avatar_url)`)
            .order('year_group', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;
        return { success: true, data: data as Class[] };
    } catch (error: any) {
        console.error('getMyClasses Error:', error.message);
        return { success: false, message: error.message };
    }
}

// ============================================================
// KANBAN
// ============================================================

export async function getKanbanCards(): Promise<{ success: boolean; data?: PedKanbanCard[]; message?: string }> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('ped_kanban_cards')
            .select(`
                *,
                creator:created_by(full_name),
                classes:ped_kanban_card_classes(class_id, class:class_id(id, name, year_group))
            `)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Flatten classes join
        const cards = (data || []).map((card: any) => ({
            ...card,
            classes: card.classes?.map((c: any) => c.class).filter(Boolean) || []
        }));

        return { success: true, data: cards as PedKanbanCard[] };
    } catch (error: any) {
        console.error('getKanbanCards Error:', error.message);
        return { success: false, message: error.message };
    }
}

export async function createKanbanCard(input: {
    title: string;
    card_type?: string;
    description?: string;
    due_date?: string;
    column_status?: string;
    class_ids?: string[];
}): Promise<{ success: boolean; data?: PedKanbanCard; message?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autorizado');

        const { data: card, error } = await supabase
            .from('ped_kanban_cards')
            .insert({
                title: input.title,
                card_type: input.card_type || null,
                description: input.description || null,
                due_date: input.due_date || null,
                column_status: input.column_status || 'backlog',
                created_by: user.id
            })
            .select()
            .single();

        if (error) throw error;

        // Vincular turmas
        if (input.class_ids && input.class_ids.length > 0) {
            const inserts = input.class_ids.map(cid => ({ card_id: card.id, class_id: cid }));
            await supabase.from('ped_kanban_card_classes').insert(inserts);
        }

        revalidatePath(`${MODULE_PATH}/kanban`);
        return { success: true, data: card as PedKanbanCard };
    } catch (error: any) {
        console.error('createKanbanCard Error:', error.message);
        return { success: false, message: error.message };
    }
}

export async function updateKanbanCardStatus(cardId: string, newStatus: string): Promise<{ success: boolean; message?: string }> {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('ped_kanban_cards')
            .update({ column_status: newStatus })
            .eq('id', cardId);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('updateKanbanCardStatus Error:', error.message);
        return { success: false, message: error.message };
    }
}

export async function deleteKanbanCard(cardId: string): Promise<{ success: boolean; message?: string }> {
    try {
        const supabase = await createClient();
        const { error } = await supabase.from('ped_kanban_cards').delete().eq('id', cardId);
        if (error) throw error;
        revalidatePath(`${MODULE_PATH}/kanban`);
        return { success: true };
    } catch (error: any) {
        console.error('deleteKanbanCard Error:', error.message);
        return { success: false, message: error.message };
    }
}

// ============================================================
// ATIVIDADES DO DIA
// ============================================================

export async function getActivities(classId?: string, date?: string): Promise<{ success: boolean; data?: PedActivity[]; message?: string }> {
    try {
        const supabase = await createClient();
        let query = supabase
            .from('ped_activities')
            .select(`
                *,
                class_info:class_id(id, name, year_group, shift),
                creator:created_by(full_name),
                files:ped_activity_files(file:file_id(*))
            `)
            .order('activity_date', { ascending: false });

        if (classId) query = query.eq('class_id', classId);
        if (date) query = query.eq('activity_date', date);

        const { data, error } = await query;
        if (error) throw error;

        // Flatten files
        const activities = (data || []).map((act: any) => ({
            ...act,
            files: act.files?.map((f: any) => f.file).filter(Boolean) || []
        }));

        return { success: true, data: activities as PedActivity[] };
    } catch (error: any) {
        console.error('getActivities Error:', error.message);
        return { success: false, message: error.message };
    }
}

export async function createActivity(input: {
    class_id: string;
    activity_date: string;
    title: string;
    description?: string;
    notes?: string;
    file_ids?: string[];
}): Promise<{ success: boolean; data?: PedActivity; message?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autorizado');

        const { data: activity, error } = await supabase
            .from('ped_activities')
            .insert({
                class_id: input.class_id,
                activity_date: input.activity_date,
                title: input.title,
                description: input.description || null,
                notes: input.notes || null,
                created_by: user.id
            })
            .select()
            .single();

        if (error) throw error;

        // Vincular arquivos
        if (input.file_ids && input.file_ids.length > 0) {
            const inserts = input.file_ids.map(fid => ({ activity_id: activity.id, file_id: fid }));
            await supabase.from('ped_activity_files').insert(inserts);
        }

        revalidatePath(`${MODULE_PATH}/atividades`);
        return { success: true, data: activity as PedActivity };
    } catch (error: any) {
        console.error('createActivity Error:', error.message);
        return { success: false, message: error.message };
    }
}

// ============================================================
// ARQUIVOS & PASTAS
// ============================================================

export async function getFolders(): Promise<{ success: boolean; data?: PedFolder[]; message?: string }> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('ped_folders')
            .select('*')
            .order('school_year', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;
        return { success: true, data: data as PedFolder[] };
    } catch (error: any) {
        console.error('getFolders Error:', error.message);
        return { success: false, message: error.message };
    }
}

export async function createFolder(input: { name: string; school_year?: string; folder_type?: string }): Promise<{ success: boolean; data?: PedFolder; message?: string }> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('ped_folders')
            .insert({
                name: input.name,
                school_year: input.school_year || 'multi',
                folder_type: input.folder_type || 'materiais'
            })
            .select()
            .single();

        if (error) throw error;
        revalidatePath(`${MODULE_PATH}/arquivos`);
        return { success: true, data: data as PedFolder };
    } catch (error: any) {
        console.error('createFolder Error:', error.message);
        return { success: false, message: error.message };
    }
}

export async function getFilesInFolder(folderId: string): Promise<{ success: boolean; data?: PedFile[]; message?: string }> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('ped_files')
            .select('*')
            .eq('folder_id', folderId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data as PedFile[] };
    } catch (error: any) {
        console.error('getFilesInFolder Error:', error.message);
        return { success: false, message: error.message };
    }
}

export async function uploadPedFile(formData: FormData, folderId: string): Promise<{ success: boolean; data?: PedFile; message?: string }> {
    try {
        const supabase = await createClient();
        const file = formData.get('file') as File;
        if (!file || file.size === 0) throw new Error('Arquivo obrigatório');

        // Inferir tipo
        let fileType = 'doc';
        if (file.type.includes('pdf')) fileType = 'pdf';
        else if (file.type.includes('image')) fileType = 'image';

        // Upload para Google Drive (VAV SISTEMA > PEDAGOGIA > ARQUIVOS)
        const { getGoogleDriveClient } = await import('@/lib/google/drive');
        const drive = await getGoogleDriveClient();

        const ensureFolder = async (d: any, name: string, parentId?: string) => {
            const qp = [`mimeType='application/vnd.google-apps.folder'`, `name='${name}'`, `trashed=false`];
            if (parentId) qp.push(`'${parentId}' in parents`);
            const res = await d.files.list({ q: qp.join(' and '), spaces: 'drive', fields: 'files(id)' });
            if (res.data.files?.length > 0) return res.data.files[0].id!;
            const meta: any = { name, mimeType: 'application/vnd.google-apps.folder' };
            if (parentId) meta.parents = [parentId];
            const c = await d.files.create({ requestBody: meta, fields: 'id' });
            return c.data.id!;
        };

        const rootId = await ensureFolder(drive, 'VAV SISTEMA');
        const pedId = await ensureFolder(drive, 'PEDAGOGIA', rootId);
        const arqId = await ensureFolder(drive, 'ARQUIVOS', pedId);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const stream = require('stream');
        const bs = new stream.PassThrough();
        bs.end(buffer);

        const driveRes = await drive.files.create({
            requestBody: { name: file.name, parents: [arqId] },
            media: { mimeType: file.type, body: bs },
            fields: 'id, name, webViewLink'
        });

        const driveFile = driveRes.data;
        const fileUrl = driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`;

        // Salvar no banco
        const { data, error } = await supabase
            .from('ped_files')
            .insert({
                folder_id: folderId,
                name: file.name,
                file_url: fileUrl,
                drive_file_id: driveFile.id || null,
                file_type: fileType
            })
            .select()
            .single();

        if (error) throw error;
        revalidatePath(`${MODULE_PATH}/arquivos`);
        return { success: true, data: data as PedFile };
    } catch (error: any) {
        console.error('uploadPedFile Error:', error.message);
        return { success: false, message: error.message };
    }
}

export async function getAllFiles(): Promise<{ success: boolean; data?: PedFile[]; message?: string }> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('ped_files')
            .select('*, folder:folder_id(id, name, school_year)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data as PedFile[] };
    } catch (error: any) {
        console.error('getAllFiles Error:', error.message);
        return { success: false, message: error.message };
    }
}
