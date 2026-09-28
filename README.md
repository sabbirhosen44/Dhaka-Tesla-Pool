# 🚖 Dhaka Tesla Pool
> *Share a seat. Split the fare. Survive Dhaka traffic.*

---

## 📖 1. Project Overview & Problem Statement

### The Banani Rush-Hour Story
**8:41 AM, Banani Road 11.**  
Jashim is leaning against **Bullet**, his three-seat, battery-powered, entirely unaffiliated “Tesla.”  
- **Nusrat**, already late, books a ride to **Mohakhali**.
- Two minutes later, a total stranger named **Rafiq** books almost the same route to **Gulshan 1**.
- The system must figure out in sub-second time whether these two can share a seat, split the fare fairly, and survive a ten-minute ride without any awkwardness.
- Thirty seconds later, **Shirin** attempts to grab the last remaining seat, testing the vehicle's capacity boundaries.
- **Jashim** needs to know who is actually riding, their pickup sequence, and when he can start the trip.
- Each passenger must see their own fare and status—not anyone else’s.

### The Product Goal
Build an MVP ride-pooling platform for three core actors:
1. **Passenger** (Nusrat, Rafiq, Shirin)
2. **Driver / Tesla** (Jashim, Bullet — 3 seats fixed capacity)
3. **Pool / Ride Split** (atomic seat allocation, individual transparent fares, corridor matching)

---

## 🛠️ 2. Proposed Tech Stack

| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router) | High-performance React framework with server components and clean route separation for Passenger and Driver views. |
| **Backend** | NestJS (Modular Monolith) | Robust TypeScript backend with clean module boundaries (Auth, RideRequest, PoolEngine, Vehicle, FareCalculator). |
| **Database** | PostgreSQL + Prisma ORM | Relational ACID compliance to enforce seat capacity constraints and transactional row-level locking. |
| **Orchestration** | Docker & Docker Compose | Containerized reproducible environment for API, database, and web client. |

---

## 📁 3. Proposed Folder Structure

```text
Dhaka Tesla Pool/
├── .gitignore                      # Ignore patterns for Node, Prisma, Next.js, and Docker
├── .env.example                    # Environment variable template
├── docker-compose.yml              # Container orchestration (App + Backend + DB)
├── README.md                       # Project overview, proposed structure, setup instructions
│
├── backend/                        # NestJS Modular Monolith API
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── prisma/
│   │   ├── schema.prisma           # Prisma schema with Poysha math & constraints
│   │   ├── migrations/             # Timestamped relational migrations
│   │   └── seed.ts                 # Seeds Jashim, Bullet, Nusrat, Rafiq, Shirin
│   └── src/
│       ├── main.ts                 # Application bootstrap with global validation & CORS
│       ├── app.module.ts           # Root module aggregating feature modules
│       ├── common/                 # Shared guards, filters, interceptors, and zone constants
│       └── modules/
│           ├── auth/               # Actor authentication & profile switching
│           ├── ride-request/       # Ride request placement, status tracking, individual fare receipts
│           ├── pool-engine/        # Corridor matching heuristics and atomic capacity locks
│           ├── vehicle/            # Bullet manifest and real-time seat availability
│           └── fare-calculator/    # Transparent formula (Base + Distance - Pool Discount)
│
└── frontend/                       # Next.js (App Router) Web Client
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    └── src/
        ├── app/
        │   ├── layout.tsx          # Root layout with responsive UI shell
        │   ├── page.tsx            # Interactive story switcher (Nusrat, Rafiq, Shirin, Jashim)
        │   ├── passenger/          # Passenger booking and trip lifecycle tracking
        │   └── driver/             # Jashim's driver console and Bullet manifest
        ├── components/
        │   ├── shared/             # Stat cards, badges, route maps
        │   ├── passenger/          # Route selector, fare breakdown, status stepper
        │   └── driver/             # Passenger list, seat occupancy meter, trip actions
        └── lib/
            ├── api.ts              # Typed API client for NestJS backend
            └── types.ts            # Shared domain interfaces and DTOs
