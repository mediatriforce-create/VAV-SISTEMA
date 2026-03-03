export interface Meeting {
    id: string;
    title: string;
    description: string | null;
    date: string; // Formato 'YYYY-MM-DD'
    start_time: string; // Formato 'HH:mm:ss'
    end_time: string; // Formato 'HH:mm:ss'
    meet_link: string | null;
    created_by: string;
    created_at: string;
}

export interface CreateMeetingPayload {
    title: string;
    description?: string;
    date: string;
    start_time: string; // Expected format: 'HH:mm' from HTML input, will append ':00'
    end_time: string; // Expected format: 'HH:mm'
}
