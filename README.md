# Watch Later

Aplicação web para organizar o que você quer assistir. Cadastre títulos, anotações e serviços de streaming em uma biblioteca compartilhada, com acesso protegido por conta.

## Recursos

- Cadastro, login e encerramento de sessão com Firebase Authentication.
- Criação, edição e remoção de títulos e plataformas de streaming.
- Associação de um título a uma ou mais plataformas.
- Administração de usuários e plataformas para contas com permissão de administrador.
- Interface responsiva construída como SPA em Vue.

## Tecnologias

Vue 3 · TypeScript · Vite · Vue Router · Pinia · Tailwind CSS 4 · Firebase Authentication · Cloud Firestore · SweetAlert2

Testes: Vitest, Vue Test Utils e Playwright.

## Rotas

| Caminho | Página | Acesso |
| --- | --- | --- |
| `/` | Plataformas de streaming | Administrador |
| `/shows` | Biblioteca de títulos | Conta autenticada |
| `/users` | Gerenciamento de usuários | Administrador |
| `/login` | Entrar | Público |
| `/register` | Criar conta | Público |

As rotas protegidas redirecionam visitantes para o login. A permissão administrativa usa a custom claim `admin` do Firebase Authentication, que deve ser concedida em um ambiente confiável, fora do cliente.

## Configuração

Requisitos: Node.js `^22.18.0` ou `>=24.12.0` e npm.

1. Instale as dependências e crie seu arquivo de ambiente:

   ```sh
   npm install
   cp .env.example .env
   ```

2. Preencha no `.env` as credenciais de um projeto Firebase:

   ```dotenv
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```

3. Ative o provedor de e-mail e senha no Firebase Authentication e configure o Cloud Firestore e suas regras de acesso. Guards de rota no cliente não substituem as regras de segurança do banco.

## Desenvolvimento e validação

```sh
npm run dev           # servidor de desenvolvimento
npm run type-check    # validação TypeScript e Vue
npm run test:unit -- --run
npm run build         # validação de tipos e build de produção
npm run preview       # pré-visualização do build
```

A infraestrutura E2E usa Playwright, mas ainda não há cenários ativos. Para executar os testes, instale os navegadores com `npx playwright install` e rode `npm run test:e2e`. No CI, gere o build antes: `npm run build`.
