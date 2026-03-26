# WorkNest — Architecture Diagram

## System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                             │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    React Frontend (Vite)                    │   │
│   │                                                             │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│   │  │  Login   │  │Dashboard │  │ Project  │  │ Members  │   │   │
│   │  │ Register │  │          │  │  Detail  │  │ Settings │   │   │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │   │
│   │                                                             │   │
│   │  ┌─────────────────────┐   ┌──────────────────────────┐    │   │
│   │  │  TanStack Query     │   │     Socket.IO Client     │    │   │
│   │  │  (API state mgmt)   │   │   (real-time updates)    │    │   │
│   │  └─────────────────────┘   └──────────────────────────┘    │   │
│   │                                                             │   │
│   │  ┌──────────────────────────────────────────────────────┐   │   │
│   │  │              Axios (HTTP requests + JWT header)      │   │   │
│   │  └──────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                          │ HTTP/REST          │ WebSocket
                          ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       NODE.JS BACKEND (Express)                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                        Middleware                            │   │
│  │   authenticate (JWT verify) → authorize (role check)        │   │
│  │   catchAsync → errorHandler                                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  ┌───────────┐ ┌───────────┐ │ ┌───────────┐ ┌───────────┐         │
│  │   Auth    │ │  Tenant   │ │ │  Project  │ │   Task    │         │
│  │  Routes   │ │  Routes   │ │ │  Routes   │ │  Routes   │         │
│  └─────┬─────┘ └─────┬─────┘ │ └─────┬─────┘ └─────┬─────┘         │
│        │             │       │       │             │               │
│  ┌─────▼─────┐ ┌─────▼─────┐ │ ┌─────▼─────┐ ┌─────▼─────┐         │
│  │   Auth    │ │  Tenant   │ │ │  Project  │ │   Task    │         │
│  │ Controller│ │Controller │ │ │Controller │ │Controller │         │
│  └─────┬─────┘ └─────┬─────┘ │ └─────┬─────┘ └─────┬─────┘         │
│        │             │       │       │             │               │
│  ┌─────▼─────┐ ┌─────▼─────┐ │ ┌─────▼─────┐ ┌─────▼─────┐         │
│  │   Auth    │ │  Tenant   │ │ │  Project  │ │   Task    │         │
│  │  Service  │ │  Service  │ │ │  Service  │ │  Service  │         │
│  └─────┬─────┘ └─────┬─────┘ │ └─────┬─────┘ └─────┬─────┘         │
│        │             │       │       │             │               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     Mongoose ODM                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Socket.IO Server                           │   │
│  │   join-project / leave-project                               │   │
│  │   task-created / task-updated / task-deleted                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        MongoDB Atlas                                │
│                                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│   │  Tenant  │  │   User   │  │ Project  │  │   Task   │           │
│   │          │  │tenantId  │  │tenantId  │  │tenantId  │           │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Authentication Flow
```
User submits login form
  → POST /api/auth/login
    → authenticate credentials (bcrypt compare)
      → sign JWT token (7d expiry)
        → return token + user + tenant info
          → store token in localStorage
            → set axios default Authorization header
              → connect Socket.IO with token
```

### Tenant Isolation Flow
```
Every API request
  → authenticate middleware (verify JWT → attach req.user)
    → authorize middleware (check req.user.role)
      → controller passes req.user.tenantId to service
        → service queries MongoDB with { tenantId }
          → only that tenant's data is returned
```

### Real-Time Flow
```
User A updates a task
  → PUT /api/tasks/:taskId
    → task saved to MongoDB
      → response sent to User A
        → User A emits 'task-updated' via Socket.IO
          → Socket.IO server broadcasts to project room
            → User B (in same project room) receives event
              → TanStack Query cache updated instantly
                → User B's UI updates without refresh
```

### Multi-Tenant Registration Flow
```
Create Org                          Join Org
─────────────────────               ─────────────────────
POST /api/auth/register             POST /api/auth/register
{ type: 'org', orgName, ... }       { type: 'member', slug, ... }
  → create Tenant                     → find Tenant by slug
  → create User (role: owner)         → create User (role: member)
  → return JWT                        → return JWT
```

---

## Role-Based Access Control

```
owner  ──► all routes
  │
  ├── manage tenant settings
  ├── manage all members (promote/remove)
  ├── create/archive projects
  └── all task operations

admin  ──► subset of routes
  │
  ├── manage members
  ├── create/archive projects
  └── all task operations

member ──► limited routes
  │
  ├── view projects
  ├── create/update tasks
  └── view members
```

---

## Deployment Architecture (Docker)

```
┌─────────────────────────────────────┐
│         docker-compose              │
│                                     │
│  ┌─────────────┐  ┌───────────────┐ │
│  │  frontend   │  │   backend     │ │
│  │  nginx:80   │  │  node:5001    │ │
│  │             │  │               │ │
│  │  /api/*  ──────► Express API   │ │
│  │  /socket ──────► Socket.IO     │ │
│  │  /*      → SPA │               │ │
│  └─────────────┘  └───────┬───────┘ │
│                           │         │
└───────────────────────────┼─────────┘
                            │
                            ▼
                    MongoDB Atlas (cloud)
```
