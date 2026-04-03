export type Role =
  | 'Coordenadora ADM'
  | 'Coordenação de Pedagogia'
  | 'Estagiário(a) de ADM'
  | 'Estagiário(a) de Comunicação'
  | 'Estagiário(a) de Pedagogia'
  | 'Educador'
  | 'Direção'
  | 'Presidência'

export type Module =
  | 'administracao'
  | 'coordenacao'
  | 'comunicacao'
  | 'pedagogia'
  | 'reunioes'
  | 'calendario'
  | 'chat'
  | 'configuracoes'

// 'full' = criar/editar/ver | 'view' = só visualizar/entrar | 'none' = sem acesso
export type PermissionLevel = 'full' | 'view' | 'none'

export const PERMISSIONS: Record<Role, Record<Module, PermissionLevel>> = {
  'Presidência': {
    administracao: 'full', coordenacao: 'full', comunicacao: 'full', pedagogia: 'full',
    reunioes: 'full', calendario: 'full', chat: 'full', configuracoes: 'full',
  },
  'Direção': {
    administracao: 'full', coordenacao: 'full', comunicacao: 'full', pedagogia: 'full',
    reunioes: 'full', calendario: 'full', chat: 'full', configuracoes: 'full',
  },
  'Coordenadora ADM': {
    administracao: 'full', coordenacao: 'full', comunicacao: 'full', pedagogia: 'none',
    reunioes: 'full', calendario: 'full', chat: 'full', configuracoes: 'full',
  },
  'Coordenação de Pedagogia': {
    administracao: 'none', coordenacao: 'full', comunicacao: 'full', pedagogia: 'full',
    reunioes: 'full', calendario: 'full', chat: 'full', configuracoes: 'full',
  },
  'Estagiário(a) de ADM': {
    administracao: 'full', coordenacao: 'none', comunicacao: 'full', pedagogia: 'none',
    reunioes: 'view', calendario: 'view', chat: 'full', configuracoes: 'full',
  },
  'Estagiário(a) de Comunicação': {
    administracao: 'none', coordenacao: 'none', comunicacao: 'full', pedagogia: 'none',
    reunioes: 'view', calendario: 'view', chat: 'full', configuracoes: 'full',
  },
  'Estagiário(a) de Pedagogia': {
    administracao: 'none', coordenacao: 'none', comunicacao: 'full', pedagogia: 'full',
    reunioes: 'view', calendario: 'view', chat: 'full', configuracoes: 'full',
  },
  'Educador': {
    administracao: 'none', coordenacao: 'none', comunicacao: 'full', pedagogia: 'full',
    reunioes: 'view', calendario: 'view', chat: 'full', configuracoes: 'full',
  },
}

/** Verifica se o cargo tem qualquer nível de acesso ao módulo (view ou full) */
export function hasPermission(role: string, module: Module): boolean {
  const perms = PERMISSIONS[role as Role]
  if (!perms) return false
  return perms[module] !== 'none'
}

/** Verifica se o cargo pode criar/editar no módulo (acesso full) */
export function canCreate(role: string, module: Module): boolean {
  const perms = PERMISSIONS[role as Role]
  if (!perms) return false
  return perms[module] === 'full'
}
