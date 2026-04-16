// Whitelist de MIME types aceitos. Bloqueia executaveis, scripts e binarios
// suspeitos por padrao. Adicionar tipos aqui quando surgir caso de uso real.

export const ALLOWED_IMAGE_MIMES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
] as const

export const ALLOWED_VIDEO_MIMES = [
    'video/mp4', 'video/webm', 'video/quicktime',
] as const

export const ALLOWED_DOC_MIMES = [
    'application/pdf',
    'text/plain', 'text/csv', 'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/x-ofx',
    'application/zip',
] as const

export const ALLOWED_GENERIC_MIMES = [
    ...ALLOWED_IMAGE_MIMES,
    ...ALLOWED_VIDEO_MIMES,
    ...ALLOWED_DOC_MIMES,
] as const

// Limites em bytes (alinhar com next.config.ts serverActions.bodySizeLimit)
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export type ValidationResult =
    | { ok: true }
    | { ok: false; error: string }

export function validateUploadedFile(
    file: File,
    allowedMimes: readonly string[] = ALLOWED_GENERIC_MIMES,
    maxBytes: number = MAX_FILE_SIZE_BYTES,
): ValidationResult {
    if (!file || file.size === 0) {
        return { ok: false, error: 'Arquivo invalido ou vazio.' }
    }
    if (file.size > maxBytes) {
        const mb = (maxBytes / 1024 / 1024).toFixed(0)
        return { ok: false, error: `Arquivo excede ${mb} MB.` }
    }
    if (!allowedMimes.includes(file.type)) {
        return { ok: false, error: `Tipo de arquivo nao permitido (${file.type || 'desconhecido'}).` }
    }
    return { ok: true }
}
