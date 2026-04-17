import { describe, it, expect } from 'vitest'
import { hasPermission, canCreate, PERMISSIONS } from './permissions'

describe('permissions', () => {
    describe('hasPermission', () => {
        it('Presidencia tem acesso a todos os modulos', () => {
            for (const m of Object.keys(PERMISSIONS['Presidência'])) {
                expect(hasPermission('Presidência', m as never)).toBe(true)
            }
        })

        it('Educador NAO acessa administracao nem coordenacao', () => {
            expect(hasPermission('Educador', 'administracao')).toBe(false)
            expect(hasPermission('Educador', 'coordenacao')).toBe(false)
        })

        it('Educador acessa pedagogia, chat, calendario, comunicacao, reunioes', () => {
            expect(hasPermission('Educador', 'pedagogia')).toBe(true)
            expect(hasPermission('Educador', 'chat')).toBe(true)
            expect(hasPermission('Educador', 'calendario')).toBe(true)
            expect(hasPermission('Educador', 'comunicacao')).toBe(true)
            expect(hasPermission('Educador', 'reunioes')).toBe(true)
        })

        it('Coordenadora ADM NAO acessa pedagogia (modulo dedicado a coord. pedag.)', () => {
            expect(hasPermission('Coordenadora ADM', 'pedagogia')).toBe(false)
        })

        it('Estagiario(a) de Comunicacao so cria em comunicacao, ve outros', () => {
            expect(hasPermission('Estagiário(a) de Comunicação', 'comunicacao')).toBe(true)
            expect(hasPermission('Estagiário(a) de Comunicação', 'reunioes')).toBe(true)
            expect(hasPermission('Estagiário(a) de Comunicação', 'administracao')).toBe(false)
            expect(hasPermission('Estagiário(a) de Comunicação', 'pedagogia')).toBe(false)
            expect(hasPermission('Estagiário(a) de Comunicação', 'coordenacao')).toBe(false)
        })

        it('Role inexistente retorna false em qualquer modulo', () => {
            expect(hasPermission('Faxineiro', 'chat')).toBe(false)
            expect(hasPermission('', 'chat')).toBe(false)
        })
    })

    describe('canCreate', () => {
        it('Educador pode criar em pedagogia (full) mas nao em reunioes (apenas view)', () => {
            expect(canCreate('Educador', 'pedagogia')).toBe(true)
            expect(canCreate('Educador', 'reunioes')).toBe(false)
        })

        it('canCreate retorna false para nivel "view"', () => {
            // Estagiarios tem reunioes/calendario como view
            expect(canCreate('Estagiário(a) de Pedagogia', 'reunioes')).toBe(false)
            expect(canCreate('Estagiário(a) de Pedagogia', 'calendario')).toBe(false)
            // mas tem chat/comunicacao/pedagogia como full
            expect(canCreate('Estagiário(a) de Pedagogia', 'chat')).toBe(true)
            expect(canCreate('Estagiário(a) de Pedagogia', 'comunicacao')).toBe(true)
            expect(canCreate('Estagiário(a) de Pedagogia', 'pedagogia')).toBe(true)
        })

        it('Role inexistente retorna false', () => {
            expect(canCreate('Faxineiro', 'chat')).toBe(false)
        })
    })

    describe('matriz de permissoes — invariantes', () => {
        it('toda role tem entrada para todos os modulos definidos', () => {
            const modules = Object.keys(PERMISSIONS['Presidência'])
            for (const role of Object.keys(PERMISSIONS) as Array<keyof typeof PERMISSIONS>) {
                for (const m of modules) {
                    expect(PERMISSIONS[role][m as never]).toMatch(/^(full|view|none)$/)
                }
            }
        })

        it('Presidencia e Direcao tem permissoes identicas (alta gestao)', () => {
            expect(PERMISSIONS['Presidência']).toEqual(PERMISSIONS['Direção'])
        })
    })
})
