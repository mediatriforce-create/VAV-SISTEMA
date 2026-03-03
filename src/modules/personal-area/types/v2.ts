export interface CalendarEvent {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    event_date: string;
    created_at: string;
}

export interface CoordinationNote {
    id: string;
    target_user_id: string;
    author_id: string;
    content: string;
    created_at: string;
    author?: {
        full_name: string;
        avatar_url: string | null;
    };
}

export interface StandardResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}
