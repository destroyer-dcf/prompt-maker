# Prompt Manager

Aplicación profesional para gestionar prompts de IA en un equipo cerrado (5-6 usuarios), basada en Next.js + Supabase + Drizzle.

## Stack

- Next.js 15 (App Router) + TypeScript + React 19
- Supabase Auth (email/password, sin registro público)
- PostgreSQL + Drizzle ORM
- Tailwind CSS 4 + UI custom preparada para evolucionar a shadcn/ui

## Estado actual

Este repositorio incluye un MVP profesional alineado al plan:

- Arquitectura de rutas `auth / dashboard / admin`
- Middleware de protección de sesión y role check admin
- Schema Drizzle completo (prompts, versiones, variantes, favoritos, API keys, etc.)
- Server Actions de `auth`, `prompts`, `admin`, `api-keys`
- CRUD base de prompts (crear, editar, ver, historial)
- Panel admin inicial con invitación y gestión de estado de usuarios
- API de lectura por API key:
  - `GET /api/v1/prompts`
  - `GET /api/v1/prompts/:id`
  - `GET /api/v1/prompts/by-slug/:slug`
- Shortlinks públicos con `/p/[shortId]`
- Política de no indexación (`robots.txt` + `X-Robots-Tag`)

## Configuración local

1. Copia variables:

```bash
cp .env.example .env.local
```

2. Completa las variables de Supabase y DB en `.env.local`.

3. Instala dependencias:

```bash
npm install
```

4. Setup inicial de DB (schema + RLS + admin):

```bash
npm run db:setup
```

5. Levanta la app:

```bash
npm run dev
```

## Scripts

- `npm run dev` - desarrollo
- `npm run build` - build producción
- `npm run lint` - lint
- `npm run db:push` - aplicar schema Drizzle
- `npm run db:push:force` - aplicar schema auto-aprobando cambios
- `npm run db:rls` - aplicar políticas RLS
- `npm run db:setup` - schema + RLS + seed admin
- `npm run db:generate` - generar migraciones
- `npm run db:studio` - abrir Drizzle Studio
- `npm run seed:admin` - crear primer admin
- `npm run smoke:supabase` - verificar conexión, tablas, RLS y admin
- `npm run smoke:app` - smoke app: auth, CRUD prompt, API key routes, shortlink y notificaciones
- `npm run ready:prod` - validación final completa (lint + build + smokes)
