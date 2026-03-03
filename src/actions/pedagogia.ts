'use server';

import { createClient } from '@/lib/supabase/server';
import type { Class, Student, LessonSession, AttendanceRecord, Subject, AttendanceStatus } from '@/types/pedagogia';

// ============================================================
// TURMAS
// ============================================================

export async function getMyClasses(): Promise<{ success: boolean; data?: Class[]; message?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autorizado');

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        const isCoord = ['Coord. Geral', 'Presidente', 'Dir. Financeiro', 'Coord. Pedagógica'].includes(profile?.role || '');

        let query = supabase
            .from('classes')
            .select(`
                *,
                teacher:teacher_id (id, full_name, avatar_url)
            `)
            .order('year_group', { ascending: true })
            .order('name', { ascending: true });

        // TRAVA TEMPORARIAMENTE DESATIVADA PARA TESTE: 
        // Mostrar todas as turmas para qualquer usuário, pra podermos testar o fluxo.
        // if (!isCoord) {
        //     query = query.eq('teacher_id', user.id);
        // }

        const { data, error } = await query;
        if (error) throw error;

        // Contar alunos por turma
        const classIds = (data || []).map((c: any) => c.id);
        const { data: counts } = await supabase
            .from('class_memberships')
            .select('class_id')
            .in('class_id', classIds)
            .eq('status', 'active');

        const countMap: Record<string, number> = {};
        (counts || []).forEach((c: any) => {
            countMap[c.class_id] = (countMap[c.class_id] || 0) + 1;
        });

        const enriched = (data || []).map((c: any) => ({
            ...c,
            student_count: countMap[c.id] || 0,
        }));

        return { success: true, data: enriched as Class[] };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function getClassById(classId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('classes')
            .select(`
                *,
                teacher:teacher_id (id, full_name, avatar_url)
            `)
            .eq('id', classId)
            .single();

        if (error) throw error;

        // Buscar alunos matriculados
        const { data: memberships } = await supabase
            .from('class_memberships')
            .select(`
                *,
                student:student_id (*)
            `)
            .eq('class_id', classId)
            .eq('status', 'active')
            .order('enrolled_at', { ascending: true });

        return {
            success: true,
            data: {
                ...data,
                memberships: memberships || [],
                student_count: memberships?.length || 0,
            }
        };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function createClass(input: {
    name: string;
    year_group: string;
    school_year: number;
    shift: string;
    teacher_id: string | null;
}): Promise<{ success: boolean; data?: Class; message?: string }> {
    try {
        console.log('[createClass] INICIANDO...', input);
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error('[createClass] Usuário não logado ou erro de sessão:', userError);
            throw new Error('Não autorizado ou sessão expirada.');
        }

        console.log('[createClass] INSERINDO NO BANCO...');
        const { data, error } = await supabase
            .from('classes')
            .insert(input)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data: data as Class };
    } catch (e: any) {
        console.error('ERRO EM createClass:', e);
        return { success: false, message: e.message };
    }
}

export async function updateClass(classId: string, input: Partial<{
    name: string;
    year_group: string;
    shift: string;
    teacher_id: string | null;
}>): Promise<{ success: boolean; message?: string }> {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('classes')
            .update(input)
            .eq('id', classId);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

// ============================================================
// ALUNOS
// ============================================================

export async function createStudent(input: {
    full_name: string;
    birth_date?: string;
    guardian_name?: string;
    guardian_phone?: string;
    guardian_email?: string;
    notes?: string;
}): Promise<{ success: boolean; data?: Student; message?: string }> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('students')
            .insert(input)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data: data as Student };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function getAllStudents(): Promise<{ success: boolean; data?: Student[]; message?: string }> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('active', true)
            .order('full_name', { ascending: true });

        if (error) throw error;
        return { success: true, data: data as Student[] };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function enrollStudent(classId: string, studentId: string): Promise<{ success: boolean; message?: string }> {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('class_memberships')
            .upsert({
                class_id: classId,
                student_id: studentId,
                status: 'active',
            }, { onConflict: 'class_id,student_id' });

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function removeStudentFromClass(classId: string, studentId: string): Promise<{ success: boolean; message?: string }> {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('class_memberships')
            .delete()
            .eq('class_id', classId)
            .eq('student_id', studentId);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

// ============================================================
// COMPONENTES CURRICULARES
// ============================================================

export async function getSubjects(): Promise<{ success: boolean; data?: Subject[]; message?: string }> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return { success: true, data: data as Subject[] };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

// ============================================================
// SESSÕES DE AULA (DIÁRIO)
// ============================================================

export async function createOrUpdateSession(input: {
    class_id: string;
    subject_id?: string | null;
    date: string;
    content_summary?: string;
    bncc_skills?: string;
    observations?: string;
}): Promise<{ success: boolean; data?: LessonSession; message?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autorizado');

        // Verifica se já existe sessão para essa turma/data/componente
        const { data: existing } = await supabase
            .from('lesson_sessions')
            .select('id')
            .eq('class_id', input.class_id)
            .eq('date', input.date)
            .eq('subject_id', input.subject_id || '')
            .maybeSingle();

        if (existing) {
            const { data, error } = await supabase
                .from('lesson_sessions')
                .update({
                    content_summary: input.content_summary,
                    bncc_skills: input.bncc_skills,
                    observations: input.observations,
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data: data as LessonSession };
        }

        const { data, error } = await supabase
            .from('lesson_sessions')
            .insert({
                ...input,
                teacher_id: user.id,
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, data: data as LessonSession };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function getSessionByClassAndDate(
    classId: string,
    date: string
): Promise<{ success: boolean; data?: LessonSession; message?: string }> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('lesson_sessions')
            .select(`
                *,
                subject:subject_id (id, name),
                attendance_records (
                    id, student_id, status, note,
                    student:student_id (id, full_name, photo_url)
                )
            `)
            .eq('class_id', classId)
            .eq('date', date)
            .maybeSingle();

        if (error) throw error;
        return { success: true, data: data as LessonSession | undefined };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function getSessionsByClassMonth(
    classId: string,
    year: number,
    month: number
): Promise<{ success: boolean; data?: LessonSession[]; message?: string }> {
    try {
        const supabase = await createClient();
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

        const { data, error } = await supabase
            .from('lesson_sessions')
            .select('id, date, content_summary, subject:subject_id (name)')
            .eq('class_id', classId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        if (error) throw error;
        return { success: true, data: data as any[] };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

// ============================================================
// FREQUÊNCIA
// ============================================================

export async function saveAttendance(
    sessionId: string,
    records: { student_id: string; status: AttendanceStatus; note?: string }[]
): Promise<{ success: boolean; message?: string }> {
    try {
        const supabase = await createClient();

        const upsertData = records.map(r => ({
            session_id: sessionId,
            student_id: r.student_id,
            status: r.status,
            note: r.note || null,
        }));

        const { error } = await supabase
            .from('attendance_records')
            .upsert(upsertData, { onConflict: 'session_id,student_id' });

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

// ============================================================
// DASHBOARD STATS
// ============================================================

export async function getPedagogiaStats(): Promise<{
    success: boolean;
    data?: {
        totalClasses: number;
        totalStudents: number;
        todaySessions: number;
        pendingDiaries: number;
    };
    message?: string;
}> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autorizado');

        const today = new Date().toISOString().split('T')[0];

        // Total de turmas
        const { count: totalClasses } = await supabase
            .from('classes')
            .select('*', { count: 'exact', head: true });

        // Total de alunos ativos
        const { count: totalStudents } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('active', true);

        // Sessões de hoje
        const { count: todaySessions } = await supabase
            .from('lesson_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('date', today);

        // Turmas sem diário hoje (pendências)
        const myClasses = await supabase
            .from('classes')
            .select('id')
            .eq('teacher_id', user.id);

        const myClassIds = (myClasses.data || []).map((c: any) => c.id);

        const { data: todaysSessionIds } = await supabase
            .from('lesson_sessions')
            .select('class_id')
            .eq('date', today)
            .in('class_id', myClassIds.length > 0 ? myClassIds : ['_none_']);

        const sessionsToday = new Set((todaysSessionIds || []).map((s: any) => s.class_id));
        const pendingDiaries = myClassIds.filter(id => !sessionsToday.has(id)).length;

        return {
            success: true,
            data: {
                totalClasses: totalClasses || 0,
                totalStudents: totalStudents || 0,
                todaySessions: todaySessions || 0,
                pendingDiaries,
            }
        };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

// ============================================================
// PROFESSORES (para selectors)
// ============================================================

export async function getTeachers(): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role')
            .in('role', ['Educadora', 'Estágio Pedagógico', 'Coord. Pedagógica', 'Coord. Geral'])
            .order('full_name', { ascending: true });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
