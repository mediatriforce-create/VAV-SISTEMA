export type Role =
  | 'Coord. Geral'
  | 'Administração'
  | 'Comunicação'
  | 'Pedagogia'
  | 'Estagiário(a) de ADM'
  | 'Estagiário(a) de Comunicação'
  | 'Educador(a) Escolar'
  | 'Direção'
  | 'Presidente';

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
  'Coord. Geral': ['administracao', 'coordenacao', 'pedagogia', 'chat', 'reunioes', 'calendario', 'configuracoes'],
  'Administração': ['administracao', 'coordenacao', 'comunicacao', 'chat', 'reunioes', 'calendario', 'configuracoes'],
  'Comunicação': ['comunicacao', 'chat', 'reunioes', 'calendario', 'configuracoes'],
  'Pedagogia': ['coordenacao', 'comunicacao', 'pedagogia', 'chat', 'reunioes', 'calendario', 'configuracoes'],
  'Estagiário(a) de ADM': ['administracao', 'chat', 'reunioes', 'calendario', 'configuracoes'],
  'Estagiário(a) de Comunicação': ['comunicacao', 'chat', 'reunioes', 'calendario', 'configuracoes'],
  'Educador(a) Escolar': ['pedagogia', 'chat', 'reunioes', 'calendario', 'configuracoes'],
  'Direção': ['administracao', 'coordenacao', 'comunicacao', 'pedagogia', 'chat', 'reunioes', 'calendario', 'configuracoes'],
  'Presidente': ['administracao', 'coordenacao', 'comunicacao', 'pedagogia', 'chat', 'reunioes', 'calendario', 'configuracoes'],
};

export function hasPermission(role: Role, module: Module): boolean {
  return PERMISSIONS[role]?.includes(module) || false;
}
