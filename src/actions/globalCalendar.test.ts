import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockProfileSingle = vi.fn()
const mockEventSelectSingle = vi.fn()
const mockEventInsertSingle = vi.fn()
const mockEventDeleteEq = vi.fn()
const mockStorageUpload = vi.fn()
const mockGetPublicUrl = vi.fn()
const mockRevalidatePath = vi.fn()

vi.mock('next/cache', () => ({
    revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

vi.mock('@/lib/supabase/server', () => ({
    createClient: async () => ({
        auth: { getUser: mockGetUser },
        from: (table: string) => {
            if (table === 'profiles') {
                return {
                    select: () => ({ eq: () => ({ single: mockProfileSingle }) }),
                }
            }
            if (table === 'global_calendar_events') {
                return {
                    select: () => ({ eq: () => ({ single: mockEventSelectSingle }) }),
                    insert: () => ({
                        select: () => ({ single: mockEventInsertSingle }),
                    }),
                    delete: () => ({ eq: mockEventDeleteEq }),
                }
            }
            return {}
        },
        storage: {
            from: () => ({
                upload: mockStorageUpload,
                getPublicUrl: mockGetPublicUrl,
            }),
        },
    }),
}))

import { createGlobalEvent, deleteGlobalEvent } from './globalCalendar'

function buildForm(overrides: Record<string, string | File> = {}): FormData {
    const f = new FormData()
    f.append('title', 'Reuniao Geral')
    f.append('description', 'desc')
    f.append('event_date', '2026-05-01')
    for (const [k, v] of Object.entries(overrides)) {
        if (v instanceof File) f.append(k, v)
        else {
            f.delete(k)
            f.append(k, v)
        }
    }
    return f
}

describe('createGlobalEvent', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockEventInsertSingle.mockResolvedValue({ data: { id: 'e-1' }, error: null })
    })

    it('falha sem usuario', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })
        const res = await createGlobalEvent(buildForm())
        expect(res.success).toBe(false)
        expect(res.message).toMatch(/acesso negado/i)
    })

    it('exige titulo e data', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
        const res = await createGlobalEvent(buildForm({ title: '   ' }))
        expect(res.success).toBe(false)
        expect(res.message).toMatch(/obrigat/i)
    })

    it('cria evento sem imagem com trim de title', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })

        const res = await createGlobalEvent(buildForm({ title: '  Workshop  ' }))

        expect(res.success).toBe(true)
        expect(mockStorageUpload).not.toHaveBeenCalled()
        expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/calendario')
    })

    it('faz upload da imagem e usa publicUrl quando ha imagem', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
        mockStorageUpload.mockResolvedValue({ error: null })
        mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn/img.png' } })

        const file = new File([new Uint8Array(10)], 'img.png', { type: 'image/png' })
        const res = await createGlobalEvent(buildForm({ image_file: file }))

        expect(res.success).toBe(true)
        expect(mockStorageUpload).toHaveBeenCalledTimes(1)
        expect(mockGetPublicUrl).toHaveBeenCalledTimes(1)
    })

    it('falha quando upload da imagem falha', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
        mockStorageUpload.mockResolvedValue({ error: new Error('quota') })

        const file = new File([new Uint8Array(10)], 'img.png', { type: 'image/png' })
        const res = await createGlobalEvent(buildForm({ image_file: file }))

        expect(res.success).toBe(false)
        expect(res.message).toMatch(/storage|imagem/i)
    })
})

describe('deleteGlobalEvent', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockEventDeleteEq.mockResolvedValue({ error: null })
    })

    it('falha sem usuario', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })
        const res = await deleteGlobalEvent('e-1')
        expect(res.success).toBe(false)
    })

    it('owner pode apagar o proprio evento', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
        mockEventSelectSingle.mockResolvedValue({ data: { created_by: 'u-1' }, error: null })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Educador' } })

        const res = await deleteGlobalEvent('e-1')
        expect(res.success).toBe(true)
        expect(mockEventDeleteEq).toHaveBeenCalledTimes(1)
        expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/calendario')
    })

    it('lideranca pode apagar evento de outro (Coordenadora ADM)', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-coord' } } })
        mockEventSelectSingle.mockResolvedValue({ data: { created_by: 'u-outro' }, error: null })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Coordenadora ADM' } })

        const res = await deleteGlobalEvent('e-1')
        expect(res.success).toBe(true)
    })

    it('lideranca pode apagar evento de outro (Direcao)', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-dir' } } })
        mockEventSelectSingle.mockResolvedValue({ data: { created_by: 'u-outro' }, error: null })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Direção' } })

        const res = await deleteGlobalEvent('e-1')
        expect(res.success).toBe(true)
    })

    it('usuario comum NAO pode apagar evento de outro', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
        mockEventSelectSingle.mockResolvedValue({ data: { created_by: 'u-outro' }, error: null })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Educador' } })

        const res = await deleteGlobalEvent('e-1')
        expect(res.success).toBe(false)
        expect(res.message).toMatch(/proprios|seus/i)
        expect(mockEventDeleteEq).not.toHaveBeenCalled()
    })

    it('falha quando evento nao existe', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
        mockEventSelectSingle.mockResolvedValue({ data: null, error: new Error('not found') })

        const res = await deleteGlobalEvent('e-x')
        expect(res.success).toBe(false)
        expect(res.message).toMatch(/encontrado/i)
    })
})
