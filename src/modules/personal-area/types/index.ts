export type DocumentCategory = 'payslip' | 'contract' | 'id_card' | 'other';

export interface PersonalDocument {
    id: string;
    user_id: string;
    title: string;
    category: DocumentCategory;
    storage_path: string;
    created_at: string;
}

export interface DocumentUploadResponse {
    success: boolean;
    message?: string;
    document?: PersonalDocument;
}

export interface DocumentListResponse {
    success: boolean;
    message?: string;
    data?: PersonalDocument[];
}

export interface SignedUrlResponse {
    success: boolean;
    message?: string;
    signedUrl?: string;
}
