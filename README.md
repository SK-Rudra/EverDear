<div align="center">

# 💌 EverDear

### Write what matters. Share it beautifully. Keep it forever.

EverDear is a full-stack digital letter-writing platform for creating beautiful private letters with photos and videos, sharing them through secure links, and posting anonymous messages on a moderated public wall.

[![Continuous Integration](https://github.com/SK-Rudra/EverDear/actions/workflows/ci.yml/badge.svg)](https://github.com/SK-Rudra/EverDear/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-12-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Full_Stack-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[**Open EverDear**](https://everdear-web.vercel.app) ·
[**API Health**](https://everdear-api.onrender.com/api/v1/health/live) ·
[**Readiness Check**](https://everdear-api.onrender.com/api/v1/health/ready)

</div>

---

## About EverDear

EverDear brings the emotional experience of traditional letters into a modern, secure, and visually expressive web application.

A user can write a letter for a loved one, friend, or family member, attach meaningful photos or videos, preview the recipient experience, and create a private link. The recipient can open that link without creating an account.

EverDear also includes an anonymous public wall where visitors can share short messages. Reports, moderation tools, role-based permissions, and audit history help keep the community safe.

> EverDear was inspired by World Letter Day and the idea that meaningful words deserve a thoughtful digital home.

## Live application

| Service | Address | Hosting |
| --- | --- | --- |
| Web application | [everdear-web.vercel.app](https://everdear-web.vercel.app) | Vercel |
| Production API | [everdear-api.onrender.com](https://everdear-api.onrender.com/api/v1/health/live) | Render |
| PostgreSQL | Private managed database | Supabase |
| Media storage | Private S3-compatible bucket | Supabase Storage |

> The API currently uses free hosting and may require a short cold start after a period of inactivity.

## Features

### Private letters

- Create personal digital letters
- Loved, Friend, and Family visual themes
- Automatic draft saving
- Dedicated recipient and sender fields
- Private recipient preview
- Read-only protection after publishing
- Permanent owner-controlled deletion

### Photos and videos

- Upload image and video attachments
- Server-side file signature and MIME validation
- Configurable file-size and file-count limits
- Private S3-compatible object storage
- Authenticated media streaming
- Automatic attachment cleanup after deletion

### Secure sharing

- Generate private recipient links
- Store only hashed share tokens
- Regenerate or revoke existing links
- Optional link expiration
- Track first view, latest view, and view count
- Automatically invalidate links when letters are deleted

### Anonymous public wall

- Publish short anonymous messages
- Paginated public message feed
- Privacy-preserving author hashing
- Community reporting
- Automatic content expiration
- Protected moderation workflows

### Administration and moderation

- Moderator and administrator roles
- Review pending, published, hidden, and removed messages
- Resolve community reports
- Hide inappropriate content
- Administrator-only permanent removal
- Complete moderation audit history

### Production readiness

- Environment configuration validation
- Liveness and database-readiness endpoints
- PostgreSQL migration validation
- Docker production images
- Non-root container runtime
- Automated lint, unit, E2E, build, and container checks
- Vercel same-origin API proxy for secure browser sessions

## Application architecture

```mermaid
flowchart TD
    U["User browser"] --> W["Next.js web application on Vercel"]
    W -->|"Same-origin /api/v1 proxy"| A["NestJS API on Render"]
    A --> D[("Supabase PostgreSQL")]
    A --> S["Private Supabase S3 storage"]
```

The browser communicates with `/api/v1` on the Vercel domain. Next.js securely proxies those requests to the Render API. This keeps authentication cookies on the same browser origin while the API independently accesses PostgreSQL and private media storage.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Interface | Motion, Lucide React, custom responsive design system |
| Backend | NestJS 12, Express, TypeScript |
| Database | PostgreSQL 18, Prisma ORM 7, Prisma PostgreSQL adapter |
| Authentication | Secure HTTP-only cookies, Argon2 password hashing |
| Validation | Zod, class-validator, class-transformer |
| Media | Multer, file-type, AWS S3 SDK |
| Security | Helmet, CORS, ownership guards, role guards |
| Testing | Vitest, Supertest, NestJS Testing |
| Quality | ESLint, Oxlint, Prettier |
| Deployment | Vercel, Render, Supabase, Docker, GitHub Actions |

## Repository structure

```text
EverDear/
├── .github/
│   └── workflows/              # CI and production build workflows
├── apps/
│   ├── api/
│   │   ├── prisma/             # Prisma schema and migrations
│   │   ├── src/
│   │   │   ├── auth/           # Authentication and authorization
│   │   │   ├── config/         # Environment validation
│   │   │   ├── letters/        # Letters, attachments, and sharing
│   │   │   ├── media/          # Local and S3 media storage
│   │   │   ├── moderation/     # Staff moderation workflows
│   │   │   ├── prisma/         # Prisma service
│   │   │   └── public-wall/    # Anonymous public messages
│   │   ├── test/               # API E2E tests
│   │   └── Dockerfile
│   └── web/
│       ├── src/
│       │   ├── app/             # Next.js App Router pages
│       │   ├── components/      # UI and feature components
│       │   └── lib/             # API client and shared utilities
│       └── Dockerfile
├── docs/                        # Project documentation
├── packages/                    # Shared workspace packages
├── package.json                 # Monorepo scripts
└── package-lock.json
```

## Getting started

### Prerequisites

Install the following software:

- Node.js 24
- npm
- PostgreSQL 18
- Git

Docker is optional for local development.

### 1. Clone the repository

```bash
git clone https://github.com/SK-Rudra/EverDear.git
cd EverDear
```

### 2. Install dependencies

```bash
npm ci
```

### 3. Create the API environment file

On macOS or Linux:

```bash
cp apps/api/.env.example apps/api/.env
```

On Windows PowerShell:

```powershell
Copy-Item `
  .\apps\api\.env.example `
  .\apps\api\.env
```

Update `apps/api/.env` with your local PostgreSQL credentials and secure development secrets.

Never commit `.env` files or real credentials.

### 4. Configure PostgreSQL

Create development and test databases, then configure these values:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/everdear_dev?schema=public"
TEST_DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/everdear_test?schema=public"
SHADOW_DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/everdear_shadow?schema=public"
```

### 5. Generate Prisma Client

```bash
cd apps/api
npx prisma generate --config prisma7.config.ts
cd ../..
```

### 6. Apply database migrations

```bash
cd apps/api
npx prisma migrate deploy --config prisma7.config.ts
cd ../..
```

### 7. Start the application

```bash
npm run dev
```

The services will be available at:

| Service | Local address |
| --- | --- |
| Web application | `http://localhost:3000` |
| API | `http://localhost:4000/api/v1` |
| API liveness | `http://localhost:4000/api/v1/health/live` |
| API readiness | `http://localhost:4000/api/v1/health/ready` |

## Environment variables

### API variables

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Application environment |
| `PORT` | API listening port |
| `DATABASE_URL` | PostgreSQL runtime connection |
| `TEST_DATABASE_URL` | Isolated E2E test database |
| `SHADOW_DATABASE_URL` | Prisma development shadow database |
| `WEB_ORIGIN` | Allowed frontend origins |
| `TRUST_PROXY_HOPS` | Trusted reverse-proxy hop count |
| `AUTH_IP_HASH_SECRET` | Secret used for authentication IP hashing |
| `PUBLIC_WALL_HASH_SECRET` | Secret used for privacy-preserving wall hashes |
| `MEDIA_STORAGE_DRIVER` | `local` for development or `s3` for production |
| `MEDIA_STORAGE_ROOT` | Local media directory |
| `S3_ENDPOINT` | S3-compatible storage endpoint |
| `S3_REGION` | Storage region |
| `S3_BUCKET` | Private media bucket name |
| `S3_ACCESS_KEY_ID` | S3 access key |
| `S3_SECRET_ACCESS_KEY` | S3 secret key |
| `S3_FORCE_PATH_STYLE` | Enables path-style S3 requests when required |

Generate different random values of at least 32 characters for the two hashing secrets.

### Web variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Browser-visible API base path |
| `API_PROXY_TARGET` | Server-side production API target |

Production Vercel configuration:

```dotenv
NEXT_PUBLIC_API_URL=/api/v1
API_PROXY_TARGET=https://everdear-api.onrender.com
```

Do not add quotation marks around environment-variable values in hosting dashboards.

## Available scripts

Run these commands from the repository root.

| Command | Description |
| --- | --- |
| `npm run dev` | Start the web application and API together |
| `npm run dev:web` | Start only the Next.js development server |
| `npm run dev:api` | Start only the NestJS development server |
| `npm run lint` | Run frontend and backend lint checks |
| `npm run test` | Run API unit tests |
| `npm run test:e2e --workspace=api` | Run API E2E tests |
| `npm run build` | Build both production applications |

Additional API commands:

```bash
npm run test:watch --workspace=api
npm run test:cov --workspace=api
npm run format --workspace=api
```

## Testing and quality assurance

Run the complete local verification suite:

```bash
npm run lint
npm run test
npm run test:e2e --workspace=api
npm run build
```

The E2E suite covers:

- API health checks
- Authentication lifecycle
- Letter ownership and deletion
- Attachment protection and streaming
- Private link publishing, tracking, regeneration, and revocation
- Anonymous wall publishing and reporting
- Moderator and administrator authorization
- Moderation decisions and audit logging

GitHub Actions runs validation from a clean checkout with an isolated PostgreSQL service before changes are merged.

## Security design

EverDear applies defense in depth across the application:

- Passwords are hashed with Argon2
- Sessions use secure HTTP-only cookies
- Production browser requests use a same-origin API proxy
- Share tokens are stored as hashes
- Database operations verify resource ownership
- Moderation endpoints require explicit staff roles
- Uploaded files are checked using detected file signatures
- Private media is streamed through authorized API endpoints
- Production configuration is strictly validated at startup
- Security headers are applied through Helmet
- Secrets are stored only in deployment environment variables
- Runtime containers use a non-root user

Security-sensitive values must never be committed, printed in logs, or placed inside `.env.example`.

## Health monitoring

The API exposes two health endpoints:

| Endpoint | Purpose |
| --- | --- |
| `/api/v1/health/live` | Confirms that the API process is running |
| `/api/v1/health/ready` | Confirms that the API and PostgreSQL are available |

Deployment platforms should use the liveness route for process health checks. Use the readiness route when database availability must also be verified.

## Deployment

### Frontend

The Next.js application is deployed to Vercel using `apps/web` as the project root.

### API

The NestJS application is deployed to Render using:

- Runtime: Docker
- Build context: repository root
- Dockerfile: `apps/api/Dockerfile`
- Health check: `/api/v1/health/live`
- Production port: `4000`

### Database and storage

Supabase provides:

- Managed PostgreSQL
- A private S3-compatible media bucket
- Session-mode database connectivity for Prisma migrations
- Transaction-mode or session-mode connectivity for runtime use

Apply new production migrations before deploying code that depends on them:

```bash
cd apps/api
npx prisma migrate deploy --config prisma7.config.ts
```

## Contribution workflow

1. Create a branch from the latest `main`.
2. Make one focused change.
3. Run linting, unit tests, E2E tests, and production builds.
4. Push the branch.
5. Open a pull request.
6. Merge only after all required checks pass.

Example:

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/my-change
```

## Roadmap

Potential future improvements include:

- Custom production domain
- Email verification
- Password recovery
- User account deletion
- Self-service deletion of public-wall messages
- Advanced media processing and thumbnails
- Expanded observability and analytics
- Native mobile experience

## Author

Created by [SK-Rudra](https://github.com/SK-Rudra).

If EverDear inspires you, consider giving the repository a star.

---

<div align="center">

**EverDear — because meaningful words deserve more than a message bubble.**

</div>
