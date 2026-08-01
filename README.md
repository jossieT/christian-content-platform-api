# Christian Content Platform — Backend API & Database

A scalable RESTful backend service built with **NestJS**, **Prisma ORM**, and **PostgreSQL (Neon)** for managing Christian digital content including articles, devotionals, ebooks, and user libraries.

---

## 🚀 Tech Stack

* **Framework**: NestJS 11 (Node.js & TypeScript)
* **Database & ORM**: PostgreSQL (Serverless via Neon) & Prisma 6 ORM
* **Caching & Sessions**: Redis
* **Authentication**: JWT (JSON Web Tokens) with Refresh Tokens & Role-Based Access Control (`USER`, `CREATOR`, `ADMIN`)
* **Containerization**: Multi-stage Dockerfile
* **API Documentation**: Swagger / OpenAPI (`/api/v1/docs`)

---

## 📁 Project Structure

```
.
├── api/                    # NestJS REST API application
│   ├── src/                # Controllers, Services, DTOs, & Modules
│   │   ├── auth/           # Authentication & Authorization logic
│   │   ├── content/        # Articles & Devotionals management
│   │   ├── store/          # Digital bookstore & catalog
│   │   ├── library/        # User digital library & reading progress
│   │   ├── users/          # User profiles & management
│   │   └── prisma/         # Prisma client service wrapper
│   └── test/               # Unit & E2E Test suites
├── prisma/                 # Database Schema & Migrations
│   ├── schema.prisma       # Prisma Schema (Models & Relations)
│   └── migrations/         # Database migration history
├── Dockerfile              # Production multi-stage Docker build
├── docker-compose.yml      # Local development database orchestration
└── prisma.config.ts        # Prisma Configuration
```

---

## ⚙️ Getting Started (Local Development)

### 1. Prerequisites
* Node.js v20+
* Docker Desktop (for local Postgres & Redis)

### 2. Environment Setup
Copy or create a `.env` file inside `api/` (or `backend/`):

```env
DATABASE_URL="postgresql://postgres:2546@localhost:5432/christian_platform?schema=public"
REDIS_HOST="localhost"
REDIS_PORT=6379
NODE_ENV="development"
PORT=3000
API_PREFIX="api/v1"
JWT_SECRET="dev-jwt-access-secret-key-change-in-production"
JWT_REFRESH_SECRET="dev-jwt-refresh-secret-key-change-in-production"
```

### 3. Start Local Databases (PostgreSQL & Redis)
```bash
docker compose up -d
```

### 4. Run Prisma Migrations & Generate Client
```bash
npx prisma migrate dev --schema=./prisma/schema.prisma
```

### 5. Start NestJS Development Server
```bash
cd api
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`.

---

## 🐳 Docker Production Build

Build the production Docker container:
```bash
docker build -t christian-backend .
```

Run container locally:
```bash
docker run -p 3000:3000 --env-file .env christian-backend
```

---

## ☁️ Deployment (Render + Neon)

* **Database (Neon)**: Provision PostgreSQL on [Neon.tech](https://neon.tech) and set `DATABASE_URL` (Pooled) and `DIRECT_URL` (Direct).
* **Backend (Render)**: Connect repository to [Render.com](https://render.com), set Root Directory to `.`, and select **Docker** runtime environment.
