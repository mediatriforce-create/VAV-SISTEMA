import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockMuralInsert = vi.fn()
const mockMuralDeleteEq = vi.fn()
const mockMuralUpdate = vi.fn()
const mockMuralUpdateEq = vi.fn()
const mockRevalidatePath = vi.fn()

vi.mock('next/cache', () => ({
    revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

vi.mock('@/lib/supabase/server', () => ({
    createClient: async () => ({
        auth: { getUser: mockGetUser },
        from: (table: string) => {
            if (table === 'mural_posts') {
                return {
                    insert: mockMuralInsert,
                    delete: () => ({ eq: mockMuralDeleteEq }),
                    update: (...args: unknown[]) => {
                        mockMuralUpdate(...args)
                        return { eq: mockMuralUpdateEq }
                    },
                }
            }
            return {}
        },
    }),
}))

import { createMuralPost, deleteMuralPost, toggleMuralPin } from './mural'

describe('createMuralPost', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockMuralInsert.mockResolvedValue({ error: null })
    })

    it('falha sem usuario', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })
        await expect(createMuralPost('t', 'c', 'aviso', false)).rejects.toThrow(/autenticado/i)
        expect(mockMuralInsert).not.toHaveBeenCalled()
    })

    it('insere post com author_id e revalida', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })

        await createMuralPost('Titulo', 'Conteudo', 'aviso', true)

        expect(mockMuralInsert).toHaveBeenCalledWith({
            title: 'Titulo',
            content: 'Conteudo',
            category: 'aviso',
            pinned: true,
            author_id: 'u-1',
        })
        expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/mural')
    })

    it('content vazio vira null', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
        await createMuralPost('T', '', 'aviso', false)
        expect(mockMuralInsert.mock.calls[0][0].content).toBeNull()
    })

    it('propaga erro do BD', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
        mockMuralInsert.mockResolvedValue({ error: new Error('boom') })
        await expect(createMuralPost('t', 'c', 'aviso', false)).rejects.toBeTruthy()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
})

describe('deleteMuralPost', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockMuralDeleteEq.mockResolvedValue({ error: null })
    })

    it('deleta e revalida', async () => {
        await deleteMuralPost('p-1')
        expect(mockMuralDeleteEq).toHaveBeenCalledTimes(1)
        expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/mural')
    })

    it('propaga erro do BD', async () => {
        mockMuralDeleteEq.mockResolvedValue({ error: new Error('rls') })
        await expect(deleteMuralPost('p-1')).rejects.toBeTruthy()
        expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
})

describe('toggleMuralPin', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockMuralUpdateEq.mockResolvedValue({ error: null })
    })

    it('inverte o pinned (true -> false)', async () => {
        await toggleMuralPin('p-1', true)
        expect(mockMuralUpdate).toHaveBeenCalledWith({ pinned: false })
    })

    it('inverte o pinned (false -> true)', async () => {
        await toggleMuralPin('p-1', false)
        expect(mockMuralUpdate).toHaveBeenCalledWith({ pinned: true })
    })

    it('revalida apos sucesso', async () => {
        await toggleMuralPin('p-1', false)
        expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/mural')
    })
})
