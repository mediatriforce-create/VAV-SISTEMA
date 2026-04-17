import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockMeetingsSelect = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
    createClient: async () => ({
        auth: { getUser: mockGetUser },
        from: () => ({
            select: () => ({
                order: () => ({
                    order: mockMeetingsSelect,
                }),
            }),
        }),
    }),
}))

import { getMeetingsAction } from './getMeetings'

describe('getMeetingsAction', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('retorna [] quando usuario nao autenticado', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
        const result = await getMeetingsAction()
        expect(result).toEqual([])
        expect(mockMeetingsSelect).not.toHaveBeenCalled()
    })

    it('retorna meetings ordenados quando usuario autenticado', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
        const fakeMeetings = [
            { id: 'm-1', title: 'Reuniao 1', date: '2026-04-15' },
            { id: 'm-2', title: 'Reuniao 2', date: '2026-04-10' },
        ]
        mockMeetingsSelect.mockResolvedValue({ data: fakeMeetings, error: null })

        const result = await getMeetingsAction()
        expect(result).toEqual(fakeMeetings)
    })

    it('retorna [] quando query falha', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
        mockMeetingsSelect.mockResolvedValue({ data: null, error: new Error('rls') })

        const result = await getMeetingsAction()
        expect(result).toEqual([])
    })

    it('silencia erro DYNAMIC_SERVER_USAGE durante build', async () => {
        const dynErr = Object.assign(new Error('dynamic'), { digest: 'DYNAMIC_SERVER_USAGE' })
        mockGetUser.mockRejectedValue(dynErr)

        const result = await getMeetingsAction()
        expect(result).toEqual([])
    })

    it('retorna [] em qualquer outro erro inesperado', async () => {
        mockGetUser.mockRejectedValue(new Error('boom'))
        const result = await getMeetingsAction()
        expect(result).toEqual([])
    })
})
