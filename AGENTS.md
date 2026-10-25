# Resolve Aqui

Aplicação full-stack em Next.js (App Router), React, TypeScript, Tailwind CSS v4 e Prisma com PostgreSQL.

## Estrutura

- `app/page.tsx` - interface principal migrada do protótipo React.
- `app/globals.css` - estilos globais e Tailwind CSS v4.
- `app/api/**/route.ts` - endpoints da API no próprio Next.js.
- `src/lib/auth.ts` - helpers de sessão JWT em cookie HTTP-only.
- `src/lib/prisma.ts` - instância compartilhada do Prisma.
- `prisma/schema.prisma` - modelo PostgreSQL.
- `prisma/seed.ts` - seed de categorias.
- `package.json` - scripts e dependências.

## Desenvolvimento

Requer Node.js 22+ e PostgreSQL. Execute `npm install`, copie `.env.example` para `.env`, configure `DATABASE_URL` e um `JWT_SECRET` aleatório com pelo menos 32 caracteres. Depois execute `npm run prisma:generate`, `npm run prisma:migrate -- --name init`, `npm run seed` e `npm run dev`.

## Regras

- Usar Next.js Route Handlers para APIs; não reintroduzir Express, Vite ou servidor HTTP separado.
- Nunca versionar `.env`, segredos, senhas ou credenciais.
- Senhas devem ser armazenadas apenas com hash forte.
- Perfis profissionais começam não publicados.
- Avaliações começam pendentes; nunca declarar avaliação ou profissional verificado sem um processo real de verificação.
- Ao alterar o banco, atualizar `prisma/schema.prisma` e criar uma migração.
- Executar `npm run typecheck` e `npm run build` antes de considerar mudanças validadas.
