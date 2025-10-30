# Streamline

Sua agenda gamer, simples e compartilhável.

---

## Sobre o projeto

O **Streamline** facilita a organização e o compartilhamento da sua agenda de lives e jogos na Twitch. Gerencie horários, jogos e mantenha sua comunidade sempre informada do que vai rolar!

---

## Principais funcionalidades

- **Autenticação com Twitch OAuth**  
  Faça login com a sua conta Twitch com um clique.
- **Busca de jogos pela IGDB**  
  Encontre rapidamente jogos populares e adicione à sua programação.
- **Agenda flexível**  
  Programe jogos e streams em visualizações diária, semanal ou mensal.
- **Perfil público personalizado**  
  Compartilhe sua página e mantenha sua comunidade atualizada.

---

## Tecnologias

- Next.js 15  
- TypeScript  
- React  
- Tailwind CSS & shadcn-ui  
- Twitch OAuth  
- IGDB API  
- Axios  

---

## Como rodar localmente

Pré-requisitos: [Node.js + npm](https://github.com/nvm-sh/nvm#installing-and-updating)

```sh
# 1. Clone o repositório
git clone <SEU_GIT_URL>

cd <NOME_DA_PASTA>

# 2. Instale as dependências
npm i

# 3. Configure variáveis de ambiente  
# Crie o arquivo .env.local com suas credenciais Twitch e IGDB  
# Mais detalhes em CONFIGURATION.md

# 4. Rode o servidor de desenvolvimento
npm run dev
```

---

## Editando & Colaborando

- **Via seu editor local:**  
  Clone o projeto, edite e faça push normalmente.
- **Via GitHub:**  
  Use o botão de editar (pencil) nos arquivos e submeta suas alterações.
- **Via Codespaces:**  
  Inicie um Codespace pelo botão verde "Code" e trabalhe direto do browser.

---

## Configuração

Antes de rodar, configure:

1. **Twitch OAuth** – Para login dos usuários.
2. **IGDB API** – Para busca de jogos.

Veja instruções completas em [CONFIGURATION.md](./CONFIGURATION.md).

---

Siga, compartilhe e torne seu streaming mais organizado com o **Streamline**!
