import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockMessagesInsert = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
    createClient: async () => ({
        auth: { getUser: mockGetUser },
        from: (table: string) => {
            if (table === 'messages') {
                return { insert: mockMessagesInsert }
            }
            return {}
        },
    }),
}))

import { sendMessage } from './chat'

describe('sendMessage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockMessagesInsert.mockResolvedValue({ error: null })
    })

    it('falha sem usuario autenticado', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })
        const res = await sendMessage('r-1', 'oi')
        expect(res.success).toBe(false)
        expect(res.message).toMatch(/acesso negado|negado/i)
        expect(mockMessagesInsert).not.toHaveBeenCalled()
    })

    it('insere mensagem com sender_id e trim do conteudo', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })

        const res = await sendMessage('r-1', '  ola mundo  ')

        expect(res).toEqual({ success: true })
        expect(mockMessagesInsert).toHaveBeenCalledWith({
            room_id: 'r-1',
            sender_id: 'u-1',
            content: 'ola mundo',
        })
    })

    it('inclui id quando optimisticId e passado', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })

        await sendMessage('r-1', 'oi', 'opt-123')

        expect(mockMessagesInsert).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'opt-123' }),
        )
    })

    it('inclui file_metadata quando presente', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })

        const meta = { name: 'arquivo.pdf', drive_id: 'abc' }
        await sendMessage('r-1', '', undefined, meta)

        expect(mockMessagesInsert).toHaveBeenCalledWith(
            expect.objectContaining({ file_metadata: meta }),
        )
    })

    it('NAO inclui file_metadata quando null', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })

        await sendMessage('r-1', 'oi', undefined, null)

        const inserted = mockMessagesInsert.mock.calls[0][0]
        expect(inserted).not.toHaveProperty('file_metadata')
    })

    it('propaga erro do BD como success:false', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
        mockMessagesInsert.mockResolvedValue({ error: new Error('rls denied') })

        const res = await sendMessage('r-1', 'oi')

        expect(res.success).toBe(false)
        expect(res.message).toMatch(/rls/i)
    })
})
