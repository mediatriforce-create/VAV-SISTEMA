export type Role =
  | 'Coordenadora ADM'
  | 'Coordenação de Pedagogia'
  | 'Estagiário(a) de ADM'
  | 'Estagiário(a) de Comunicação'
  | 'Estagiário(a) de Pedagogia'
  | 'Educador'
  | 'Direção'
  | 'Presidência';

export type Module =
  | 'administracao'
  | 'coordenacao'
  | 'comunicacao'
  | 'pedagogia'
  | 'reunioes'
  | 'calendario'
  | 'chat'
  | 'configuracoes';

export const PERMISSIONS: Record<Role, Module[]> = {
  'Coordenadora ADM': ['administracao', 'coordenacao', 'comunicacao', 'chat', 'reunioes', 'calendario', 'configuracoes'],
  'Coordenação de Pedagogia': ['pedagogia', 'coordenacao', 'comunicacao', 'chat', 'reunioes', 'calendario', 'configuracoes'],
  'Estagiário(a) de ADM': ['administracao', 'chat', 'reunioes', 'calendario', 'configuracoes'],
  'Estagiário(a) de Comunicação': ['comunicacao', 'chat', 'reunioes', 'calendario', 'configuracoes'],
  'Estagiário(a) de Pedagogia': ['pedagogia', 'chat', 'reunioes', 'calendario', 'configuracoes'],
  'Educador': ['pedagogia', 'chat', 'reunioes', 'calendario', 'configuracoes'],
  'Direção': ['administracao', 'coordenacao', 'comunicacao', 'pedagogia', 'chat', 'reunioes', 'calendario', 'configuracoes'],
  'Presidência': ['administracao', 'coordenacao', 'comunicacao', 'pedagogia', 'chat', 'reunioes', 'calendario', 'configuracoes'],
};

export function hasPermission(role: Role, module: Module): boolean {
  return PERMISSIONS[role]?.includes(module) || false;
}
