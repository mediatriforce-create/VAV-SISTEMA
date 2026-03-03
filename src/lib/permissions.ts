export type Role =
  | 'Coord. Geral'
  | 'Presidente'
  | 'Dir. Financeiro'
  | 'Estágio ADM'
  | 'Comunicação'
  | 'Coord. Pedagógica'
  | 'Educadora'
  | 'Estágio Pedagógico';

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
  'Coord. Geral': ['administracao', 'coordenacao', 'comunicacao', 'pedagogia', 'reunioes', 'calendario', 'chat', 'configuracoes'],
  'Presidente': ['administracao', 'coordenacao', 'comunicacao', 'pedagogia', 'reunioes', 'calendario', 'chat', 'configuracoes'], // View only (UI handles create restriction)
  'Dir. Financeiro': ['administracao', 'coordenacao', 'comunicacao', 'pedagogia', 'reunioes', 'calendario', 'chat', 'configuracoes'], // View only
  'Estágio ADM': ['administracao', 'chat', 'configuracoes'],
  'Comunicação': ['comunicacao', 'chat', 'configuracoes'],
  'Coord. Pedagógica': ['pedagogia', 'reunioes', 'calendario', 'chat', 'configuracoes'],
  'Educadora': ['pedagogia', 'chat', 'configuracoes'],
  'Estágio Pedagógico': ['pedagogia', 'chat', 'configuracoes'],
};

export function hasPermission(role: Role, module: Module): boolean {
  return PERMISSIONS[role]?.includes(module) || false;
}
