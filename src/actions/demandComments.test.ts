import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockProfileSingle = vi.fn()
const mockCommentsInsert = vi.fn()
const mockCommentsDeleteEq = vi.fn()
const mockCommentsSelectSingle = vi.fn()
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
            if (table === 'demand_comments') {
                return {
                    insert: mockCommentsInsert,
                    select: () => ({ eq: () => ({ single: mockCommentsSelectSingle }) }),
                    delete: () => ({ eq: mockCommentsDeleteEq }),
                }
            }
            return {}
        },
    }),
}))

import { createDemandComment, deleteDemandComment } from './demandComments'

describe('createDemandComment', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockCommentsInsert.mockResolvedValue({ error: null })
    })

    it('falha sem usuario', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })
        await expect(createDemandComment('d-1', 'oi')).rejects.toThrow(/autenticado/i)
        expect(mockCommentsInsert).not.toHaveBeenCalled()
    })

    it('cria comentario com author_id, demand_id e trim', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })

        await createDemandComment('d-1', '   meu comentario   ')

        expect(mockCommentsInsert).toHaveBeenCalledWith({
            demand_id: 'd-1',
            author_id: 'u-1',
            comment: 'meu comentario',
        })
        expect(mockRevalidatePath).toHaveBeenCalledWith('/comunicacao/kanban')
    })

    it('propaga erro do BD', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
        mockCommentsInsert.mockResolvedValue({ error: { message: 'boom' } })
        await expect(createDemandComment('d-1', 'oi')).rejects.toBeTruthy()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
})

describe('deleteDemandComment', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockCommentsDeleteEq.mockResolvedValue({ error: null })
    })

    it('falha sem usuario', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })
        await expect(deleteDemandComment('c-1')).rejects.toThrow(/autenticado/i)
        expect(mockCommentsDeleteEq).not.toHaveBeenCalled()
    })

    it('autor pode deletar o proprio comentario', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
        mockCommentsSelectSingle.mockResolvedValue({ data: { author_id: 'u-1' } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Educador' } })

        await deleteDemandComment('c-1')

        expect(mockCommentsDeleteEq).toHaveBeenCalledTimes(1)
        expect(mockRevalidatePath).toHaveBeenCalled()
    })

    it('lideranca (Presidencia) pode deletar comentario de outro', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-presi' } } })
        mockCommentsSelectSingle.mockResolvedValue({ data: { author_id: 'u-outro' } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Presidência' } })

        await deleteDemandComment('c-1')

        expect(mockCommentsDeleteEq).toHaveBeenCalledTimes(1)
    })

    it('lideranca (Direcao) pode deletar comentario de outro', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-dir' } } })
        mockCommentsSelectSingle.mockResolvedValue({ data: { author_id: 'u-outro' } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Direção' } })

        await deleteDemandComment('c-1')

        expect(mockCommentsDeleteEq).toHaveBeenCalledTimes(1)
    })

    it('usuario comum NAO pode deletar comentario de outro', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
        mockCommentsSelectSingle.mockResolvedValue({ data: { author_id: 'u-outro' } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Educador' } })

        await expect(deleteDemandComment('c-1')).rejects.toThrow(/permiss/i)
        expect(mockCommentsDeleteEq).not.toHaveBeenCalled()
    })

    it('Coordenadora ADM NAO eh lideranca aqui (so Presi/Direcao)', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-coord' } } })
        mockCommentsSelectSingle.mockResolvedValue({ data: { author_id: 'u-outro' } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Coordenadora ADM' } })

        await expect(deleteDemandComment('c-1')).rejects.toThrow(/permiss/i)
    })

    it('propaga erro do BD ao deletar', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
        mockCommentsSelectSingle.mockResolvedValue({ data: { author_id: 'u-1' } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Educador' } })
        mockCommentsDeleteEq.mockResolvedValue({ error: { message: 'fk violation' } })

        await expect(deleteDemandComment('c-1')).rejects.toBeTruthy()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
})
