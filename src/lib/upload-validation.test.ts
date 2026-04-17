import { describe, it, expect } from 'vitest'
import {
    validateUploadedFile,
    ALLOWED_IMAGE_MIMES,
    ALLOWED_DOC_MIMES,
    MAX_FILE_SIZE_BYTES,
} from './upload-validation'

function makeFile(opts: { type: string; size: number; name?: string }): File {
    const bytes = new Uint8Array(opts.size)
    return new File([bytes], opts.name ?? 'sample.bin', { type: opts.type })
}

describe('validateUploadedFile', () => {
    it('aceita imagem PNG dentro do limite', () => {
        const file = makeFile({ type: 'image/png', size: 1024 })
        expect(validateUploadedFile(file)).toEqual({ ok: true })
    })

    it('aceita PDF dentro do limite', () => {
        const file = makeFile({ type: 'application/pdf', size: 5 * 1024 * 1024 })
        expect(validateUploadedFile(file)).toEqual({ ok: true })
    })

    it('rejeita arquivo vazio', () => {
        const file = makeFile({ type: 'image/png', size: 0 })
        const result = validateUploadedFile(file)
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error).toMatch(/invalido|vazio/i)
    })

    it('rejeita arquivo acima do limite', () => {
        const file = makeFile({ type: 'image/png', size: MAX_FILE_SIZE_BYTES + 1 })
        const result = validateUploadedFile(file)
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error).toMatch(/excede/i)
    })

    it('rejeita executavel (.exe disfarcado)', () => {
        const file = makeFile({
            type: 'application/x-msdownload',
            size: 1024,
            name: 'malware.exe',
        })
        const result = validateUploadedFile(file)
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error).toMatch(/nao permitido/i)
    })

    it('rejeita arquivo sem MIME type definido', () => {
        const file = makeFile({ type: '', size: 1024 })
        const result = validateUploadedFile(file)
        expect(result.ok).toBe(false)
    })

    it('respeita whitelist customizada (ex: so imagens)', () => {
        const pdf = makeFile({ type: 'application/pdf', size: 1024 })
        const png = makeFile({ type: 'image/png', size: 1024 })
        expect(validateUploadedFile(pdf, ALLOWED_IMAGE_MIMES).ok).toBe(false)
        expect(validateUploadedFile(png, ALLOWED_IMAGE_MIMES).ok).toBe(true)
    })

    it('respeita limite customizado de tamanho', () => {
        const file = makeFile({ type: 'image/png', size: 2048 })
        const result = validateUploadedFile(file, ALLOWED_IMAGE_MIMES, 1024)
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error).toMatch(/excede/i)
    })

    it('aceita combinacao de imagens + docs (caso recibo financeiro)', () => {
        const recibos = [...ALLOWED_IMAGE_MIMES, ...ALLOWED_DOC_MIMES]
        for (const mime of recibos) {
            const file = makeFile({ type: mime, size: 1024 })
            expect(validateUploadedFile(file, recibos).ok).toBe(true)
        }
    })
})
