# Arquitetura — Streamline App

Arquitetura **Feature-Based** + **BFF** + **Server Layer** para Next.js 15.

## Visão geral

```
Frontend (features + hooks)
        ↓
services.* (axios → /api/bff | /api/internal)
        ↓
src/app/api/bff/*     → integrações externas (Twitch, IGDB, …)
src/app/api/internal/* → backend interno (DB, auth admin, …)
        ↓
src/api/*             → controllers (sem JSX)
        ↓
src/server/*          → clients, gateways, mappers, validators
```

## Estrutura unificada em `src/`

Todo o código da aplicação vive sob `src/`, incluindo o shell do App Router:

```
src/
├── app/                    # Next.js App Router (pages, layouts, route.ts finos)
│   ├── api/
│   │   ├── bff/
│   │   ├── internal/
│   │   └── …               # Reexports legado
│   ├── admin/
│   ├── auth/
│   ├── globals.css
│   └── [slug]/
├── api/                    # Controllers BFF e internal (sem JSX)
├── server/
├── services/
├── features/
├── components/
├── hooks/
├── types/
├── utils/
└── lib/

middleware.ts               # Raiz do projeto (convenção Next.js)
```

### Regra prática

- **Novo código de negócio** → `src/features/`, `src/api/`, `src/server/`, `src/services/`
- **Novo endpoint** → `src/app/api/.../route.ts` (fino) + controller em `src/api/`
- **Nova página** → `src/app/.../page.tsx` (fina) + hook/component em `src/features/`

## Aliases TypeScript

| Alias | Caminho |
|-------|---------|
| `@/*` | `src/*` |
| `@app/*` | `src/app/*` |
| `@features/*` | `src/features/*` |
| `@server/*` | `src/server/*` |
| `@api/*` | `src/api/*` |
| `@services` | `src/services/index.ts` |
| `@components/*` | `src/components/*` |
| `@hooks/*` | `src/hooks/*` |
| `@app-types/*` | `src/types/*` |
| `@utils/*` | `src/utils/*` |
| `@lib/*` | `src/lib/*` |

## Padrões obrigatórios

### Componente (`index.tsx`)
- Apenas JSX, composição e estilos
- Sem `fetch`, sem regras de negócio, sem funções inline no JSX

### Hook (`*.hook.ts`)
- Estado, effects, handlers, integração com `services`

### Service (`services/entities/*.services.ts`)
```ts
await services.igdb.games.search(query, limit, signal);
await services.streamers.moderators.list(streamerId);
```

### BFF / Internal
- Rota fina em `src/app/api/...` → `*.controller.ts` → `server/*` ou `lib/*`

## Endpoints

### BFF
- `GET /api/bff/auth/twitch/authorize`
- `GET /api/auth/twitch/callback` (redirect URI Twitch — legado)
- `GET /api/bff/twitch/channels/search`
- `GET /api/bff/igdb/search`
- `GET /api/bff/igdb/games/:id`

### Internal
- `GET|POST /api/internal/scheduled-streams`
- `PATCH|DELETE /api/internal/scheduled-streams/:id`
- `GET|POST /api/internal/streamer-games`
- `PATCH|DELETE /api/internal/streamer-games/:id`
- `GET|POST /api/internal/games`
- `GET|DELETE /api/internal/auth/session`
- `GET|POST /api/internal/admin/channels`
- `GET|PUT /api/internal/streamers/:id/social-links`
- `GET /api/internal/streamers/public/:username/social-links`
- `GET|POST|DELETE /api/internal/streamers/:id/moderators`
- `POST /api/internal/streamers/sync`
- `GET /api/internal/streamers/public/featured`
- `GET /api/internal/streamers/public/:username`

### Compatibilidade legado
Rotas antigas em `src/app/api/*` (sem prefixo `internal`/`bff`) reexportam as rotas novas.

## Features migradas

| Feature | Status |
|---------|--------|
| `search` | ✅ |
| `schedule` | ✅ |
| `games` | ✅ |
| `links` | ✅ |
| `auth` | ✅ |
| `admin` (moderators) | ✅ |
| `streamer` / `profile` | 🟡 sync via services; restante em context |

## Próximas migrações

1. Componentes restantes de `src/components/` → `src/features/`
2. `AuthForm` / `useAuth` (localStorage legado) ou remoção
3. Repositories em `src/server/repositories/`
4. BFF YouTube / Kick / Discord quando necessário

## Referência

- BFF Twitch: `src/server/twitch/*` + `src/api/bff/twitch/*`
- Internal streamers: `src/api/internal/streamers/*`
- Feature admin moderators: `src/features/admin/hooks/use-admin-moderators-page.hook.ts`
