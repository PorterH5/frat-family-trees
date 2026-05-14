# Frat Family Trees

A web app for building and visualizing fraternity family trees. Add pledge class brothers in bulk, assign big/little relationships, and see every lineage automatically rendered as an interactive tree. Invite other brothers to contribute via shareable links.

## Features

- **Chapters** — create a chapter for your fraternity (e.g. "Sigma Chi — Alpha" at Purdue).
- **Members** — add brothers individually or paste an entire pledge class at once.
- **Bulk-add parsing** — supports `First Last`, `First Last (Nickname)`, and `First Last - Big: Big Name`.
- **Big / little lineage** — assign a big to any member; the family tree updates automatically.
- **Tree visualization** — pan/zoom interactive tree built with `react-d3-tree`. Switch between the full forest and individual family lines.
- **Shareable invite links** — admins can generate invite links (with optional expiry and max uses) and share by email, text, DM, etc.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router, Server Actions) + React 19
- TypeScript, Tailwind CSS v4
- Prisma 7 + PostgreSQL
- `iron-session` for session cookies, `bcryptjs` for password hashing
- `react-d3-tree` for tree rendering
- `zod` for input validation

## Local development

### Prerequisites

- Node.js 20.19+ or 22.13+
- Docker (for the bundled Postgres) **or** any Postgres 14+ instance

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# edit .env if your Postgres URL differs or to set a custom SESSION_PASSWORD
```

Generate a strong `SESSION_PASSWORD` with:

```bash
openssl rand -base64 48
```

### 3. Start Postgres (using Docker)

```bash
docker run -d --name frat-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=frat_family_trees \
  -p 5432:5432 postgres:16-alpine
```

### 4. Apply database migrations

```bash
npx prisma migrate dev
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Any host that can run Next.js works (Vercel is the easiest). You'll need:

- A Postgres database (e.g. Neon, Supabase, RDS). Set `DATABASE_URL`.
- A random `SESSION_PASSWORD` (32+ chars).
- Run `npx prisma migrate deploy` on deploy.

## Usage walkthrough

1. Sign up at `/signup`.
2. Create a chapter at `/chapters/new`.
3. Bulk-add your pledge class from the chapter page.
4. Edit members to assign bigs, creating the lineage.
5. Click **View tree** to see the family tree visualization.
6. From **Invites**, generate a shareable link and send it to brothers.

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run start` — run built app
- `npm run lint` — ESLint
- `npx prisma studio` — visual DB explorer
- `npx prisma migrate dev` — create/apply dev migration
