// =========================================================================
// Tipos do Módulo Pedagogia
// =========================================================================

export interface Class {
    id: string;
    name: string;           // "1º Ano A"
    year_group: string;     // "1º Ano"
    school_year: number;    // 2026
    shift: string;          // "Manhã" | "Tarde" | "Integral"
    teacher_id: string | null;
    created_at: string;
    // Joins opcionais
    teacher?: { id: string; full_name: string; avatar_url: string | null };
    student_count?: number;
}

export interface Student {
    id: string;
    full_name: string;
    birth_date: string | null;
    guardian_name: string | null;
    guardian_phone: string | null;
    guardian_email: string | null;
    photo_url: string | null;
    notes: string | null;
    active: boolean;
    created_at: string;
}

export interface ClassMembership {
    id: string;
    class_id: string;
    student_id: string;
    enrolled_at: string;
    status: 'active' | 'transferred' | 'inactive';
    // Joins
    student?: Student;
}

export interface Subject {
    id: string;
    name: string;
    description: string | null;
}

export interface LessonSession {
    id: string;
    class_id: string;
    subject_id: string | null;
    teacher_id: string;
    date: string;
    content_summary: string | null;
    bncc_skills: string | null;
    observations: string | null;
    attachments: any[];
    created_at: string;
    // Joins
    subject?: Subject;
    teacher?: { id: string; full_name: string; avatar_url: string | null };
    attendance_records?: AttendanceRecord[];
}

export interface AttendanceRecord {
    id: string;
    session_id: string;
    student_id: string;
    status: 'present' | 'absent' | 'late';
    note: string | null;
    // Joins
    student?: Student;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

// =========================================================================
// Fase 2 - Tipos do Planejamento e Atividades
// =========================================================================

export interface BnccSkill {
    id: string;
    code: string;
    description: string;
    subject_id: string | null;
    year_group: string;
    created_at: string;
    // Join
    subject?: Subject;
}

export interface ActivityAsset {
    id: string;
    activity_id: string;
    file_name: string;
    file_url: string;
    drive_file_id: string | null;
    created_at: string;
}

export type ActivityType = 'Documento' | 'PDF' | 'Link' | 'Quiz' | 'Video' | 'Texto';

export interface EducationalActivity {
    id: string;
    title: string;
    description: string | null;
    activity_type: ActivityType;
    subject_id: string | null;
    teacher_id: string | null;
    is_public: boolean;
    created_at: string;
    // Joins
    subject?: Subject;
    teacher?: { id: string; full_name: string };
    assets?: ActivityAsset[];
}

export interface LessonPlan {
    id: string;
    class_id: string;
    subject_id: string | null;
    teacher_id: string | null;
    target_date: string;
    theme: string;
    objectives: string | null;
    methodology: string | null;
    status: 'Rascunho' | 'Publicado';
    created_at: string;
    updated_at: string;
    // Joins
    class_info?: Class;
    subject?: Subject;
    teacher?: { id: string; full_name: string };
    bncc_skills?: BnccSkill[];
    activities?: EducationalActivity[];
}
