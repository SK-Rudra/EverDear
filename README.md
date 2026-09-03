# 💌 EverDear

**Write what matters. Share it beautifully. Keep it forever.**

A full-stack, privacy-first digital correspondence platform. Compose rich personal letters with multimedia attachments, share them through cryptographic single-use links, or broadcast anonymous thoughts on a moderated public canvas.

[Explore Architecture](#-system-architecture) • [Key Features](#-core-capabilities) • [Quick Start](#-getting-started) • [API Reference](#-health--monitoring) • [Security Model](#-security--defense-in-depth)

---

## 🧭 Overview

Traditional messaging apps optimize for speed and ephemeral consumption. **EverDear** reclaims intentionality, giving long-form digital writing the ceremony and permanence of paper correspondence.

* **Frictionless Recipient Experience:** Recipients view letters through cryptographically hashed access tokens without having to sign up or log in.
* **Granular Ownership:** Authors maintain full control—edit drafts, revoke access tokens, or trigger permanent cryptographic shredding at any time.
* **Community Commons:** An anonymous public wall running on privacy-preserving author hashing, protected by moderation tooling and automated TTL expiries.

---

## ⚡ Core Capabilities

### ✉️ Private Correspondence

* **Thematic Canvas:** Contextual themes tailored for romantic, platonic, and familial messages.
* **Draft Engine:** Real-time auto-saving with dedicated recipient, sender, and envelope fields.
* **Immutability Flags:** Explicit post-publish read-only locking prevents unintended tampering.
* **Recipient Simulation:** In-app sandbox to preview the exact letter viewport prior to publishing.

### 🔐 Zero-Friction Sharing

* **Token Hashing:** Raw access tokens are never persisted; only constant-time hashes are stored.
* **Granular Expiration:** Configurable temporal limits, view caps, and instant revocation hooks.
* **Telemetry Insights:** Transparent logs tracking first view timestamp, latest view, and aggregate reads.
* **Cascade Deletion:** Destroying a letter immediately purges associated keys, metadata, and media.

### 🖼️ Secure Media Pipeline

* **Byte-Signature Validation:** Server-side magic-number verification protects against MIME spoofing.
* **Object Isolation:** Media files route directly to private, S3-compatible Supabase buckets.
* **Authenticated Streaming:** Protected media streams prevent hotlinking and unauthenticated scraping.
* **Storage Pruning:** Automated hooks wipe linked object storage on attachment deletion.

### 🛡️ Moderated Public Wall

* **Ephemeral Thoughts:** Ephemeral micro-letters on an anonymous public feed.
* **Deterministic Privacy:** Irreversible salting ensures zero identity leaks while preserving spam detection.
* **Staff Command Center:** Role-based audit panels for flagging, queue triage, and permanent removals.
* **Report Escalation:** Built-in community flagging pipeline tied to moderator action logs.

---

## 🏗 System Architecture

```mermaid
flowchart LR
    subgraph Client["Client Tier"]
        U["User Device"]
    end

    subgraph Edge["Vercel Edge Platform"]
        W["Next.js App Router"]
        P["/api/v1 Proxy"]
    end

    subgraph Core["Compute Tier (Render)"]
        A["NestJS Modular API"]
        G["Auth & Role Guards"]
    end

    subgraph Data["Persistence Tier (Supabase)"]
        D[("PostgreSQL 18")]
        S["S3 Private Media Bucket"]
    end

    U -->|"HTTPS / Cookie Session"| W
    W --> P
    P -->|"Internal Upstream Route"| A
    A --> G
    G -->|"Prisma Client"| D
    G -->|"AWS S3 SDK Stream"| S
```

> **Origin Security Pattern:** Browser traffic interacts strictly with the Vercel edge via `/api/v1`. Next.js proxies these calls to the upstream NestJS service on Render, preserving same-origin `SameSite=Lax` cookies across cross-domain infrastructures.

---

## 🛠 Tech Stack

| Layer | Technologies | Key Highlights |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript | Server Components, dynamic streaming, zero-layout-shift UI |
| **Styling & UI** | Tailwind CSS 4, Motion, Lucide Icons | Fluid layout, accessible micro-interactions, responsive design |
| **API Framework** | NestJS 12, Express | Decoupled feature modules, dependency injection, strict typing |
| **ORM & Database** | Prisma 7, PostgreSQL 18 | Declarative schema, connection pooling, typed SQL migrations |
| **Authentication** | HTTP-only Cookies, Argon2id | Session hardening, brute-force mitigation, IP hashing |
| **Validation** | Zod, class-validator, file-type | Multi-tier input parsing and payload sanitization |
| **Media Layer** | Multer, AWS S3 SDK, Supabase Storage | Multi-part uploads, authenticated asset streams |
| **Quality** | Vitest, Supertest, ESLint, Oxlint | Deterministic end-to-end and integration suites |

---

## 📁 Repository Layout

```text
EverDear/
├── apps/
│   ├── api/                  # Backend NestJS Application
│   │   ├── prisma/           # Schema declarations & schema migrations
│   │   ├── src/
│   │   │   ├── auth/         # Cookie strategies, Argon2 hashing, guards
│   │   │   ├── config/       # Zod schema environment validation
│   │   │   ├── letters/      # Letter engine, token generation, media bindings
│   │   │   ├── media/        # Local fs & S3 storage adapters
│   │   │   ├── moderation/   # Moderation queues & administrative actions
│   │   │   └── public-wall/  # Anonymized feed with hashing filters
│   │   └── test/             # Supertest integration & E2E suite
│   └── web/                  # Frontend Next.js Application
│       └── src/
│           ├── app/          # App Router pages and layouts
│           ├── components/   # Atomic UI primitives & feature modules
│           └── lib/          # Typed API clients and utility wrappers
├── docs/                     # Architectural documentation & technical specs
└── package.json              # Monorepo workspaces configuration
```

---

## 🚀 Getting Started

### Prerequisites

Ensure the following runtimes and tools are installed locally:

* **Node.js:** `v24.x` or higher
* **Package Manager:** `npm v10+`
* **Database:** `PostgreSQL 18` (or local Docker instance)
* **Git**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/SK-Rudra/EverDear.git
cd EverDear

# 2. Install monorepo dependencies
npm ci

# 3. Provision local environment variables
cp apps/api/.env.example apps/api/.env
```

### Database Initialization

Populate your connection strings in `apps/api/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/everdear_dev?schema=public"
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/everdear_test?schema=public"
SHADOW_DATABASE_URL="postgresql://user:password@localhost:5432/everdear_shadow?schema=public"
```

Run migrations and generate the client:

```bash
# Run migrations using Prisma 7 configuration
npm run --prefix apps/api prisma:migrate

# Generate typed Prisma client
npm run --prefix apps/api prisma:generate
```

### Development Server

Start both the frontend and backend concurrently:

```bash
npm run dev
```

| Service | Address | Scope |
| :--- | :--- | :--- |
| **Web Frontend** | `http://localhost:3000` | User client, letter editor & wall |
| **API Gateway** | `http://localhost:4000/api/v1` | Core REST services |
| **API Liveness** | `http://localhost:4000/api/v1/health/live` | Process probe |
| **API Readiness** | `http://localhost:4000/api/v1/health/ready` | Database connectivity probe |

---

## 🔒 Security & Defense-in-Depth

```text
[ Incoming Request ]
        │
        ▼
[ Helmet Headers (HSTS, CSP, X-Frame-Options) ]
        │
        ▼
[ Origin Validation (CORS + Trusted Reverse-Proxy Hops) ]
        │
        ▼
[ Secure Session Guard (HttpOnly, SameSite Cookies) ]
        │
        ▼
[ Payload Sanitization (Zod / class-validator / MIME Signature) ]
        │
        ▼
[ Resource Ownership Verification (Row-Level Security Check) ]
        │
        ▼
[ Deterministic Data Layer (Argon2 / SHA-256 Hashed Secrets) ]
```

* **Zero Plaintext Tokens:** Share tokens are passed once to the author. The database stores only SHA-256 digests.
* **Header Hardening:** Helmet manages strict HTTP Strict Transport Security (HSTS) and anti-clickjacking headers.
* **Strict Runtime Sandboxing:** Production Docker images run under low-privilege, non-root system users (`node:node`).
* **Binary File Verification:** File inputs are analyzed via magic bytes using the `file-type` buffer analyzer, bypassing spoofed extensions.

---

## ⚙️ Configuration Reference

<details>
<summary>Click to view API Environment Variables</summary>

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `string` | `development` | Environment mode (`development` \| `production` \| `test`) |
| `PORT` | `number` | `4000` | Port on which the API process binds |
| `DATABASE_URL` | `string` | — | Connection URI for the main PostgreSQL cluster |
| `TRUST_PROXY_HOPS` | `number` | `1` | Reverse proxy hop count for correct upstream IP detection |
| `AUTH_IP_HASH_SECRET` | `string` | — | Cryptographic secret for hashing client authentication IPs |
| `PUBLIC_WALL_HASH_SECRET` | `string` | — | Cryptographic secret for irreversible wall identity hashing |
| `MEDIA_STORAGE_DRIVER` | `string` | `local` | Storage target (`local` for dev, `s3` for production) |
| `S3_ENDPOINT` | `string` | — | Base endpoint URI for S3 / Supabase storage |
| `S3_BUCKET` | `string` | — | Destination storage bucket identifier |
| `S3_ACCESS_KEY_ID` | `string` | — | Storage access credential |
| `S3_SECRET_ACCESS_KEY` | `string` | — | Storage secret credential |

</details>

<details>
<summary>Click to view Web Frontend Variables</summary>

| Parameter | Description | Production Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Relative base path exposed to the browser | `/api/v1` |
| `API_PROXY_TARGET` | Upstream API host used by the Next.js server proxy | `https://everdear-api.onrender.com` |

</details>

---

## 🧪 Quality & Test Engineering

The monorepo uses automated checks across code style, unit behavior, and end-to-end execution.

```bash
# Execute static analysis and style linting
npm run lint

# Execute isolated unit test suites
npm run test

# Execute end-to-end API integration tests
npm run test:e2e --workspace=api

# Run full monorepo build checks
npm run build
```

---

## 🗺 Product Roadmap

- [ ] **Custom Domain Routing:** Dedicated domains for custom white-labeled letters.
- [ ] **Account Recovery:** Self-serve email verification and password reset flows.
- [ ] **Rich Media Transcoding:** Automated client-side compression and adaptive image thumbnailing.
- [ ] **Expanded Observability:** OpenTelemetry traces and Prometheus metric scraping.
- [ ] **Mobile Portability:** Progressive Web App (PWA) manifest support.

---

## 👤 Author

**SK-Rudra**

* GitHub: [@SK-Rudra](https://github.com/SK-Rudra)
* Repository: [SK-Rudra/EverDear](https://github.com/SK-Rudra/EverDear)

---

Designed and built with care. If you find EverDear useful, please consider starring the repository.
