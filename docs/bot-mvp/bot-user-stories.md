# StreaminHub — User Stories do Bot (Node.js + TypeScript + Express)

## Documento

| Campo | Valor |
| --- | --- |
| Produto | StreaminHub — Serviço Bot de Stream (MVP) |
| Camada | Aplicação independente (Node.js + TypeScript + Express) |
| Versão do documento | 1.1 |
| Idioma | Português (Brasil) |
| Escopo | Twitch IRC · PT-BR · Bot global · Multi-tenant lógico por canal |

---

## Visão geral

O **Bot StreaminHub** é um processo **separado** do frontend Next.js. Responsabilidades:

- Conectar ao chat da Twitch (IRC)
- Escutar mensagens e eventos de chat
- Executar comandos personalizados
- Disparar timers automáticos
- Aplicar blacklist / moderação simples
- Gerenciar contadores e sorteios em runtime
- Sincronizar configuração com a API backend
- Reportar heartbeat, logs e status
- Respeitar rate limits e cooldowns da Twitch

**Não** inclui UI admin. A UI admin fica no app Next.js e já existe parcialmente para comandos, variáveis e navegação do módulo Bot. **Não** hospeda overlays (apenas pode notificar backend para broadcast).

### Base já implementada no app StreaminHub

A aplicação atual já entrega parte importante do contrato que o projeto Node do bot deve consumir:

| Área | Estado atual no app |
| --- | --- |
| **Persistência** | Tabelas SQLite/Drizzle para `bot_channel_config`, `bot_commands`, `bot_timers` e `bot_blacklist_terms` |
| **Config version** | `configVersion` monotônico por `streamerId`, incrementado em create/update/delete de comandos, timers e blacklist |
| **Comandos admin** | CRUD de comandos em `/api/internal/bot/commands`, incluindo busca, paginação, soft delete e validação com zod |
| **Comandos padrão** | Provisionamento automático por streamer de `!discord`, `!redes`, `!comandos`, `!horarios` e `!youtube`; não removíveis, apenas desativáveis ou com resposta personalizada |
| **Timers e blacklist** | Backend CRUD já existe; páginas finais do frontend ainda não estão no mesmo nível da tela de comandos |
| **Snapshot M2M** | `GET /api/internal/bot/internal/channels/:streamerId/config` retorna comandos, timers, blacklist, `activeRaffle: null` e `counters: []` |
| **Snapshot de comandos** | `GET /api/internal/bot/internal/channels/:streamerId/commands` retorna comandos ativos e `configVersion` |
| **Sync incremental** | Snapshots aceitam `?sinceVersion=` e retornam `304` quando a versão não mudou, com header `X-Config-Version` |
| **Variáveis** | Catálogo em `/api/internal/bot/variables` com globais, placeholders de contador/timer e descrições de comandos padrão |
| **Emotes** | Catálogo de emotes do canal em `/api/internal/bot/emotes`, via Twitch Helix `/chat/emotes`, usado pelo composer de mensagens |
| **Status frontend** | `/api/internal/bot/status` retorna contagens e versão da config, mas ainda informa o serviço do bot como offline porque heartbeat runtime não existe |

### Implicações para o projeto Node do bot

- O bot deve consumir os endpoints M2M já existentes antes de propor novos contratos.
- O MVP inicial do processo Node pode focar em `commands`, `timers` e `moderation/blacklist`; `counters` e `raffles` ainda aparecem como placeholders no snapshot.
- A substituição de variáveis precisa cobrir no mínimo o catálogo já exposto pelo backend: `{user}`, `{displayName}`, `{channel}`, `{streamer}`, `{streamerName}`, `{count:<nome>}` e referências de timer.
- Emotes do canal são inseridos no frontend como texto/código; no runtime do bot basta enviar a mensagem final pelo chat, sem renderização especial.

---

## Princípios arquiteturais

| Princípio | Descrição |
| --- | --- |
| **Config remota** | Backend é fonte da verdade; bot mantém cache local |
| **Stateless entre restarts** | Estado volátil (cooldown, filas) reconstruível; persistente via API |
| **Modular** | Domínios isolados: IRC, commands, timers, moderation, etc. |
| **Resiliente** | Reconexão automática IRC e API com backoff |
| **Observável** | Logs estruturados, métricas, health endpoint próprio |
| **Seguro** | Credenciais apenas em env; nunca logar tokens |

---

## Estrutura sugerida de pastas

```
streaminhub-bot/
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── index.ts                 # Bootstrap
│   ├── app.ts                   # Express app (health, metrics)
│   ├── config/
│   │   ├── env.ts               # Validação de variáveis
│   │   └── constants.ts
│   ├── core/
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   ├── event-bus.ts         # Eventos internos
│   │   └── lifecycle.ts         # Startup/shutdown graceful
│   ├── infra/
│   │   ├── api-client/          # HTTP para backend StreaminHub
│   │   ├── cache/               # Cache local (memory/Redis opcional)
│   │   ├── queue/               # Fila de execução de ações
│   │   └── metrics/
│   ├── twitch/
│   │   ├── irc-client.ts        # Conexão IRC
│   │   ├── reconnect.ts
│   │   ├── rate-limiter.ts      # Rate limit Twitch
│   │   └── message-parser.ts
│   ├── channels/
│   │   ├── channel-manager.ts   # Mapa canal → contexto
│   │   └── channel-context.ts   # Config + estado por canal
│   ├── modules/
│   │   ├── commands/
│   │   ├── timers/
│   │   ├── moderation/
│   │   ├── counters/
│   │   ├── raffles/
│   │   └── variables/
│   ├── sync/
│   │   ├── config-sync.ts
│   │   └── heartbeat.ts
│   └── realtime/
│       └── ws-client.ts         # Opcional: WS com backend
├── tests/
│   ├── unit/
│   └── integration/
└── docker/
    └── Dockerfile
```

---

## Fluxo de inicialização

```
1. Carregar e validar variáveis de ambiente
2. Inicializar logger e métricas
3. Subir Express (GET /health, /metrics)
4. Autenticar API client (BOT_SERVICE_TOKEN)
5. Buscar lista de canais ativos (MVP: lista estática env ou futura API de canais com bot habilitado)
6. Para cada canal:
   a. Buscar config snapshot em `/api/internal/bot/internal/channels/:streamerId/config`
   b. Popular ChannelContext + cache local
   c. Iniciar timers do canal
   d. Conectar IRC ao canal
7. Iniciar job de heartbeat (30s)
8. Iniciar job de config sync (60s ou WS push)
9. Registrar handlers no event-bus
10. Sinalizar ready → health/ready = 200
```

### Shutdown graceful

```
1. SIGTERM recebido
2. Parar aceitar novas mensagens IRC
3. Drenar fila de ações (timeout 10s)
4. Desconectar IRC
5. Flush logs pendentes para API
6. Encerrar processo
```

---

## Fluxo de mensagens (chat → ação)

```
IRC PRIVMSG recebida
        │
        ▼
  message-parser (user, channel, text, badges)
        │
        ▼
  rate-limiter (Twitch) ──bloqueado──► descartar/log
        │
        ▼
  event-bus emit("chat.message")
        │
        ├──► moderation模块 (blacklist check)
        │         └── match → ação (timeout/delete) + log API
        │
        ├──► raffles模块 (keyword match → register entry)
        │
        ├──► commands模块 (trigger match → cooldown check → reply)
        │
        └──► counters模块 (increment command match → increment + API)
```

---

## Estratégia de reconexão

| Camada | Política MVP |
| --- | --- |
| **IRC Twitch** | Backoff exponencial: 1s, 2s, 4s … máx 60s; jitter ±20%; reset após 5 min estável |
| **API Backend** | 3 retries imediatos; depois circuit breaker 30s; operar com cache stale |
| **WebSocket backend** | Reconnect infinito com backoff; fallback para polling 60s |

### Estados de conexão IRC (por canal)

- `disconnected` → `connecting` → `connected` → `reconnecting` → `failed` (após N tentativas, alertar via heartbeat `degraded`)

---

## Estratégia de cache local

| Dado | Onde | TTL | Invalidação |
| --- | --- | --- | --- |
| Config snapshot | Memory por `streamerId` | Até `configVersion` mudar | Poll/WS `config.updated` |
| Cooldowns | Memory/Redis | Por comando+user | Expira naturalmente |
| Blacklist | Parte do snapshot | Com config | Sync config |
| Rate limit Twitch | Memory sliding window | 30s window | — |

**Regra:** se API indisponível > 5 min, continuar com última config válida; não aceitar novos canais até API voltar.

---

## Estratégia de sincronização com API

| Método | Frequência | Uso |
| --- | --- | --- |
| **Snapshot inicial** | Ao conectar canal | Bootstrap completo via `/api/internal/bot/internal/channels/:streamerId/config` |
| **Polling `sinceVersion`** | 60s | MVP default; backend já retorna `304` quando não há mudança |
| **Push WS `config.updated`** | Realtime | MVP+ se backend suportar |
| **On-demand** | Após erro de comando desconhecido | Resync forçado |

Após sync:

1. Comparar `configVersion` remoto vs local
2. Se diferente, substituir snapshot atômico no `ChannelContext`
3. Reiniciar timers afetados (diff simples: cancelar todos e recriar no MVP)
4. Emitir evento interno `config.reloaded`

---

## Estratégia de escalabilidade futura

| Fase | Abordagem |
| --- | --- |
| **MVP** | Processo único; bot global; mapa em memória de canais |
| **V2** | Redis para cooldown + cache compartilhado |
| **V3** | Múltiplas instâncias; consistent hashing por `twitchChannelId` |
| **V4** | Worker pool separado: IRC readers → fila → action workers |

Limite Twitch: respeitar mensagens por janela; fila central prioriza moderação > comandos > timers.

---

## Épicos do MVP (Bot)

| ID | Épico | Descrição |
| --- | --- | --- |
| EP-BOT-01 | Bootstrap e infra | Env, Express health, lifecycle |
| EP-BOT-02 | Conexão IRC | Connect, reconnect, parse |
| EP-BOT-03 | Sync e API client | Snapshot, heartbeat, logs |
| EP-BOT-04 | Comandos | Trigger, cooldown, resposta, comandos padrão e customizados |
| EP-BOT-05 | Timers | Agendamento e envio |
| EP-BOT-06 | Moderação | Blacklist e ações |
| EP-BOT-07 | Contadores | Incremento e sync |
| EP-BOT-08 | Sorteios | Entrada e sorteio |
| EP-BOT-09 | Fila e rate limit | Execução ordenada e segura |
| EP-BOT-10 | Observabilidade | Logs, métricas, falhas |
| EP-BOT-11 | Catálogo auxiliar | Variáveis e emotes já expostos pelo backend/admin |

---

## Features e User Stories

---

# Bootstrap e infraestrutura

## Objetivo

Inicializar o serviço bot com configuração validada, HTTP health e encerramento seguro.

## User Stories

### BOT-US001 - Validação de variáveis de ambiente

Como **operador de deploy**,
eu quero **que o bot falhe rápido na inicialização se variáveis obrigatórias estiverem ausentes**,
para que **não suba em estado inconsistente**.

#### Critérios de aceitação

* [ ] Variáveis obrigatórias: `BOT_SERVICE_TOKEN`, `STREAMINHUB_API_URL`, `TWITCH_BOT_USERNAME`, `TWITCH_BOT_OAUTH_TOKEN`
* [ ] Validação com mensagens claras em PT-BR no stderr
* [ ] Exit code ≠ 0 em falha
* [ ] `.env.example` documentado no repositório do bot

#### Observações técnicas

* Usar zod ou envalid para schema
* OAuth token com prefixo `oauth:` conforme IRC Twitch

#### Prioridade

Alta

#### Dependências

* Repositório do bot criado

---

### BOT-US002 - Servidor HTTP de health e métricas

Como **operador**,
eu quero **endpoints HTTP no processo do bot**,
para que **orquestradores verifiquem saúde do container**.

#### Critérios de aceitação

* [ ] `GET /health` → 200 `{ status: "ok" }`
* [ ] `GET /health/ready` → 200 apenas se ≥1 canal conectado ou modo manutenção documentado
* [ ] `GET /metrics` opcional formato Prometheus
* [ ] Porta configurável `BOT_HTTP_PORT` default 3001

#### Observações técnicas

* Express mínimo; sem expor rotas administrativas sem auth no MVP

#### Prioridade

Alta

#### Dependências

* BOT-US001

---

### BOT-US003 - Shutdown graceful

Como **operador**,
eu quero **encerramento graceful ao receber SIGTERM**,
para que **mensagens na fila não sejam perdidas abruptamente**.

#### Critérios de aceitação

* [ ] Handler SIGTERM/SIGINT registrado
* [ ] Drenagem da fila com timeout configurável
* [ ] Desconexão IRC limpa (PART ou QUIT)
* [ ] Log final "shutdown complete"

#### Observações técnicas

* Kubernetes terminationGracePeriodSeconds ≥ 30

#### Prioridade

Média

#### Dependências

* BOT-US002
* Fila de execução (BOT-US020)

---

# Conexão IRC Twitch

## Objetivo

Manter conexão estável com o chat da Twitch para cada canal ativo.

## User Stories

### BOT-US004 - Conectar ao chat IRC da Twitch

Como **serviço Bot**,
eu quero **conectar ao servidor IRC da Twitch com credenciais do bot**,
para que **eu leia e envie mensagens no canal**.

#### Critérios de aceitação

* [ ] Conexão a `irc.chat.twitch.tv:6697` TLS
* [ ] Autenticacao CAP REQ comandos necessários MVP
* [ ] JOIN no canal `#{twitchUsername}` após config carregada
* [ ] Log estruturado: `channel`, `event=irc.connected`

#### Observações técnicas

* Biblioteca: tmi.js ou implementação raw; avaliar manutenção
* Nick do bot global único para todos os streamers (MVP)

#### Prioridade

Alta

#### Dependências

* BOT-US001
* Credenciais Twitch do bot

---

### BOT-US005 - Reconexão automática IRC

Como **serviço Bot**,
eu quero **reconectar automaticamente após queda de conexão**,
para que **a live continue com moderação e comandos**.

#### Critérios de aceitação

* [ ] Backoff exponencial com jitter
* [ ] Máximo de tentativas antes de status `degraded`
* [ ] Re-JOIN canais após reconectar
* [ ] Não duplicar handlers de mensagem

#### Observações técnicas

* Detectar disconnect vs timeout
* Notificar backend via heartbeat campo `ircStatus`

#### Prioridade

Alta

#### Dependências

* BOT-US004

---

### BOT-US006 - Parser de mensagens IRC

Como **serviço Bot**,
eu quero **normalizar mensagens IRC em um modelo interno**,
para que **todos os módulos consumam o mesmo formato**.

#### Critérios de aceitação

* [ ] Modelo: `channelId`, `twitchUsername`, `userId`, `displayName`, `message`, `timestamp`, `isMod`, `isBroadcaster`
* [ ] Ignorar mensagens do próprio bot (anti-loop)
* [ ] Ignorar mensagens de sistema não relevantes
* [ ] Emitir `chat.message` no event-bus

#### Observações técnicas

* Tratar PRIVMSG e NOTICE mínimo
* Mensagens >500 chars truncadas antes de processar

#### Prioridade

Alta

#### Dependências

* BOT-US004

---

# API Client e sincronização

## Objetivo

Comunicar com o backend StreaminHub para config, heartbeat e logs.

## User Stories

### BOT-US007 - Cliente HTTP autenticado para API

Como **serviço Bot**,
eu quero **um cliente HTTP com token de serviço**,
para que **eu consuma rotas M2M `/api/internal/bot/internal/*` com segurança**.

#### Critérios de aceitação

* [ ] Header `Authorization: Bearer <BOT_SERVICE_TOKEN>` em todas as requests M2M já expostas em `/api/internal/bot/internal/*`
* [ ] Timeout 10s; retry 3x com backoff
* [ ] Circuit breaker após falhas consecutivas
* [ ] requestId propagado (UUID)

#### Observações técnicas

* fetch nativo ou undici; axios aceitável
* Tipagem TypeScript das respostas alinhada ao backend atual (`configVersion`, comandos, timers, blacklist, `activeRaffle`, `counters`)

#### Prioridade

Alta

#### Dependências

* BE-US002 (backend M2M)

---

### BOT-US008 - Carregar snapshot de configuração

Como **serviço Bot**,
eu quero **carregar snapshot completo ao iniciar um canal**,
para que **eu tenha comandos, timers e blacklist antes de processar chat**.

#### Critérios de aceitação

* [ ] `GET /api/internal/bot/internal/channels/:streamerId/config`
* [ ] Armazenar em `ChannelContext` com `configVersion`
* [ ] Falha bloqueia JOIN no canal (retry)
* [ ] Log de duração e tamanho do payload
* [ ] Aceitar payload atual com `commands`, `timers`, `blacklist`, `activeRaffle: null` e `counters: []`

#### Observações técnicas

* Validar schema com zod antes de aplicar
* Snapshot imutável até próximo sync; header `X-Config-Version` deve ser preservado para diagnóstico

#### Prioridade

Alta

#### Dependências

* BOT-US007
* BE-US018

---

### BOT-US009 - Sincronização periódica de config

Como **serviço Bot**,
eu quero **pollar mudanças de config a cada 60 segundos**,
para que **alterações do admin reflitam no chat sem restart**.

#### Critérios de aceitação

* [ ] Query `sinceVersion` enviada ao backend nos endpoints de snapshot
* [ ] Se resposta `304` ou version igual, skip sem recriar contexto
* [ ] Se version diferente, hot-reload atômico
* [ ] Reiniciar timers após reload (MVP simplificado)

#### Observações técnicas

* Opcional: substituir por WS quando BE-US019 ativo
* Métrica `config_sync_total`

#### Prioridade

Alta

#### Dependências

* BOT-US008

---

### BOT-US010 - Heartbeat periódico

Como **serviço Bot**,
eu quero **enviar heartbeat ao backend a cada 30 segundos**,
para que **o dashboard mostre status online**.

#### Critérios de aceitação

* [ ] `POST /api/internal/bot/heartbeat` com version, uptime, canais conectados, erros recentes
* [ ] Não bloquear event loop — fire and forget com catch
* [ ] Marcar canal offline localmente se IRC desconectado

#### Observações técnicas

* Incluir build SHA ou semver no campo version
* Backend atual possui `/api/internal/bot/status` com contagens e `configVersion`, mas ainda retorna offline fixo; heartbeat runtime precisa ser implementado no app antes do status online real
* Backend marca offline se >90s sem heartbeat

#### Prioridade

Alta

#### Dependências

* BOT-US007
* BE-US016

---

# Execução de comandos

## Objetivo

Responder a triggers configurados pelo streamer.

## User Stories

### BOT-US011 - Matching de comandos no chat

Como **viewer na Twitch**,
eu quero **digitar um comando como `!discord` e receber resposta**,
para que **eu obtenha informações do canal**.

#### Critérios de aceitação

* [ ] Match case-insensitive no primeiro token da mensagem
* [ ] Prefixo `!` normalizado pelo backend atual; triggers sem `!` são persistidos com `!`
* [ ] Ignorar comandos de usuários ignorados (bot accounts) — lista mínima
* [ ] Respeitar flag `enabled` do comando
* [ ] Executar tanto comandos padrão (`builtinKey`) quanto comandos personalizados vindos do snapshot

#### Observações técnicas

* Mapa hash trigger → comando em memória
* Comandos padrão atuais: `!discord`, `!redes`, `!comandos`, `!horarios`, `!youtube`
* Performance O(1) por mensagem

#### Prioridade

Alta

#### Dependências

* BOT-US008
* BOT-US006

---

### BOT-US012 - Cooldown por comando e usuário

Como **streamer**,
eu quero **cooldown entre usos do mesmo comando por usuário**,
para que **o chat não seja spammado**.

#### Critérios de aceitação

* [ ] Chave cooldown: `commandId + userId`
* [ ] Mensagem opcional "aguarde Xs" (configurável MVP: silencioso)
* [ ] Cooldown 0 = sem limite
* [ ] Limpeza periódica de entradas expiradas

#### Observações técnicas

* Estado em memória Map com TTL
* Não persistir cooldown no DB MVP

#### Prioridade

Alta

#### Dependências

* BOT-US011

---

### BOT-US013 - Substituição de variáveis dinâmicas

Como **viewer**,
eu quero **ver respostas com meu nome e dados do canal**,
para que **a interação seja personalizada**.

#### Critérios de aceitação

* [ ] Substituir `{user}`, `{displayName}`, `{channel}`, `{streamer}`, `{streamerName}` e `{count:<nome>}`
* [ ] Consumir catálogo auxiliar de `/api/internal/bot/variables` para manter frontend e runtime alinhados
* [ ] Placeholder desconhecido mantido literal ou removido — documentar
* [ ] Escape para enviar `{` literal: `{{` (opcional MVP)

#### Observações técnicas

* Módulo `variables/` compartilhável futuramente com backend
* Referências de timer (`{timer:<nome>}`) já aparecem no catálogo como apoio ao admin; tratar como literal até existir regra de substituição runtime
* Limite 500 chars na mensagem final

#### Prioridade

Média

#### Dependências

* BOT-US011
* BE-US023

---

### BOT-US013A - Compatibilidade com emotes inseridos pelo admin

Como **streamer**,
eu quero **usar emotes do meu canal nas mensagens configuradas no admin**,
para que **as respostas do bot preservem a linguagem visual do chat**.

#### Critérios de aceitação

* [ ] Mensagens vindas do backend podem conter códigos de emotes selecionados no composer do frontend
* [ ] Bot envia o texto final sem tentar baixar ou renderizar imagem de emote
* [ ] Códigos de emote contam no limite final de 500 caracteres
* [ ] Falha ao carregar catálogo de emotes no admin não impede execução runtime do bot

#### Observações técnicas

* Backend atual expõe `/api/internal/bot/emotes` para o admin via Twitch Helix; o runtime do bot não precisa consumir esse endpoint para enviar mensagens
* Emotes são uma ajuda de composição, não uma dependência de execução

#### Prioridade

Baixa

#### Dependências

* BOT-US013

---

### BOT-US014 - Enviar resposta ao chat

Como **serviço Bot**,
eu quero **enviar PRIVMSG com rate limit**,
para que **eu não seja banido pela Twitch**.

#### Critérios de aceitação

* [ ] Respeitar 20 mensagens / 30s por canal (janela conservadora MVP)
* [ ] Fila de outbound messages com prioridade
* [ ] Truncar mensagem >500 chars
* [ ] Log `command.executed` para API

#### Observações técnicas

* Usar fila global (BOT-US020)
* Em caso de ban/notícia, log crítico e pausar canal

#### Prioridade

Alta

#### Dependências

* BOT-US004
* BOT-US020

---

# Timers automáticos

## Objetivo

Enviar mensagens periódicas configuradas pelo streamer.

## User Stories

### BOT-US015 - Agendar timers por canal

Como **streamer**,
eu quero **que o bot envie mensagens em intervalo configurado**,
para que **lembretes apareçam automaticamente no chat**.

#### Critérios de aceitação

* [ ] Um job por timer ativo usando `setInterval` ou cron interno
* [ ] Recriar jobs ao reload de config
* [ ] Não disparar se canal IRC desconectado
* [ ] Log `timer.fired` para API
* [ ] Consumir timers ativos do snapshot atual (`id`, `name`, `intervalMinutes`, `message`, `enabled`)

#### Observações técnicas

* Drift aceitável no MVP; V2 usar scheduler preciso
* Mínimo 1 minuto entre disparos do mesmo timer, alinhado ao schema backend (`1..120` minutos)

#### Prioridade

Alta

#### Dependências

* BOT-US008
* BOT-US014

---

### BOT-US016 - Pausar timers desabilitados

Como **streamer**,
eu quero **que timers com `enabled=false` não disparem**,
para que **eu pause lembretes sem apagar**.

#### Critérios de aceitação

* [ ] Flag respeitada após sync sem restart do processo
* [ ] Timer pausado removido do scheduler
* [ ] Sem mensagem residual após desabilitar

#### Observações técnicas

* Diff de timers no reload (MVP: cancel all + recreate)

#### Prioridade

Alta

#### Dependências

* BOT-US015
* BOT-US009

---

# Blacklist e moderação simples

## Objetivo

Detectar termos proibidos e executar ação de moderação configurada.

## User Stories

### BOT-US017 - Detectar termo na blacklist

Como **streamer**,
eu quero **que mensagens com termos banidos sejam detectadas**,
para que **o chat permaneça adequado às regras**.

#### Critérios de aceitação

* [ ] Match `exact` ou `contains` conforme config
* [ ] Case-insensitive para letras ASCII
* [ ] Primeiro match ganha; não acumular ações
* [ ] Log `blacklist.match` com termo (hash opcional por privacidade)
* [ ] Consumir termos ativos do snapshot atual (`term`, `matchType`, `action`, `timeoutSeconds`, `enabled`)

#### Observações técnicas

* MVP: loop em lista; V2: trie ou automaton se >200 termos
* Ignorar mods e broadcaster (configurável MVP: sim)

#### Prioridade

Alta

#### Dependências

* BOT-US008
* BOT-US006

---

### BOT-US018 - Executar ação de moderação simples

Como **streamer**,
eu quero **ação delete ou timeout quando blacklist acionar**,
para que **a moderação seja automática**.

#### Critérios de aceitação

* [ ] `delete`: `/delete <messageId>` se disponível via IRC capability ou Helix futuro
* [ ] MVP pragmático: timeout via Helix API se token permitir; senão aviso no chat
* [ ] `timeout`: duração configurada em segundos
* [ ] Respeitar rate limit de moderação

#### Observações técnicas

* IRC puro tem limitações; documentar dependência Helix para delete
* Prioridade na fila: moderação > comandos

#### Prioridade

Alta

#### Dependências

* BOT-US017
* Credenciais com scope moderação

---

# Contadores

## Objetivo

Incrementar contadores via comando e sincronizar com backend/overlays.

## User Stories

### BOT-US019 - Incrementar contador via comando

Como **viewer**,
eu quero **digitar comando de incremento configurado**,
para que **o contador do canal suba**.

#### Critérios de aceitação

* [ ] Match do `incrementCommand` do contador
* [ ] `POST /api/internal/bot/counters/:id/increment` após incremento local
* [ ] Resposta opcional no chat: "Contador X: N" (config MVP off por default)
* [ ] Evento propagado via backend WS para overlays

#### Observações técnicas

* Snapshot atual já retorna `counters: []`; implementar backend de contadores antes de habilitar esta história no bot
* Incremento otimista local + confirmação API
* Rollback se API falhar (retry 3x)

#### Prioridade

Alta

#### Dependências

* BOT-US011
* BE-US011

---

### BOT-US020 - Fila de execução de ações

Como **serviço Bot**,
eu quero **uma fila com prioridades para ações de chat**,
para que **rate limits sejam respeitados e ordem seja previsível**.

#### Critérios de aceitação

* [ ] Prioridades: moderação (1) > sorteio (2) > comando (3) > timer (4)
* [ ] Worker único por canal ou pool pequeno (MVP: 1 worker/canal)
* [ ] Backpressure: máximo 100 itens na fila por canal
* [ ] Descartar itens mais antigos em overflow com log warning

#### Observações técnicas

* Implementar com p-queue ou fila custom simples
* Métrica `queue_depth`

#### Prioridade

Alta

#### Dependências

* BOT-US014

---

# Sorteios

## Objetivo

Gerenciar participação e sorteio de vencedor integrado ao backend.

## User Stories

### BOT-US021 - Registrar entrada em sorteio ativo

Como **viewer**,
eu quero **participar digitando palavra-chave no chat**,
para que **eu concorra ao sorteio**.

#### Critérios de aceitação

* [ ] Apenas um sorteio `active` por canal
* [ ] Match palavra-chave exata (case-insensitive)
* [ ] `POST /api/internal/bot/raffles/:id/entries`
* [ ] Feedback opcional no chat: "Você entrou no sorteio!" (MVP off)

#### Observações técnicas

* Snapshot atual retorna `activeRaffle: null`; implementar backend de sorteios antes de habilitar esta história no bot
* Ignorar entradas duplicadas (API deduplica)
* Subscribers-only fora do escopo

#### Prioridade

Alta

#### Dependências

* BOT-US008
* BE-US013

---

### BOT-US022 - Executar sorteio e anunciar vencedor

Como **streamer**,
eu quero **que o bot sorteie e anuncie o vencedor no chat**,
para que **o resultado seja público na live**.

#### Critérios de aceitação

* [ ] Trigger via API `draw` (admin clicou) — bot recebe via polling status ou WS
* [ ] `POST /api/internal/bot/raffles/:id/draw`
* [ ] Anunciar: "Parabéns @{displayName}, você ganhou!"
* [ ] Backend emite `raffle.winner` para overlay

#### Observações técnicas

* Bot não escolhe algoritmo — backend retorna vencedor
* Timeout se sorteio sem participantes

#### Prioridade

Alta

#### Dependências

* BOT-US021
* BE-US013

---

# Rate limit da Twitch

## Objetivo

Proteger o bot de excesso de mensagens enviadas.

## User Stories

### BOT-US023 - Rate limiter de mensagens outbound

Como **serviço Bot**,
eu quero **limitar mensagens enviadas por canal e globalmente**,
para que **a conta do bot não seja penalizada**.

#### Critérios de aceitação

* [ ] Limite por canal: 20 msg / 30s
* [ ] Limite global bot: 100 msg / 30s (todos os canais)
* [ ] Mensagens excedentes reenfileiradas, não descartadas (até 60s)
* [ ] Após 60s na fila, descartar com log

#### Observações técnicas

* Sliding window counter em memória
* Ajustar após testes reais com Twitch

#### Prioridade

Alta

#### Dependências

* BOT-US020

---

# Logs e observabilidade

## Objetivo

Registrar comportamento e facilitar diagnóstico.

## User Stories

### BOT-US024 - Logs estruturados

Como **desenvolvedor**,
eu quero **logs JSON com campos padronizados**,
para que **seja fácil filtrar em produção**.

#### Critérios de aceitação

* [ ] Campos: `timestamp`, `level`, `module`, `channel`, `message`, `requestId`
* [ ] Níveis: debug, info, warn, error
* [ ] Nunca logar OAuth token
* [ ] Debug desligado em produção por default

#### Observações técnicas

* pino ou winston
* Correlação requestId API ↔ bot

#### Prioridade

Alta

#### Dependências

* BOT-US001

---

### BOT-US025 - Envio batch de logs para API

Como **serviço Bot**,
eu quero **enviar logs em batch para o backend**,
para que **o dashboard exiba atividade recente**.

#### Critérios de aceitação

* [ ] Buffer em memória até 50 eventos ou 10s
* [ ] `POST /api/internal/bot/logs` com array
* [ ] Descartar buffer em falha após 3 retries (não bloquear bot)
* [ ] Tipos padronizados documentados

#### Observações técnicas

* Backpressure: não bufferizar mais de 1000 eventos
* Backend de logs ainda não existe na aplicação atual; tratar como dependência antes de expor atividade real no dashboard

#### Prioridade

Média

#### Dependências

* BOT-US007
* BE-US026

---

### BOT-US026 - Tratamento centralizado de falhas

Como **desenvolvedor**,
eu quero **handler global de erros não capturados**,
para que **o processo não morra silenciosamente**.

#### Critérios de aceitação

* [ ] `unhandledRejection` e `uncaughtException` logados
* [ ] uncaughtException → shutdown graceful
* [ ] Erros de módulo isolados por mensagem (não derrubar IRC)
* [ ] Contador métrica `errors_total`

#### Observações técnicas

* Domain errors vs infra errors
* Alertar heartbeat status `degraded` após threshold

#### Prioridade

Alta

#### Dependências

* BOT-US003
* BOT-US024

---

# WebSocket com backend (MVP+)

## Objetivo

Canal opcional para push de config e comandos de sorteio.

## User Stories

### BOT-US027 - Cliente WebSocket para push de config

Como **serviço Bot**,
eu quero **receber evento `config.updated` via WebSocket**,
para que **sync seja mais rápido que polling de 60s**.

#### Critérios de aceitação

* [ ] Conectar WS autenticado com BOT token
* [ ] Evento inclui `streamerId` e `configVersion`
* [ ] Trigger resync imediato ao receber
* [ ] Fallback para polling se WS cair

#### Observações técnicas

* Reconexão com backoff
* Ping/pong 30s

#### Prioridade

Média

#### Dependências

* BE-US019, BE-US020

---

# Cache local (módulo)

## Objetivo

Camada de cache unificada no bot.

## User Stories

### BOT-US028 - Abstração de cache em memória

Como **desenvolvedor**,
eu quero **API de cache `get/set/invalidate` por namespace**,
para que **módulos não acessem Maps dispersos**.

#### Critérios de aceitação

* [ ] Namespaces: `config`, `cooldown`, `ratelimit`
* [ ] TTL configurável por chave
* [ ] Método `invalidateNamespace('config:{streamerId}')`
* [ ] Interface preparada para driver Redis futuro

#### Observações técnicas

* Pattern Strategy para InMemoryCache vs RedisCache

#### Prioridade

Média

#### Dependências

* BOT-US008

---

# Sistema de eventos interno

## Objetivo

Desacoplar módulos via event-bus interno.

## User Stories

### BOT-US029 - Event bus interno

Como **desenvolvedor**,
eu quero **pub/sub interno entre módulos**,
para que **novos recursos não acoplem IRC diretamente**.

#### Critérios de aceitação

* [ ] Eventos tipados: `chat.message`, `config.reloaded`, `irc.connected`, `irc.disconnected`
* [ ] Handlers registrados por módulo no bootstrap
* [ ] Erro em handler não interrompe outros handlers
* [ ] Async handlers aguardados em série por mensagem

#### Observações técnicas

* EventEmitter nativo ou pequena lib
* Evitar over-engineering: máximo ~10 eventos MVP

#### Prioridade

Alta

#### Dependências

* BOT-US006

---

# Channel Manager

## Objetivo

Orquestrar múltiplos canais no processo único do bot global.

## User Stories

### BOT-US030 - Gerenciador de canais ativos

Como **serviço Bot**,
eu quero **manter um contexto isolado por canal Twitch**,
para que **config e estado não vazem entre streamers**.

#### Critérios de aceitação

* [ ] Map `twitchChannelLogin → ChannelContext`
* [ ] Adicionar canal após config load + IRC join
* [ ] Remover canal ao desativar streamer (API sinaliza ou lista env)
* [ ] Métrica `active_channels` gauge

#### Observações técnicas

* MVP: lista de canais via env `ACTIVE_CHANNELS` ou fetch API lista streamers com bot enabled
* Um processo, N JOINs

#### Prioridade

Alta

#### Dependências

* BOT-US008
* BOT-US004

---

# Arquitetura modular — checklist de módulos

| Módulo | Responsabilidade | Depende de |
| --- | --- | --- |
| `commands` | Match trigger, cooldown, reply | config, queue, variables |
| `timers` | Schedule messages | config, queue |
| `moderation` | Blacklist match, action | config, queue, Helix opcional |
| `counters` | Increment, API sync | config, api-client |
| `raffles` | Entries, draw announce | config, api-client |
| `variables` | Template substitution | — |
| `sync` | Config + heartbeat | api-client |
| `twitch` | IRC I/O | — |

---

## Feature futura anotada (fora do MVP)

| Feature | Notas |
| --- | --- |
| **Música** | Integração com fila de músicas (Spotify/YouTube) via comando; módulo `music/` futuro |
| **IA** | Respostas generativas — não planejado |
| **Kick/YouTube** | Outros adapters além de `twitch/` |
| **Sandbox JS** | Scripts customizados perigosos — evitar |

---

## Checklist funcional — Bot MVP

### Contratos já prontos no app StreaminHub

- [x] CRUD backend de comandos customizados
- [x] Provisionamento de comandos padrão por streamer
- [x] CRUD backend de timers
- [x] CRUD backend de blacklist
- [x] `configVersion` por canal
- [x] Snapshot M2M de comandos
- [x] Snapshot M2M unificado de config
- [x] Suporte a `sinceVersion` com `304`
- [x] Catálogo de variáveis para admin/runtime
- [x] Catálogo de emotes do canal para composição no admin
- [x] Status frontend parcial com contagens e mensagem offline

### Lacunas no app antes do bot completo

- [ ] Endpoint real de heartbeat e persistência de status online/degraded/offline
- [ ] Backend de logs de atividade do bot
- [ ] Backend/frontend de contadores
- [ ] Backend/frontend de sorteios
- [ ] Páginas frontend finais para timers e moderação, se o admin precisar operar esses módulos antes do runtime

### Infra

- [ ] Validação de env
- [ ] Express health/ready
- [ ] Shutdown graceful
- [ ] Logs estruturados
- [ ] Tratamento global de erros

### IRC

- [ ] Conectar, JOIN, reconectar
- [ ] Parser de mensagens
- [ ] Rate limit outbound

### Sync

- [ ] API client M2M
- [ ] Config snapshot inicial
- [ ] Polling 60s configVersion
- [ ] Heartbeat 30s

### Funcionalidades

- [ ] Comandos com cooldown
- [ ] Variáveis dinâmicas
- [ ] Timers automáticos
- [ ] Blacklist + ação moderação
- [ ] Contadores + sync API
- [ ] Sorteios (entrada + draw)
- [ ] Fila com prioridades

### Observabilidade

- [ ] Logs batch para API
- [ ] Métricas básicas
- [ ] Status degraded reportado

### Qualidade

- [ ] Testes unitários parsers e cooldown
- [ ] Teste integração IRC mock
- [ ] Dockerfile e README de deploy

---

## Matriz de prioridade consolidada (Bot)

| Prioridade | Histórias |
| --- | --- |
| **Alta** | BOT-US001–002, BOT-US004–012, BOT-US014–018, BOT-US020, BOT-US023–024, BOT-US026, BOT-US029–030 |
| **Média** | BOT-US003, BOT-US013, BOT-US019, BOT-US021–022, BOT-US025, BOT-US027–028 |
| **Baixa** | BOT-US013A, extensões WS avançadas, Redis cache |

---

## Dependências externas (Bot → Backend)

| Bot US | Backend US |
| --- | --- |
| BOT-US007 | BE-US002 |
| BOT-US008 | BE-US018 |
| BOT-US009 | BE-US019 |
| BOT-US010 | BE-US016 |
| BOT-US013 | BE-US023 |
| BOT-US013A | Endpoint atual `/api/internal/bot/emotes` |
| BOT-US019 | BE-US011 |
| BOT-US021–022 | BE-US013 |
| BOT-US025 | BE-US026 |
| BOT-US027 | BE-US020 |

### Endpoints atuais relevantes

| Uso do bot/admin | Endpoint atual |
| --- | --- |
| Snapshot unificado M2M | `GET /api/internal/bot/internal/channels/:streamerId/config?sinceVersion=` |
| Snapshot de comandos M2M | `GET /api/internal/bot/internal/channels/:streamerId/commands?sinceVersion=` |
| CRUD admin de comandos | `GET/POST /api/internal/bot/commands`, `GET/PATCH/DELETE /api/internal/bot/commands/:id` |
| CRUD admin de timers | `GET/POST /api/internal/bot/timers`, `PATCH/DELETE /api/internal/bot/timers/:id` |
| CRUD admin de blacklist | `GET/POST /api/internal/bot/blacklist`, `PATCH/DELETE /api/internal/bot/blacklist/:id` |
| Catálogo de variáveis | `GET /api/internal/bot/variables` |
| Catálogo de emotes | `GET /api/internal/bot/emotes` |
| Status parcial do bot | `GET /api/internal/bot/status` |

---

## Glossário

| Termo | Definição |
| --- | --- |
| **IRC** | Protocolo de chat usado pela Twitch |
| **ChannelContext** | Objeto em memória com config + estado IRC de um canal |
| **Snapshot** | Cópia completa da config em um ponto do tempo |
| **Helix** | API HTTP oficial da Twitch para ações como timeout |
| **Backoff** | Espera crescente entre tentativas de reconexão |

---

*Documento gerado para planejamento de produto e engenharia — StreaminHub Bot MVP.*
