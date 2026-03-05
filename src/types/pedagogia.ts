// =========================================================================
// Tipos do Módulo Pedagogia V2
// =========================================================================

// Reutilizamos a interface Class existente do banco
export interface Class {
    id: string;
    name: string;
    year_group: string;
    school_year: number;
    shift: string;
    teacher_id: string | null;
    created_at: string;
    teacher?: { id: string; full_name: string; avatar_url: string | null };
    student_count?: number;
}

// ---- KANBAN ----

export type KanbanColumnStatus = 'backlog' | 'planejado' | 'andamento' | 'concluido';

export interface PedKanbanCard {
    id: string;
    column_status: KanbanColumnStatus;
    title: string;
    card_type: string | null;
    description: string | null;
    due_date: string | null;
    demand_id: string | null; // Se veio de uma demanda da Coordenação
    created_by: string | null;
    created_at: string;
    updated_at: string;
    // Joins
    classes?: Class[];
    creator?: { full_name: string };
}

// ---- ATIVIDADES DO DIA ----

export interface PedActivity {
    id: string;
    class_id: string;
    activity_date: string;
    title: string;
    description: string | null;
    notes: string | null;
    created_by: string | null;
    created_at: string;
    // Joins
    class_info?: Class;
    files?: PedFile[];
    creator?: { full_name: string };
}

// ---- ARQUIVOS ----

export interface PedFolder {
    id: string;
    name: string;
    school_year: string;
    folder_type: string;
    created_at: string;
    // Computed
    file_count?: number;
}

export interface PedFile {
    id: string;
    folder_id: string;
    name: string;
    file_url: string;
    drive_file_id: string | null;
    file_type: string;
    created_at: string;
    // Joins
    folder?: PedFolder;
}
