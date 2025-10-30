# Configuração - Twitch OAuth e IGDB API

## 0. Configurar Banco de Dados

O projeto usa LibSQL (SQLite) para armazenar dados das streams agendadas.

```bash
# As migrações serão executadas automaticamente na primeira execução
# Para criar/atualizar o banco manualmente:

npm run db:generate
npm run db:migrate
```

Este guia explica como configurar as credenciais necessárias para usar a autenticação Twitch OAuth e a API do IGDB.

## 1. Configurar Twitch OAuth

### Passos:

1. Acesse o [Twitch Developer Console](https://dev.twitch.tv/console/apps)
2. Faça login com sua conta Twitch
3. Clique em "Register Your Application"
4. Preencha os dados:
   - **Name**: Streamline (ou o nome que preferir)
   - **OAuth Redirect URLs**: `http://localhost:3000/api/auth/twitch/callback`
   - **Category**: Choose "Application Integration"
5. Clique em "Create"
6. Copie o **Client ID** e gere um **Client Secret**

### Adicionar ao .env

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Twitch OAuth Credentials
NEXT_PUBLIC_TWITCH_CLIENT_ID=seu_client_id_aqui
TWITCH_CLIENT_SECRET=seu_client_secret_aqui
NEXT_PUBLIC_TWITCH_REDIRECT_URI=http://localhost:3000/api/auth/twitch/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 2. Configurar IGDB API

### Passos:

1. Acesse o [Twitch Developer Console](https://dev.twitch.tv/console/apps)
2. Use a mesma aplicação criada anteriormente (ou crie uma nova)
3. Acesse a seção "Client ID"
4. Copie o **Client ID**

**Nota**: A API do IGDB é uma extensão da API do Twitch. Você precisará:

- Usar o mesmo **Client ID** da aplicação Twitch
- Gerar um **Access Token** seguindo estes passos:

#### Gerar Access Token:

```bash
# No terminal, execute:
curl -X POST 'https://id.twitch.tv/oauth2/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "client_id=SEU_CLIENT_ID" \
  -d "client_secret=SEU_CLIENT_SECRET" \
  -d "grant_type=client_credentials"
```

A resposta conterá um `access_token`. **IMPORTANTE**: Este token expira em aproximadamente 60 dias.

### Adicionar ao .env

Adicione as seguintes variáveis ao arquivo `.env.local`:

```env
# IGDB API Credentials
NEXT_PUBLIC_IGDB_CLIENT_ID=mesmo_client_id_do_twitch
IGDB_ACCESS_TOKEN=seu_access_token_gerado
```

## 3. Arquivo .env.local Completo

```env
# Twitch OAuth
NEXT_PUBLIC_TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
NEXT_PUBLIC_TWITCH_REDIRECT_URI=http://localhost:3000/api/auth/twitch/callback

# IGDB API
NEXT_PUBLIC_IGDB_CLIENT_ID=your_igdb_client_id
IGDB_ACCESS_TOKEN=your_igdb_access_token

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. Instalar Dependências

Execute o seguinte comando para instalar as novas dependências:

```bash
npm install
```

## 5. Executar o Projeto

```bash
npm run dev
```

## Solução de Problemas

### Token IGDB Expirado

Se o token IGDB expirar (após ~60 dias), gere um novo usando o comando curl acima.

### Erro de CORS

Certifique-se de que as URLs de redirecionamento no Twitch Developer Console correspondem exatamente ao que está no `.env.local`.

### Erro ao Buscar Jogos

Verifique se as credenciais do IGDB estão corretas no arquivo `.env.local` e se o access token não expirou.

## Recursos Úteis

- [Twitch API Documentation](https://dev.twitch.tv/docs/api/)
- [IGDB API Documentation](https://api-docs.igdb.com/#getting-started)
- [Twitch Developer Console](https://dev.twitch.tv/console/apps)

