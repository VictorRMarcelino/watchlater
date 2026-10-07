# Watch Later

Aplicação web para organizar o que você quer assistir. Cadastre títulos, anotações e serviços de streaming em uma biblioteca compartilhada, com acesso protegido por conta.

## Recursos

- Cadastro, login e encerramento de sessão com Firebase Authentication.
- Criação, edição e remoção de títulos e plataformas de streaming.
- Associação de um título a uma ou mais plataformas.
- Administração de usuários e plataformas para contas com permissão de administrador.
- Interface responsiva construída como SPA em Vue.

## Tecnologias

[![Vue 3](https://img.shields.io/badge/Vue%203-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vue Router](https://img.shields.io/badge/Vue%20Router-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://router.vuejs.org/)
[![Pinia](https://img.shields.io/badge/Pinia-FFD859?style=for-the-badge&logo=pinia&logoColor=black)](https://pinia.vuejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Cloud Firestore](https://img.shields.io/badge/Cloud%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/docs/firestore)
[![SweetAlert2](https://img.shields.io/badge/SweetAlert2-7B3F00?style=for-the-badge&logo=javascript&logoColor=white)](https://sweetalert2.github.io/)

### Testes

[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Vue Test Utils](https://img.shields.io/badge/Vue%20Test%20Utils-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://test-utils.vuejs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-45BA4B?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)

## Rotas

| Caminho | Página | Acesso |
| --- | --- | --- |
| `/` | Plataformas de streaming | Administrador |
| `/shows` | Biblioteca de títulos | Conta autenticada |
| `/users` | Gerenciamento de usuários | Administrador |
| `/login` | Entrar | Público |
| `/register` | Criar conta | Público |

As rotas protegidas redirecionam visitantes para o login. A permissão administrativa é lida do campo `admin` em `users/{uid}`; as regras do Firestore impedem que o próprio usuário altere esse campo. A conta `victorrasmarcelino@gmail.com` é a conta inicial de administrador.

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
   VITE_FIREBASE_INITIAL_ADMIN_EMAIL=
   ```

3. Ative o provedor de e-mail e senha no Firebase Authentication e configure o Cloud Firestore.
4. Publique as regras de segurança antes de disponibilizar a aplicação:

   ```sh
   npx firebase-tools deploy --only firestore:rules
   ```

   Os perfis novos são gravados em `users/{uid}`. Perfis legados são migrados para esse formato no primeiro login; usuários que dependiam apenas da antiga custom claim não mantêm automaticamente a permissão e devem entrar uma vez para serem promovidos pela conta administradora inicial. Guards de rota no cliente não substituem as regras de segurança do banco.

## Desenvolvimento e validação

```sh
npm run dev           # servidor de desenvolvimento
npm run type-check    # validação TypeScript e Vue
npm run test:unit -- --run
npm run build         # validação de tipos e build de produção
npm run preview       # pré-visualização do build
```

A infraestrutura E2E usa Playwright, mas ainda não há cenários ativos. Para executar os testes, instale os navegadores com `npx playwright install` e rode `npm run test:e2e`. No CI, gere o build antes: `npm run build`.
