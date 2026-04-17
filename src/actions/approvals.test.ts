import { describe, it, expect, vi, beforeEach } from 'vitest'

// Capturadores para cada chain do supabase
const mockGetUser = vi.fn()
const mockProfileSingle = vi.fn()
const mockApprovalUpdate = vi.fn()
const mockApprovalUpdateEq = vi.fn()
const mockApprovalSelectSingle = vi.fn()
const mockDemandsUpdate = vi.fn()
const mockDemandsUpdateEq = vi.fn()
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
            if (table === 'approval_submissions') {
                return {
                    select: () => ({ eq: () => ({ single: mockApprovalSelectSingle }) }),
                    update: (...args: unknown[]) => {
                        mockApprovalUpdate(...args)
                        return { eq: mockApprovalUpdateEq }
                    },
                }
            }
            if (table === 'demands') {
                return {
                    update: (...args: unknown[]) => {
                        mockDemandsUpdate(...args)
                        return { eq: mockDemandsUpdateEq }
                    },
                }
            }
            return {}
        },
    }),
}))

import { reviewSubmission } from './approvals'

describe('reviewSubmission', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // defaults razoaveis
        mockApprovalUpdateEq.mockResolvedValue({ error: null })
        mockDemandsUpdateEq.mockResolvedValue({ error: null })
        mockApprovalSelectSingle.mockResolvedValue({ data: { demand_id: 'd-1' } })
    })

    it('falha se usuario nao autenticado', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })
        await expect(reviewSubmission('s-1', 'approved', '')).rejects.toThrow(/autenticado/i)
        expect(mockApprovalUpdate).not.toHaveBeenCalled()
    })

    it('falha se role do usuario nao tem permissao', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Educador' } })
        await expect(reviewSubmission('s-1', 'approved', 'ok')).rejects.toThrow(/permiss/i)
        expect(mockApprovalUpdate).not.toHaveBeenCalled()
    })

    it('aceita Coordenacao de Pedagogia', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Coordenação de Pedagogia' } })
        await expect(reviewSubmission('s-1', 'approved', 'ok')).resolves.toBeUndefined()
        expect(mockApprovalUpdate).toHaveBeenCalledTimes(1)
    })

    it('approved -> demand vai para "finalizado"', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Presidência' } })

        await reviewSubmission('s-1', 'approved', 'tudo ok')

        const submissionUpdate = mockApprovalUpdate.mock.calls[0][0]
        expect(submissionUpdate.status).toBe('approved')
        expect(submissionUpdate.reviewed_by).toBe('u1')
        expect(submissionUpdate.review_notes).toBe('tudo ok')
        expect(submissionUpdate.reviewed_at).toMatch(/\d{4}-\d{2}-\d{2}T/)

        expect(mockDemandsUpdate).toHaveBeenCalledWith({ status: 'finalizado' })
    })

    it('rejected -> demand volta para "revisao"', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Direção' } })

        await reviewSubmission('s-1', 'rejected', 'precisa ajustar')

        expect(mockDemandsUpdate).toHaveBeenCalledWith({ status: 'revisao' })
    })

    it('notes vazio vira null em review_notes', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Coordenadora ADM' } })

        await reviewSubmission('s-1', 'approved', '   ')

        expect(mockApprovalUpdate.mock.calls[0][0].review_notes).toBeNull()
    })

    it('nao atualiza demand quando submission nao tem demand_id', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Presidência' } })
        mockApprovalSelectSingle.mockResolvedValue({ data: { demand_id: null } })

        await reviewSubmission('s-1', 'approved', '')

        expect(mockDemandsUpdate).not.toHaveBeenCalled()
    })

    it('revalida paths apos aprovar', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Presidência' } })

        await reviewSubmission('s-1', 'approved', '')

        expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/aprovacoes')
        expect(mockRevalidatePath).toHaveBeenCalledWith('/comunicacao')
    })
})
