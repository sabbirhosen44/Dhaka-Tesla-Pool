# 🚖 Dhaka Tesla Pool
> *Share a seat. Split the fare. Survive Dhaka traffic.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Backend: NestJS](https://img.shields.io/badge/Backend-NestJS%2011-ea2845?logo=nestjs)](https://nestjs.com/)
[![Frontend: Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black?logo=next.js)](https://nextjs.org/)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-336791?logo=postgresql)](https://www.postgresql.org/)
[![ORM: Prisma](https://img.shields.io/badge/ORM-Prisma%206-2d3748?logo=prisma)](https://www.prisma.io/)
[![Tests: 18 Passed](https://img.shields.io/badge/Tests-18%2F18%20Passed-brightgreen)](https://jestjs.io/)
[![Live Frontend](https://img.shields.io/badge/Live_Frontend-Vercel-black?logo=vercel)](https://dhaka-tesla-pool-lake.vercel.app)
[![Live Backend](https://img.shields.io/badge/Live_API-Render-46E3B7?logo=render)](https://dhaka-tesla-pool-1pr6.onrender.com/api)

---

## 🎥 1. Demo Video Link
* **Live Application:** [https://dhaka-tesla-pool-lake.vercel.app](https://dhaka-tesla-pool-lake.vercel.app)
* **Walkthrough Video (Loom):** [Click to watch the 6-Minute Loom Walkthrough Video](https://www.loom.com/) *(Paste your final Loom URL here)*

---

## 📖 2. Summary & Problem Statement

### The Banani Rush-Hour Story
**8:41 AM, Banani Road 11.**  
Jashim is leaning against **Bullet**, his three-seat, battery-powered, entirely unaffiliated “Tesla.”  
* **Nusrat**, already running late for an office sync, books a ride to **Mohakhali**.  
* Two minutes later, a stranger named **Rafiq** books almost the same route toward **Gulshan 1**.  
* The app figures out in sub-second time whether these two can share a seat, splits the fare fairly using an integer-poysha formula with a 25% discount, and allocates the seats atomically without race conditions.  
* Meanwhile, another driver, **Kabir**, pilots **Thunder** (another 3-seat EV) along the **West-North (Mirpur)** corridor. If a passenger chooses Kabir or requests an incompatible route (e.g. Banani → Mirpur), the system intelligently segregates the pools to avoid conflicting drop-offs.  
* Jashim and Kabir maintain complete authority over their trip lifecycles: **ARRIVE** at pickup $\rightarrow$ **START** trip $\rightarrow$ **COMPLETE** offload.

### Features Implemented
- ✅ **Dynamic Passenger Booking:** Select pickup, dropoff, and choose 1 to 3 seats.
- ✅ **Driver / EV Selection:** Choose specific drivers (Jashim's Bullet, Kabir's Thunder) or select Auto-Assign.
- ✅ **Fair Corridor Pooling Engine:** Overlapping trips share seats (Nusrat & Rafiq on Central Connect); divergent routes (Mirpur, Uttara) are segregated into separate pools.
- ✅ **Dynamic Real-Time Fleet Occupancy Meter:** Live per-driver seat bounds prevent overbooking.
- ✅ **Transparent Fare Calculator:** Base + Distance − 25% Pool Discount calculated in Integer Poysha.
- ✅ **Full Trip Lifecycle:** `REQUESTED` $\rightarrow$ `MATCHED` $\rightarrow$ `DRIVER_ARRIVED` $\rightarrow$ `STARTED` $\rightarrow$ `COMPLETED` (+ `CANCELLED`).
- ✅ **Driver Cockpit:** Live passenger manifest with ARRIVE, START, and COMPLETE trip controls.
- ✅ **Individual Fare Privacy:** Each passenger receives an isolated receipt (unauthorized access returns 403 Forbidden).
- ✅ **Atomic Concurrency Protection:** Zero seat overbooking under concurrent requests via `prisma.$transaction`.
- ✅ **Server-Sent Events (SSE):** Real-time event stream push for live fleet updates.
- ✅ **Multi-Container Docker:** Full-stack orchestration via Docker Compose.

---

## 📸 3. Application Screenshots

### Passenger Booking Portal & Dynamic Seat Selector
![Passenger Booking Portal](assets/passenger_portal.png)

### Driver Console Cockpit & Passenger Manifest
![Driver Console Cockpit](assets/driver_cockpit.png)

---

## 🏗️ 4. Architecture Diagram

![System Architecture](assets/architecture.png)

*The system follows a clean modular monolith: Browser client connects via HTTPS/REST and SSE to the NestJS modular backend gateway, which interacts through Prisma ORM to PostgreSQL with transactional row locking.*

---

## 🗄️ 5. Database Diagram (ERD)

![Database ERD](assets/erd.png)

*The relational schema models User roles, Vehicles, RideRequests, atomic Pools, individual PoolMembers (with poysha fare breakdown), and an append-only RideEventLog for auditing.*

---

## ⚙️ 6. Tech Stack & Justifications

| Layer | Choice | Realistic Alternatives | Why It Fits This Ride-Pooling MVP | What Would Make Us Switch |
| :--- | :--- | :--- | :--- | :--- |
| **Backend** | **NestJS 11 (Node.js)** | Express, Fastify | Strong modularity, dependency injection, and built-in validation pipes (`class-validator`) ensure clean separation of PoolEngine, Fare Math, and Auth. | Ultra-low latency microsecond gateways where Fastify raw throughput is strictly needed. |
| **Frontend** | **Next.js 16 (App Router)** | Vite + React, CRA | App Router layouts, server components, and rapid full-stack integration with built-in styling and asset handling. | Dedicated mobile app (Flutter / React Native) if native GPS hardware telemetry is required. |
| **Database** | **PostgreSQL 16** | MongoDB, MySQL, SQLite | Strong ACID compliance, relational integrity, and robust transaction isolation needed to enforce seat capacity invariants. | High-throughput unstructured telemetry where ClickHouse or Cassandra is superior. |
| **ORM** | **Prisma 6** | TypeORM, Drizzle | Schema-first migrations, type-safe generated client, and interactive transaction callbacks (`prisma.$transaction`) for atomic capacity locking. | Scenarios requiring complex custom SQL window functions or sub-millisecond query execution (Drizzle). |
| **Auth** | **Stateless JWT + Demo Switcher** | Session Cookies, OAuth | Token-based auth allows stateless horizontal API scaling. Story actor switcher enables instant persona testing without login friction. | Enterprise SSO requirements or session revocation blacklists requiring Redis. |
| **Real-time** | **Server-Sent Events (SSE)** | WebSockets, Polling | Unidirectional broadcast (server $\rightarrow$ client) is lightweight, auto-reconnecting, and avoids complex WebSocket handshake overhead for status updates. | Bidirectional in-app audio/video calling or driver-passenger chat. |
| **Testing** | **Jest + Supertest** | Vitest, Mocha | Standard NestJS testing ecosystem; in-memory dependency mocking allows rapid execution of concurrency tests without database pollution. | Pure ESM native stack switching to Vitest for speed. |
| **Container** | **Docker & Docker Compose** | Podman, Kubernetes | Mandated standard for reproducible local and evaluator evaluation in a single command. | Production multi-region orchestration requiring Kubernetes / Helm. |

---

## 📂 7. Project Structure

```
Dhaka-Tesla-Pool/
├── assets/
│   ├── architecture.png          # System Architecture Diagram
│   ├── erd.png                   # Database ERD Diagram
│   ├── passenger_portal.png      # Passenger UI Screenshot
│   └── driver_cockpit.png        # Driver UI Screenshot
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Prisma Schema (User, Vehicle, Pool, PoolMember, etc.)
│   │   └── seed.ts               # Story seed data (Jashim, Nusrat, Rafiq, Shirin, Bullet, Thunder)
│   ├── src/
│   │   ├── auth/                 # JWT Auth, RoleGuard, Demo Login
│   │   ├── common/constants/     # DHAKA_ZONES, Corridor definitions
│   │   ├── fare-calculator/      # Integer Poysha math & estimation endpoints
│   │   ├── pool-engine/          # Corridor matching heuristics & atomic capacity locks
│   │   ├── ride-request/         # Ride lifecycle FSM, cancel, privacy guards
│   │   ├── sync/                 # SSE real-time event broadcaster
│   │   └── vehicle/              # Dynamic fleet manifest & online status
│   ├── test/                     # 8 test suites, 18 automated unit & concurrency tests
│   ├── .env.example              # Backend environment template
│   └── Dockerfile                # Multi-stage production container
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── passenger/        # Passenger booking, driver picker, seat visualizer
│   │   │   └── driver/           # Driver cockpit (Arrive / Start / Complete)
│   │   ├── components/           # SeatMeter, LiveFeed, Story Actor Switcher
│   │   ├── context/              # AuthContext (JWT, active actor state)
│   │   └── lib/api.ts            # Typed REST API client
│   └── Dockerfile                # Next.js standalone runner container
├── docker-compose.yml            # Multi-container orchestration (DB, API, Web)
├── .env.example                  # Root environment template
└── README.md
```

---

## 🔐 8. Environment Variables

Create `.env` files using the committed `.env.example` templates — **never commit real secrets**.

### Root `.env.example` (Used by Docker Compose)
```env
DATABASE_URL="postgresql://postgres:password@postgres:5432/dhaka_tesla_pool?schema=public"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=dhaka_tesla_pool
POSTGRES_PORT=5432

PORT=4000
NODE_ENV=production
JWT_SECRET=super_secret_dhaka_tesla_jwt_key_2026
CORS_ORIGIN=http://localhost:3000

NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### Backend `.env.example` (Used for Local Dev)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/dhaka_tesla_pool?schema=public"
PORT=4000
NODE_ENV=development
JWT_SECRET=super_secret_dhaka_tesla_jwt_key_2026
CORS_ORIGIN=http://localhost:3000
```

---

## 🚀 9. Local Setup & Docker Instructions

### Prerequisites
- Node.js 20+, npm 10+
- Docker Desktop
- Git

---

### Option A: Docker Compose (Recommended — Full Stack in One Command)

```bash
# 1. Clone repository
git clone https://github.com/sabbirhosen44/Dhaka-Tesla-Pool.git
cd Dhaka-Tesla-Pool

# 2. Setup environment
cp .env.example .env

# 3. Build and launch all services (Database + Backend + Frontend)
docker compose up --build -d
```

* **Frontend Web App:** [http://localhost:3000](http://localhost:3000)
* **Backend API Base:** [http://localhost:4000/api](http://localhost:4000/api)
* **Swagger API Documentation:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

*Database migrations and seed data are applied automatically on initial launch.*

---

### Option B: Manual Local Development

#### 1. Database (PostgreSQL)
```bash
docker compose up postgres -d
```

#### 2. Backend (NestJS)
```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npx prisma db seed
npm run start:dev
```

#### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 10. Automated Tests & Demo Credentials

### How to Run Tests
```bash
cd backend
npm test
```

### Test Suites (8 Suites / 18 Tests — All Passing)
* `app.controller.spec.ts` — API health check and uptime.
* `auth.service.spec.ts` — Demo actor login and JWT issuance.
* `vehicle.service.spec.ts` — Dynamic capacity calculation for 3-seat EVs & online toggle.
* `fare-calculator.service.spec.ts` — Integer poysha math, 25% pool discount, Nusrat & Rafiq fares.
* `fare-calculator.controller.spec.ts` — HTTP fare quotation endpoint validation.
* `pool-engine.service.spec.ts` — Corridor matching heuristics & pool segregation.
* `pool-concurrency.spec.ts` — **Atomic transaction isolation; 3 concurrent requests competing for 1 seat with zero overbooking.**
* `ride-request.service.spec.ts` — Individual fare privacy & cross-user access rejection (403 Forbidden).

### Demo Credentials (Story Cast)
Switch between story personas instantly using the **Actor Switcher** in the top navigation bar:

| Actor | Role | Vehicle / Details |
| :--- | :--- | :--- |
| **Jashim** | Driver | **Bullet** (Tesla Model 3, 3 seats, Banani $\leftrightarrow$ Gulshan/Mohakhali corridor) |
| **Kabir** | Driver | **Thunder** (Tesla Model Y, 3 seats, Banani $\leftrightarrow$ Mirpur corridor) |
| **Nusrat** | Passenger | Books Banani $\rightarrow$ Mohakhali (Central Connect) |
| **Rafiq** | Passenger | Books Banani $\rightarrow$ Gulshan 1 (Shares Bullet with Nusrat at 25% discount) |
| **Shirin** | Passenger | Tries to take the 3rd seat or requests Banani $\rightarrow$ Mirpur (assigned to Kabir) |
| **Tanvir** | Passenger | Multi-seat bookings (1 to 3 seats) |
| **Anika** | Passenger | General corridor passenger |

---

## 🌐 11. Deployment URLs & Infrastructure

* **Live Web Application (Vercel):** [https://dhaka-tesla-pool-lake.vercel.app](https://dhaka-tesla-pool-lake.vercel.app)
* **Live Backend REST API (Render):** [https://dhaka-tesla-pool-1pr6.onrender.com/api](https://dhaka-tesla-pool-1pr6.onrender.com/api)
* **Live Interactive Swagger Docs (Render):** [https://dhaka-tesla-pool-1pr6.onrender.com/api/docs](https://dhaka-tesla-pool-1pr6.onrender.com/api/docs)
* **Local Full-Stack Deployment:** [http://localhost:3000](http://localhost:3000) (Self-contained Docker Compose Deployment)
* **Deployment Constraint Note:** In compliance with Section 6 (free-tier only), full-stack deployment is provided via both live public hosting (Vercel + Render) and a fully reproducible Docker Compose setup. On Render's free tier, the web service may spin down during periods of inactivity (cold start ~30-50s).

---

## 📡 12. API Overview

Base URL: `http://localhost:4000/api` (Swagger UI at `/api/docs`)

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/demo-login` | Public | Authenticate as any story persona (Nusrat, Jashim, etc.) |
| `GET` | `/vehicles` | JWT | List online vehicles with live seat occupancy |
| `PATCH` | `/vehicles/:id/status` | Driver | Toggle driver online/offline status |
| `POST` | `/ride-requests` | Passenger | Create ride request (zone, seats, optional preferred driver) |
| `GET` | `/ride-requests/:id` | Passenger | Get own ride status & isolated fare receipt (403 for others) |
| `PATCH` | `/ride-requests/:id/cancel` | Passenger | Cancel ride request and release vehicle seats |
| `GET` | `/fare-calculator/estimate` | JWT | Get real-time fare quotation for zone route |
| `GET` | `/pool-engine/pools` | Driver | View active pools assigned to driver |
| `PATCH` | `/pool-engine/pools/:id/arrive` | Driver | Mark driver arrived at pickup |
| `PATCH` | `/pool-engine/pools/:id/start` | Driver | Transition pool to started |
| `PATCH` | `/pool-engine/pools/:id/complete` | Driver | Complete trip and offload passengers |
| `GET` | `/sync/events` | Public | Server-Sent Events (SSE) live event stream |

---

## ⚖️ 13. Key Decisions, Trade-Offs, Limitations & Next Improvements

### Key Decisions & Trade-Offs
| Decision | Rationale | Trade-Off |
| :--- | :--- | :--- |
| **Zone Corridor Segregation** | Pre-defined Dhaka corridors (Central, North, West) keep matching deterministic and testable without external map API billing. | Does not support arbitrary lat/long coordinates. |
| **Modular Monolith** | Single deployable unit simplifies transactional consistency for pool reservations without distributed 2PC or Saga orchestrators. | Scaled as a single unit rather than independent microservices. |
| **SSE over WebSockets** | Zero-handshake HTTP streaming satisfies unidirectional telemetry needs with lower overhead. | Client cannot push data over the same channel; REST used for client actions. |
| **Prisma Interactive Transactions** | Native database-level serializable isolation guarantees zero seat overbooking. | Higher DB lock duration compared to optimistic locking under extreme scale. |

### Known Limitations
- Fares are simulated via integer poysha calculations without a third-party payment gateway integration.
- Zones are represented as discrete Dhaka corridor strings rather than dynamic GPS polylines.
- JWT access tokens are stored in local storage for demo convenience without silent refresh-token rotation.

### Next Improvements
- PostGIS integration for geospatial radius matching and route polyline overlap detection.
- WebSockets for bidirectional driver-passenger instant messaging.
- Optimistic concurrency control (version column) to reduce row lock contention under 100K+ requests.
- Refresh token rotation and Redis token blacklisting.

---

## 🗺️ 14. Fare Model — Transparent & Testable

```
passengerFare = baseFare + (distanceKm × ratePerKm) − poolDiscount
```

* **Currency:** Stored strictly in **Integer Poysha** ($1\text{ BDT} = 100\text{ poysha}$) to eliminate IEEE-754 floating-point rounding bugs (`0.1 + 0.2 ≠ 0.3`).
* **Base Fare:** $5,000\text{ poysha}$ ($50.00\text{ BDT}$).
* **Distance Rate:** $2,000\text{ poysha/km}$ ($20.00\text{ BDT/km}$).
* **Pool Discount:** Exactly $25\%$ of $(baseFare + distanceFare)$ rounded via `Math.round()`.

### Hand-Checkable Calculation:
**Nusrat: Banani $\rightarrow$ Mohakhali (4 km)**
* Base Fare = $5,000\text{ poysha}$
* Distance Fare = $4\text{ km} \times 2,000 = 8,000\text{ poysha}$
* Subtotal = $13,000\text{ poysha}$
* Pool Discount ($25\%$) = $13,000 \times 0.25 = 3,250\text{ poysha}$
* **Final Fare = $9,750\text{ poysha}$ ($97.50\text{ BDT}$)**

---

## 🌀 15. Concurrency Model & Race Condition Protection

**The Concurrency Problem:** Bullet has 1 seat remaining. Nusrat and Shirin both attempt to book it at the exact same millisecond.

### Current Implementation:
```typescript
// pool-engine.service.ts
return await this.prisma.$transaction(async (tx) => {
  const freshPool = await tx.pool.findUnique({
    where: { id: pool.id },
  });

  if (freshPool.occupiedSeats + seatsRequested > freshPool.capacity) {
    throw new ConflictException('Vehicle capacity exceeded');
  }

  await tx.pool.update({
    where: { id: pool.id },
    data: { occupiedSeats: { increment: seatsRequested } },
  });

  return await tx.poolMember.create({ ... });
});
```
By wrapping capacity verification and seat increment in an interactive database transaction (`prisma.$transaction`), PostgreSQL enforces serializability. The first request commits; the second fails gracefully with an HTTP 409 Conflict.

---

## 🌿 16. Git Workflow & Branching Strategy

The repository follows the assessment-mandated long-lived branching structure:

```
master          <-- Fully integrated production MVP
pre-release     <-- Cut from master for integration, Docker & documentation checks
release/v1.0.0  <-- Tagged v1.0.0 official release branch
```

### Feature Branches in Git History:
- `feature/backend-scaffold-and-db`: NestJS scaffolding, Prisma schema, PostgreSQL seed data.
- `feature/swagger-and-api-docs`: Swagger OpenAPI docs and global validation pipes.
- `feature/fare-calculator-and-zones`: Poysha math engine and 7 Dhaka zone corridors.
- `feature/auth-and-roles`: JWT authentication, RoleGuard, and demo login.
- `feature/vehicle-and-manifest`: Dynamic fleet capacity tracking and driver status toggle.
- `feature/ride-request-and-pool-engine`: Corridor matching and atomic transaction locks.
- `feature/concurrency-and-lifecycle-tests`: 18 automated unit and race-condition tests.
- `feature/frontend-ui`: Next.js 16 passenger booking portal, driver cockpit, and live telemetry.
- `feature/concurrency-isolation-and-fleet-selection`: Multi-driver fleet selection and dynamic per-vehicle capacity.

---

## 🤖 17. AI Usage Disclosure

In compliance with Section 8 of the assessment guidelines:
* **Tools Used:** Gemini / Claude via Antigravity IDE for code scaffolding, repetitive DTO generation, and test suite boilerplate.
* **One Accepted Suggestion:** Utilizing interactive transaction callbacks (`prisma.$transaction(async tx => ...)`) instead of sequential promises. This ensured that seat counts are re-verified inside the transaction boundary before locking.
* **One Rejected Suggestion:** AI initially suggested using Dijkstra's algorithm over an ad-hoc graph for zone navigation. This was rejected in favor of a clean, testable corridor-mapping dictionary (`CORRIDOR_MAP`), which keeps matching deterministic, explainable, and zero-dependency.
* **Ownership Statement:** All database designs, concurrency invariants, business logic, state machines, and tests are thoroughly understood, fully debugged, and defended by the author.

---

## 🚀 18. Bonus: "If Oi Tesla Goes Viral" (Scale to 1M Passengers & 100K Drivers)

1. **Geospatial Proximity (PostGIS):** Migrate predefined zones to PostGIS `ST_DWithin` spatial indexes for real-time radius matching.
2. **Decoupled Matching Engine (BullMQ):** Move ride matching out of the synchronous HTTP request cycle into an async worker queue.
3. **Optimistic Locking & In-Memory Slots:** Use Redis Lua scripts to atomically claim seats in memory before persisting to PostgreSQL.
4. **Read Replicas:** Direct all driver manifest and history queries to read replicas.
5. **Idempotency & Rate Limiting:** Enforce distributed token-bucket rate limits per user to prevent denial-of-service during peak rush hour.

---

## 📄 19. License

Distributed under the MIT License. Developed for the **Dhaka Tesla Pool Engineering Assessment**.
