export interface CommunicationAsset {
    id: string;
    title: string;
    description: string | null;
    image_url: string;
    created_by: string;
    created_at: string;
    linked_demand_id: string | null;

    // Joins
    creator?: {
        full_name: string;
        avatar_url: string | null;
    };
}

export interface CommunicationFolder {
    id: string;
    name: string;
    parent_id: string | null;
    created_at: string;
    created_by: string;

    // Joins
    creator?: {
        full_name: string;
    };
}

export interface CommunicationFile {
    id: string;
    folder_id: string | null;
    file_url: string;
    name: string;
    size_bytes: number | null;
    mime_type: string | null;
    uploaded_by: string;
    created_at: string;

    // Joins
    uploader?: {
        full_name: string;
    };
}

// STAGE 5 UPDATES:
export type PostType = 'post' | 'story' | 'reel' | 'institutional';
export type YearCategory = '1_ANO' | '2_ANO' | '3_ANO' | 'PNAB';

export interface CommunicationPost {
    id: string;
    type: PostType;
    title: string;
    description: string | null;
    media_url: string;
    created_by: string;
    created_at: string;
    linked_demand_id: string | null;
    year_category: YearCategory | null;
    is_pnab: boolean;
    drive_file_id?: string | null;

    creator?: {
        full_name: string;
        avatar_url: string | null;
    };
}
