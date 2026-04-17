import { describe, it, expect } from 'vitest'
import { getErrorMessage, getErrorDigest } from './error-utils'

describe('getErrorMessage', () => {
    it('extrai message de Error', () => {
        expect(getErrorMessage(new Error('boom'))).toBe('boom')
    })

    it('aceita string crua', () => {
        expect(getErrorMessage('algo deu errado')).toBe('algo deu errado')
    })

    it('aceita objeto com message string', () => {
        expect(getErrorMessage({ message: 'rls denied' })).toBe('rls denied')
    })

    it('ignora message nao-string', () => {
        expect(getErrorMessage({ message: 42 })).toBe('Erro desconhecido')
    })

    it('fallback para null/undefined/numero/objeto vazio', () => {
        expect(getErrorMessage(null)).toBe('Erro desconhecido')
        expect(getErrorMessage(undefined)).toBe('Erro desconhecido')
        expect(getErrorMessage(42)).toBe('Erro desconhecido')
        expect(getErrorMessage({})).toBe('Erro desconhecido')
    })
})

describe('getErrorDigest', () => {
    it('retorna digest quando presente', () => {
        const err = Object.assign(new Error('x'), { digest: 'DYNAMIC_SERVER_USAGE' })
        expect(getErrorDigest(err)).toBe('DYNAMIC_SERVER_USAGE')
    })

    it('retorna undefined quando ausente', () => {
        expect(getErrorDigest(new Error('x'))).toBeUndefined()
        expect(getErrorDigest(null)).toBeUndefined()
        expect(getErrorDigest({ digest: 42 })).toBeUndefined()
    })
})
