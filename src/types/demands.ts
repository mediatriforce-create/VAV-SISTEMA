export type DemandSector = 'comunicacao' | 'pedagogia' | 'administracao';

export interface ApprovalSubmission {
    id: string;
    created_at: string;
    demand_id: string | null;
    ped_card_id: string | null;
    submitted_by: string | null;
    justification_text: string | null;
    file_urls: string[];
}
export type DemandPriority = 'baixa' | 'media' | 'alta';
export type DemandStatus = 'a_fazer' | 'em_andamento' | 'revisao' | 'aprovacao' | 'finalizado';

export interface Demand {
    id: string;
    created_at: string;
    created_by: string; // uuid
    assigned_to: string | null; // uuid
    sector: DemandSector;
    title: string;
    description: string | null;
    due_date: string | null;
    priority: DemandPriority;
    status: DemandStatus;
    order_index: number;
    is_archived: boolean;

    // Joins (optional, depending on query)
    assignee?: {
        full_name: string;
        avatar_url: string | null;
        role?: string;
    };
    creator?: {
        full_name: string;
        avatar_url: string | null;
    };
}

export interface DemandComment {
    id: string;
    demand_id: string;
    author_id: string;
    comment: string;
    created_at: string;
    author?: {
        full_name: string;
        avatar_url: string | null;
    };
}

export interface DemandActivityLog {
    id: string;
    demand_id: string;
    actor_id: string;
    action_type: string;
    payload: any;
    created_at: string;
    actor?: {
        full_name: string;
        avatar_url: string | null;
    };
}
