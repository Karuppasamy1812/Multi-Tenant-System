# WorkNest — Project Summary

## What It Is

WorkNest is a **Multi-Tenant SaaS Workspace Platform** (MERN stack). Organizations create isolated workspaces, manage their own users with role-based access control, and collaborate on projects and tasks in real time. The core challenge is **tenant-level data isolation** — one org can never access another org's data.

---

## Core Concepts

### 1. Multi-Tenancy — Shared Database, Shared Schema
All tenants share one MongoDB database. Every document has a `tenantId` field, and every query is scoped to it:

```js
Project.find({ tenantId: req.user.tenantId })
Task.find({ tenantId: req.user.tenantId })
```

| Strategy | Chosen? |
|---|---|
| Separate databases per tenant | ❌ Too expensive |
| Separate schemas per tenant | ❌ Complex to manage |
| Shared DB + `tenantId` scoping | ✅ Chosen |

### 2. Two-Path Registration Flow
- **Create Org** — First user creates a new organization, becomes `owner`. A unique `slug` is auto-generated (e.g. "Acme Inc" → `acme-inc`)
- **Join Org** — Subsequent users join using the org's `slug`, assigned `member` role by default
- Owner can share a pre-built invite link from the Settings page (slug auto-fills on join page)

### 3. Tenant-Level RBAC
Roles are **org-wide** (not per-project), simpler than project-level RBAC:

| Role | Permissions |
|---|---|
| Owner | Full control: org settings, promote/remove members, all project & task operations |
| Admin | Manage members, create/archive projects, all task operations |
| Member | View projects, create/update tasks, view members |

Implemented as a simple middleware checking `req.user.role` against allowed roles.

### 4. Real-Time Communication (Socket.IO)
- Users join a **project room** on entering a project (`join-project`)
- Task mutations broadcast to the room: `task-created`, `task-updated`, `task-deleted`
- Receiving clients update **TanStack Query cache directly** — no refetch needed
- No typing indicators (simpler than TaskBoard)

### 5. Authentication (JWT)
- Token signed with `JWT_SECRET`, expires in 7 days
- Sent as `Authorization: Bearer <token>` header
- Socket connections authenticated via JWT on handshake
- Token carries `tenantId` — used for all data isolation

### 6. Task View — Table, Not Kanban
Intentional design choice: tasks are displayed as a **simple table** (Title, Status, Priority, Assignee, Due Date) rather than a Kanban board. No drag-and-drop, no `@dnd-kit`. Focus is on workspace management, not task visualization.

### 7. Layered Backend Architecture
```
Routes → Controllers → Services → Models
```
- **Routes** — endpoints + middleware chains
- **Controllers** — HTTP handling, delegates via `catchAsync`
- **Services** — all business logic + tenant-scoped queries
- **Models** — Mongoose schemas, every model has `tenantId`

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20 | Runtime (ESM) |
| Express | 4.x | HTTP framework |
| MongoDB Atlas | Cloud | Database |
| Mongoose | 7.x | ODM |
| Socket.IO | 4.x | Real-time communication |
| JSON Web Token | 9.x | Authentication |
| bcryptjs | 2.x | Password hashing |
| dotenv | 16.x | Environment variables |
| Vitest | 2.x | Testing |
| Supertest | 7.x | HTTP integration testing |
| Nodemon | 3.x | Dev auto-reload |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 8.x | Build tool |
| TailwindCSS | 4.x | Styling |
| TanStack Query | 5.x | Server state management + caching |
| Axios | 1.x | HTTP client (JWT header auto-set) |
| Socket.IO Client | 4.x | Real-time communication |
| Radix UI | latest | Accessible headless UI components |
| React Router DOM | 7.x | Client-side routing |
| Lucide React | latest | Icons |
| Sonner | latest | Toast notifications |
| clsx + tailwind-merge | latest | Conditional class utilities |

> Note: No `@dnd-kit`, no `zustand` — simpler than TaskBoard by design

### DevOps & Tooling
| Tool | Purpose |
|---|---|
| Docker + docker-compose | Containerized deployment |
| Nginx | Frontend static serving + reverse proxy (`/api/*` → backend) |
| pnpm | Package manager |
| ESLint + TypeScript-ESLint | Linting |

---

## Database Schema (MongoDB)

### Tenant
```
_id, name, slug (unique), plan (free|pro|enterprise), isActive
```

### User
```
_id, tenantId (isolation key), name, email, password (bcrypt),
role (owner|admin|member)
```

### Project
```
_id, tenantId (isolation key), name, description, owner (ref: User),
members: [{ user, role (admin|member) }],
lists: [{ title, order }],
isArchived
```

### Task
```
_id, tenantId (isolation key), project (ref), listId,
title, description, assignees[], status, priority, dueDate, order
```

> Every model has `tenantId` — this is the foundation of data isolation.

---

## API Endpoints

| Resource | Endpoints |
|---|---|
| Auth | POST /register (org or member), POST /login, GET /me, POST /logout |
| Tenant | GET /, PUT / (owner), GET /stats, GET /members, PUT /members/:id, DELETE /members/:id |
| Projects | GET /, POST /, GET /:id, PUT /:id, POST /:id/members, POST /:id/lists, DELETE /:id |
| Tasks | GET /project/:id, POST /, PUT /:id, DELETE /:id |

---

## Socket Events

| Event | Flow | Description |
|---|---|---|
| `join-project` | Client → Server | Subscribe to project room |
| `leave-project` | Client → Server | Unsubscribe from project room |
| `task-created` | Client ↔ All clients | Broadcast new task |
| `task-updated` | Client ↔ All clients | Broadcast task update |
| `task-deleted` | Client ↔ All clients | Broadcast task deletion |

---

## Frontend Pages

| Page | Purpose |
|---|---|
| Login | Authenticate existing user |
| Register | Create org or join org via slug |
| Join | Join org with pre-filled slug from invite link |
| Dashboard | Overview of all workspace projects |
| ProjectBoard | Task table view for a project |
| Members | List and manage org members (owner/admin) |
| Settings | Org settings + copyable invite link |

---

## Deployment

```
docker-compose up --build
```
- Frontend: Nginx on port 80 — serves SPA, proxies `/api/*` and `/socket` to backend
- Backend: Node.js on port 5001
- Database: MongoDB Atlas (cloud)

---

## Testing

34 backend integration tests (Vitest + Supertest against real MongoDB Atlas test DB):

| File | Coverage |
|---|---|
| auth.test.js | Register org, register member, login, /me, logout |
| tenant.test.js | Get tenant, stats, list members, update role, update tenant, remove member |
| projects.test.js | Full CRUD for projects + tasks, RBAC scenarios |

---

## Key Design Decisions

| Decision | Chosen | Reason |
|---|---|---|
| Multi-tenancy | Shared DB + `tenantId` | Cost-efficient, scalable, used by Slack/Jira/Notion |
| Invites | Slug-based link | No email service needed, simple to implement |
| Roles | Tenant-level (not per-project) | Simpler, appropriate for workspace platform |
| Task view | Table (not Kanban) | Focus on workspace mgmt, avoids dnd complexity |
| Module system | ESM | Modern Node.js standard, Vitest native support |
| Cache updates | Server-confirmed + socket broadcast | Data consistency over optimistic speed |

---

## WorkNest vs TaskBoard — Key Differences

| Aspect | TaskBoard | WorkNest |
|---|---|---|
| Core concept | Kanban task management | Multi-tenant SaaS workspace |
| Multi-tenancy | ❌ Single tenant | ✅ Full tenant isolation via `tenantId` |
| Roles | Per-project (admin/contributor/viewer) | Org-wide (owner/admin/member) |
| Task view | Kanban drag-and-drop | Simple table view |
| Drag-and-drop | ✅ @dnd-kit | ❌ Not needed |
| Typing indicators | ✅ Yes | ❌ No |
| Task history | ✅ Full audit trail | ❌ Not included |
| AutoQueryKey | ✅ Custom decorator | ❌ Manual query keys |
| Zustand | ✅ Yes | ❌ Not needed |
| Tests | 54 | 34 |
| Backend port | 5000 | 5001 |
