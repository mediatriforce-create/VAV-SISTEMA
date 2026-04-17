import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocks (devem ser definidos ANTES do import do modulo testado)
const mockGetUser = vi.fn()
const mockProfileSingle = vi.fn()
const mockEntriesInsert = vi.fn()
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
            if (table === 'financial_entries') {
                return { insert: mockEntriesInsert }
            }
            return {}
        },
    }),
}))

import { createFinancialEntry } from './actions'

function buildForm(overrides: Partial<Record<string, string>> = {}): FormData {
    const f = new FormData()
    const defaults = {
        bank_id: 'bank-1',
        type: 'saida',
        description: 'Compra teste',
        category: 'Material',
        amount: '150.50',
        entry_date: '2026-04-15',
    }
    for (const [k, v] of Object.entries({ ...defaults, ...overrides })) {
        if (v !== undefined) f.append(k, v as string)
    }
    return f
}

describe('createFinancialEntry', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('rejeita usuario nao autenticado', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })
        const result = await createFinancialEntry(buildForm())
        expect(result).toEqual({ error: 'Permissão negada.' })
        expect(mockEntriesInsert).not.toHaveBeenCalled()
    })

    it('rejeita usuario com role nao autorizada', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Educador' } })

        const result = await createFinancialEntry(buildForm())
        expect(result).toEqual({ error: 'Permissão negada.' })
        expect(mockEntriesInsert).not.toHaveBeenCalled()
    })

    it('aceita Coordenadora ADM', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Coordenadora ADM' } })
        mockEntriesInsert.mockResolvedValue({ error: null })

        const result = await createFinancialEntry(buildForm())
        expect(result).toEqual({ success: true })
        expect(mockEntriesInsert).toHaveBeenCalledTimes(1)
        expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/admin')
    })

    it('aceita Estagiario(a) de ADM', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Estagiário(a) de ADM' } })
        mockEntriesInsert.mockResolvedValue({ error: null })

        const result = await createFinancialEntry(buildForm())
        expect(result).toEqual({ success: true })
    })

    it('rejeita quando campo obrigatorio falta', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Presidência' } })

        const form = buildForm()
        form.delete('description')
        const result = await createFinancialEntry(form)

        expect(result).toEqual({ error: 'Campos obrigatórios faltando.' })
        expect(mockEntriesInsert).not.toHaveBeenCalled()
    })

    it('propaga erro do banco de dados', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Direção' } })
        mockEntriesInsert.mockResolvedValue({ error: { message: 'duplicate key' } })

        const result = await createFinancialEntry(buildForm())
        expect(result).toEqual({ error: 'Erro ao criar lançamento.' })
        expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it('insere com amount parseado e responsible_id null quando ausente', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'Presidência' } })
        mockEntriesInsert.mockResolvedValue({ error: null })

        await createFinancialEntry(buildForm({ amount: '999.99' }))

        const insertCall = mockEntriesInsert.mock.calls[0][0]
        expect(insertCall.amount).toBe(999.99)
        expect(insertCall.responsible_id).toBeNull()
        expect(insertCall.attachment_url).toBeNull()
    })
})
