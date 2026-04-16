# VAV Central

ERP/LMS interno da ONG Viva a Vida. Cobre pedagogia, coordenacao,
comunicacao, financeiro, reunioes, calendario, chat e aprovacoes.

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack)
- **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** (com tema customizado, dark mode)
- **Supabase** (Postgres + Auth + Storage + Realtime + RLS)
- **Google APIs** (Drive para arquivos, Calendar/Meet para reunioes)
- **Jitsi** (videoconferencia embarcada como fallback do Meet)

## Setup local

```bash
# 1. Clone e instale
git clone <repo>
cd VAV-SISTEMA
npm install

# 2. Variaveis de ambiente
cp .env.example .env.local
# preencha .env.local com as chaves do Supabase e Google

# 3. Aplicar migrations no Supabase
# Via CLI:
supabase db push
# Ou cole o conteudo de supabase/migrations/*.sql em ordem no SQL Editor

# 4. Rodar
npm run dev
```

Abre em `http://localhost:3000`.

## Estrutura

```
src/
├── app/                     # Rotas (App Router)
│   ├── dashboard/           # Area autenticada principal
│   ├── comunicacao/         # Modulo de Comunicacao (Drive, Galeria, Kanban)
│   ├── coord/               # Coordenacao + demandas
│   ├── login/, signup/      # Auth
│   └── api/                 # Endpoints REST internos
├── modules/                 # Features (admin, aprovacoes, comunicacao,
│                            #          coord, mural, pedagogia,
│                            #          personal-area, settings, shared)
├── actions/                 # Server actions
├── components/              # Componentes UI compartilhados
├── hooks/                   # Custom React hooks
├── lib/                     # Integracao Supabase, Google, permissions
└── types/                   # Tipos TS compartilhados

supabase/
├── migrations/              # SQL versionado, aplicado em ordem
└── destructive/             # Scripts perigosos (NAO rodar em producao)

scripts/
└── dev-utilities/           # Scripts ad-hoc para debug local

proxy.ts                     # Auth + route guards (substitui middleware)
```

## Roles e permissoes

Definidas em `src/lib/permissions.ts`. 8 roles:
`Presidencia`, `Direcao`, `Coordenadora ADM`, `Coordenacao de Pedagogia`,
`Educador`, `Estagiario(a) de ADM`, `Estagiario(a) de Comunicacao`,
`Estagiario(a) de Pedagogia`.

Cada role mapeia para 8 modulos (`administracao`, `coordenacao`,
`comunicacao`, `pedagogia`, `reunioes`, `calendario`, `chat`,
`configuracoes`) com nivel `full` / `view` / `none`.

`proxy.ts` aplica route guards baseados nesse mapa — usuario sem
permissao e redirecionado para `/dashboard?forbidden=<modulo>`.

## Comandos

```bash
npm run dev      # dev server (Turbopack)
npm run build    # build de producao
npm run start    # roda build de producao
npm run lint     # ESLint
npx tsc --noEmit # typecheck
```

## Integracoes externas

| Servico | Uso | Vars de ambiente |
|---|---|---|
| Supabase | Auth, BD, Storage, Realtime | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Google Drive | Upload/listagem de arquivos | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` ou Service Account |
| Google Calendar/Meet | Agendamento de reunioes | `GOOGLE_CALENDAR_ID` |
| Jitsi | Sala de reuniao embarcada | sem credencial (publico) |

## Notas de seguranca

- RLS habilitado em todas as tabelas sensiveis. Nunca contornar via service role no client.
- Uploads validados em `src/lib/upload-validation.ts` (whitelist de MIME + limite 10MB).
- Service Role key NUNCA deve aparecer em codigo client (`'use client'`).
- `supabase/destructive/` contem scripts que apagam dados — uso restrito a dev/staging.
