'use server';

import { createClient } from '@/lib/supabase/server';
import type { LessonPlan, BnccSkill, EducationalActivity } from '@/types/pedagogia';
import { revalidatePath } from 'next/cache';

const MODULE_PATH = '/dashboard/pedagogia';

// ============================================================================
// HABILIDADES BNCC
// ============================================================================

export async function getBnccSkills(subjectId?: string, yearGroup?: string): Promise<{ success: boolean; data?: BnccSkill[]; message?: string }> {
    try {
        const supabase = await createClient();
        let query = supabase.from('bncc_skills').select('*, subject:subject_id(name)');

        if (subjectId) query = query.eq('subject_id', subjectId);
        if (yearGroup) query = query.ilike('year_group', `%${yearGroup}%`);

        const { data, error } = await query.order('code', { ascending: true });
        if (error) throw error;

        return { success: true, data: data as BnccSkill[] };
    } catch (error: any) {
        console.error('getBnccSkills Error:', error.message);
        return { success: false, message: error.message };
    }
}

// ============================================================================
// PLANO DE AULA
// ============================================================================

export async function getLessonPlans(classId: string): Promise<{ success: boolean; data?: LessonPlan[]; message?: string }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('lesson_plans')
            .select(`
                *,
                subject:subject_id(name),
                teacher:teacher_id(full_name),
                bncc_skills:plan_skills(
                    skill_id,
                    bncc_skills(*)
                ),
                activities:plan_activities(
                    activity_id,
                    activities(*)
                )
            `)
            .eq('class_id', classId)
            .order('target_date', { ascending: false });

        if (error) throw error;

        // Flatten the many-to-many results for easier frontend consumption
        const formattedData = data.map((plan: any) => ({
            ...plan,
            bncc_skills: plan.bncc_skills?.map((ps: any) => ps.bncc_skills).filter(Boolean) || [],
            activities: plan.activities?.map((pa: any) => pa.activities).filter(Boolean) || [],
        }));

        return { success: true, data: formattedData as LessonPlan[] };
    } catch (error: any) {
        console.error('getLessonPlans Error:', error.message);
        return { success: false, message: error.message };
    }
}

export async function getLessonPlanById(planId: string): Promise<{ success: boolean; data?: LessonPlan; message?: string }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('lesson_plans')
            .select(`
                *,
                subject:subject_id(name),
                teacher:teacher_id(full_name),
                class_info:class_id(id, name, shift),
                bncc_skills:plan_skills(
                    skill_id,
                    bncc_skills(*)
                ),
                activities:plan_activities(
                    activity_id,
                    activities(*)
                )
            `)
            .eq('id', planId)
            .single();

        if (error) throw error;

        const formattedData = {
            ...data,
            bncc_skills: data.bncc_skills?.map((ps: any) => ps.bncc_skills).filter(Boolean) || [],
            activities: data.activities?.map((pa: any) => pa.activities).filter(Boolean) || [],
        };

        return { success: true, data: formattedData as LessonPlan };
    } catch (error: any) {
        console.error('getLessonPlanById Error:', error.message);
        return { success: false, message: error.message };
    }
}

export async function createLessonPlan(input: {
    class_id: string;
    subject_id?: string | null;
    target_date: string;
    theme: string;
    objectives?: string | null;
    methodology?: string | null;
    status?: 'Rascunho' | 'Publicado';
    skill_ids?: string[]; // Arrays for many-to-many 
    activity_ids?: string[];
}): Promise<{ success: boolean; data?: LessonPlan; message?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) throw new Error('Não autorizado.');

        // 1. Inserir o plano
        const { data: plan, error: planError } = await supabase
            .from('lesson_plans')
            .insert({
                class_id: input.class_id,
                subject_id: input.subject_id || null,
                teacher_id: user.id,
                target_date: input.target_date,
                theme: input.theme,
                objectives: input.objectives || null,
                methodology: input.methodology || null,
                status: input.status || 'Rascunho'
            })
            .select()
            .single();

        if (planError) throw planError;

        // 2. Inserir habilidades vinculadas (se houver)
        if (input.skill_ids && input.skill_ids.length > 0) {
            const skillInserts = input.skill_ids.map(id => ({ plan_id: plan.id, skill_id: id }));
            const { error: skillsError } = await supabase.from('plan_skills').insert(skillInserts);
            if (skillsError) console.error('Erro ao vincular habilidades:', skillsError);
        }

        // 3. Inserir atividades vinculadas (se houver)
        if (input.activity_ids && input.activity_ids.length > 0) {
            const activityInserts = input.activity_ids.map(id => ({ plan_id: plan.id, activity_id: id }));
            const { error: activitiesError } = await supabase.from('plan_activities').insert(activityInserts);
            if (activitiesError) console.error('Erro ao vincular atividades:', activitiesError);
        }

        revalidatePath(`${MODULE_PATH}/turmas/${input.class_id}`);
        return { success: true, data: plan as LessonPlan };
    } catch (error: any) {
        console.error('createLessonPlan Error:', error.message);
        return { success: false, message: error.message };
    }
}

// ============================================================================
// BANCO DE ATIVIDADES
// ============================================================================

export async function getEducationalActivities(subjectId?: string): Promise<{ success: boolean; data?: EducationalActivity[]; message?: string }> {
    try {
        const supabase = await createClient();
        let query = supabase.from('activities').select(`
            *,
            subject:subject_id(name),
            teacher:teacher_id(full_name),
            assets:activity_assets(*)
        `);

        if (subjectId) query = query.eq('subject_id', subjectId);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        return { success: true, data: data as EducationalActivity[] };
    } catch (error: any) {
        console.error('getEducationalActivities Error:', error.message);
        return { success: false, message: error.message };
    }
}

export async function uploadEducationalActivity(formData: FormData): Promise<{ success: boolean; data?: EducationalActivity; message?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('Não autorizado');

        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const subjectId = formData.get('subject_id') as string;
        const file = formData.get('file') as File;

        if (!title || !file || file.size === 0) throw new Error('Título e arquivo são obrigatórios');

        // Inferir o tipo do arquivo
        let activityType = 'Documento';
        if (file.type.includes('pdf')) activityType = 'PDF';
        else if (file.type.includes('image')) activityType = 'Imagem';
        else if (file.type.includes('word') || file.type.includes('doc')) activityType = 'Texto';

        // 1. Upload do Arquivo para Google Drive (VAV SISTEMA > PEDAGOGIA > ATIVIDADES)
        const { getGoogleDriveClient } = await import('@/lib/google/drive');
        const drive = await getGoogleDriveClient();

        // Garantir estrutura de pastas no Drive
        const rootId = await ensureDriveFolder(drive, 'VAV SISTEMA');
        const pedId = await ensureDriveFolder(drive, 'PEDAGOGIA', rootId);
        const actFolderId = await ensureDriveFolder(drive, 'ATIVIDADES', pedId);

        // Converter File para Buffer e fazer upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const stream = require('stream');
        const bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);

        const driveResponse = await drive.files.create({
            requestBody: {
                name: file.name,
                parents: [actFolderId],
            },
            media: {
                mimeType: file.type,
                body: bufferStream,
            },
            fields: 'id, name, webViewLink'
        });

        const driveFile = driveResponse.data;
        const fileUrl = driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`;

        // 2. Criar a Atividade no banco Supabase
        const { data: activityData, error: activityError } = await supabase
            .from('activities')
            .insert({
                title,
                description: description || null,
                activity_type: activityType,
                subject_id: subjectId || null,
                teacher_id: user.id,
                is_public: true
            })
            .select()
            .single();

        if (activityError) throw activityError;

        // 3. Criar o Asset vinculado (com referência ao Drive)
        const { error: assetError } = await supabase
            .from('activity_assets')
            .insert({
                activity_id: activityData.id,
                file_name: file.name,
                file_url: fileUrl,
                drive_file_id: driveFile.id || null
            });

        if (assetError) throw assetError;

        revalidatePath(`${MODULE_PATH}/atividades`);
        return { success: true, data: activityData as EducationalActivity };
    } catch (error: any) {
        console.error('uploadEducationalActivity Error:', error.message);
        return { success: false, message: error.message };
    }
}

// Helper: Garante que uma pasta existe no Drive (mesma lógica do módulo de Comunicação)
async function ensureDriveFolder(drive: any, folderName: string, parentId?: string): Promise<string> {
    const queryParts = [
        `mimeType='application/vnd.google-apps.folder'`,
        `name='${folderName}'`,
        `trashed=false`
    ];
    if (parentId) queryParts.push(`'${parentId}' in parents`);

    const res = await drive.files.list({
        q: queryParts.join(' and '),
        spaces: 'drive',
        fields: 'files(id, name)',
    });

    if (res.data.files && res.data.files.length > 0) {
        return res.data.files[0].id!;
    }

    const fileMetadata: any = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentId) fileMetadata.parents = [parentId];

    const created = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
    });

    return created.data.id!;
}
