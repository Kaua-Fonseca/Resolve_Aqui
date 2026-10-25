<div align="center">
  <img src="docs/banner-resolve-aqui.png" alt="Resolve Aqui — Plataforma de serviços profissionais" width="100%">
</div>

# Resolve Aqui

Plataforma para encontrar profissionais locais, consultar perfis e avaliações e entrar em contato diretamente.

## Tecnologias

- **Next.js App Router**: frontend e backend na mesma aplicação.
- React + TypeScript.
- Tailwind CSS v4.
- PostgreSQL + Prisma ORM.
- bcryptjs para hash de senhas e JWT em cookie HTTP-only para sessão inicial.

Não há servidor Express ou Vite separado: os endpoints são implementados em `app/api`.

## Requisitos

- Node.js 22 ou superior.
- PostgreSQL instalado e em execução.

## Configuração local

1. Na raiz do projeto, execute `npm install`.
2. Copie `.env.example` para `.env`.
3. Ajuste `DATABASE_URL` para as credenciais locais do PostgreSQL.
4. Gere um segredo aleatório de pelo menos 32 caracteres para `JWT_SECRET`.
5. Crie o banco de dados `resolve_aqui`.
6. Execute `npm run prisma:generate`.
7. Crie as tabelas: `npm run prisma:migrate -- --name init`.
8. Cadastre as categorias: `npm run seed`.
9. Inicie o projeto: `npm run dev`.
10. Acesse http://localhost:3000.

## Painel administrativo

O painel fica em `/admin` e só permite acesso a contas ativas cujo papel `ADMIN` esteja confirmado no PostgreSQL. Nele o administrador pode:

- ver totais de usuários, profissionais, comentários, pendências e categorias;
- **excluir usuários** (contas ADMIN são protegidas);
- **publicar, ocultar, verificar ou excluir perfis profissionais** (perfis novos ficam ocultos até o admin publicar);
- **publicar, ocultar ou excluir comentários/avaliações**;
- **adicionar e excluir categorias**;
- editar as informações essenciais do sistema (nome, e-mail de suporte, cidade padrão e descrição).

Todas as rotas `/api/admin/*` revalidam o papel ADMIN no banco a cada chamada.

### Criando o administrador

Opção 1 (recomendada): defina `ADMIN_EMAIL`, `ADMIN_PASSWORD` (mín. 8 caracteres) e, se quiser, `ADMIN_NAME` no `.env` e rode `npm run seed`. A conta é criada (ou promovida) como ADMIN.

Opção 2: cadastre a conta pelo site e promova-a. No PowerShell, na raiz do projeto:

```powershell
$env:ADMIN_EMAIL="seu-email-de-cadastro@example.com"
npm run admin:promote
Remove-Item Env:ADMIN_EMAIL
```

Depois, saia e entre novamente. Administradores são enviados direto para `/admin` ao fazer login.

## Diagnóstico

Abra http://localhost:3000/api/health: ele informa se o banco está conectado, se `JWT_SECRET` está configurado e quantos usuários/categorias existem. Erros de cadastro/login aparecem com detalhes no terminal onde o `npm run dev` está rodando.

## Endpoints implementados

- `GET /api/health`
- `GET /api/categories`
- `GET /api/professionals?q=&category=&city=&neighborhood=&page=&limit=`
- `GET /api/professionals/:slug`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/account/favorites`
- `PUT /api/account/favorites/:professionalId`
- `DELETE /api/account/favorites/:professionalId`
- `POST /api/account/reviews`
- `GET` e `PATCH /api/account/professional` (perfil do próprio profissional, avaliações recebidas e fotos)
- `POST /api/account/professional/images` (foto de perfil `AVATAR` ou foto de trabalho `WORK`, multipart) e `DELETE /api/account/professional/images/:imageId`
- `GET /api/images/:imageId` (imagens de perfis publicados são públicas; de perfis ocultos, só dono e admin)
- `GET /api/cities` (cidades com profissionais publicados, usadas nas sugestões)
- `PATCH /api/admin/reviews/:reviewId` (somente administrador)
- `DELETE /api/admin/reviews/:reviewId/delete` (somente administrador)
- `DELETE /api/admin/users/:userId` (somente administrador)
- `PATCH` e `DELETE /api/admin/professionals/:professionalId` (publicar/verificar/excluir; somente administrador)
- `POST /api/admin/categories` e `DELETE /api/admin/categories/:categoryId` (somente administrador)
- `GET /api/admin/overview` e `GET/PUT /api/admin/settings` (somente administrador)

## Estado e cuidados

O front-end (`app/page.tsx`) usa os endpoints reais: cadastro, login, restauração de sessão, busca, perfil público, favoritos, avaliações e painel do profissional. A sessão dura 7 dias (cookie HTTP-only). As fotos ficam no PostgreSQL (tabela `ProfessionalImage`, até 3 MB cada e 12 fotos de trabalho por profissional); para muito tráfego, vale migrar para um storage de arquivos (S3/Cloudinary). Ainda faltam recuperação de senha, testes automatizados e revisão de proteção CSRF/renovação de sessão antes de produção.

As senhas são armazenadas como hashes bcrypt (não em texto puro). Nunca publique o arquivo `.env` nem coloque segredos no frontend.
