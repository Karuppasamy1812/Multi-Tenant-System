# WorkNest — Project Report

## 1. Introduction

WorkNest is a Multi-Tenant SaaS Workspace Platform built to fulfill Requirement #6. The platform allows organizations to create isolated workspaces, manage their own users with role-based access control, and collaborate on projects and tasks in real time.

The core challenge of this project was implementing true tenant-level data isolation — ensuring that one organization can never access another organization's data — while keeping the system simple, maintainable, and production-ready.

---

## 2. Approach

### Multi-Tenancy Strategy — Shared Database, Shared Schema

There are three common multi-tenancy strategies:

| Strategy | Description | Chosen? |
|---|---|---|
| Separate databases | Each tenant gets their own DB | ❌ Too expensive |
| Separate schemas | Each tenant gets their own schema | ❌ Complex to manage |
| Shared database, shared schema | All tenants in one DB, isolated by `tenantId` | ✅ Chosen |

The shared database approach was chosen because it is the most cost-efficient and scalable for a SaaS product. Every document in MongoDB has a `tenantId` field, and every query is scoped to that field. This ensures complete data isolation at the application layer.

### Registration Flow Design

Two registration flows were designed:

1. **Create Org** — The first user creates a new organization and becomes the `owner`. A unique `slug` is auto-generated from the org name (e.g. "Acme Inc" → "acme-inc").

2. **Join Org** — Subsequent users join an existing organization using the org's slug. They are assigned the `member` role by default.

The slug-based invite system was chosen over email invites for simplicity. The owner can copy a pre-built invite link from the Settings page and share it with teammates. The link auto-fills the slug on the join page.

### Role-Based Access Control

Three roles were defined at the tenant level:

- **Owner** — Full control. Can manage org settings, promote/remove members, create/archive projects.
- **Admin** — Can manage members and projects. Promoted by the owner.
- **Member** — Can view projects and create/update tasks. Default role on join.

This was implemented as a simple middleware that checks `req.user.role` against allowed roles for each route. This is simpler than the Tasks project's project-level RBAC because WorkNest uses org-wide roles rather than per-project roles.

### Real-Time Communication

Socket.IO was used for real-time task updates. When a user creates, updates, or deletes a task, the change is broadcast to all other users in the same project room. TanStack Query's cache is updated directly on the client side without a full refetch, making updates feel instant.

---

## 3. System Design

### Backend — Layered Architecture

The backend follows a clean layered architecture identical to the Tasks project:

```
Routes → Controllers → Services → Models
```

- **Routes** — define endpoints and apply middleware
- **Controllers** — handle HTTP request/response, delegate to services
- **Services** — contain all business logic, interact with models
- **Models** — Mongoose schemas with tenant isolation built in

This separation makes the codebase easy to test, maintain, and extend.

### Frontend — Component Architecture

The frontend uses a simple but effective architecture:

- **API layer** — plain Axios functions, one file per resource
- **Query layer** — TanStack Query hooks wrapping API calls
- **Context layer** — AuthContext for global auth state
- **Page layer** — React pages consuming query hooks
- **Component layer** — reusable UI components (Sidebar)

---

## 4. Trade-offs and Design Decisions

### Trade-off 1 — Slug-based invites vs Email invites

**Chosen:** Slug-based invite link  
**Alternative:** Email invite with token

Slug-based invites are simpler to implement and don't require an email service. The downside is that anyone with the slug can join the org. In a production system, email invites with expiring tokens would be more secure. For this project, slug-based invites were sufficient to demonstrate the multi-tenancy concept.

### Trade-off 2 — Shared DB vs Separate DBs

**Chosen:** Shared database with `tenantId` scoping  
**Alternative:** Separate database per tenant

Separate databases offer stronger isolation but are expensive and complex to manage at scale. The shared database approach is used by most SaaS products (Slack, Jira, Notion) and is sufficient for this project. The `tenantId` field on every document ensures isolation at the query level.

### Trade-off 3 — Task list view vs Kanban board

**Chosen:** Simple table view (Title, Status, Priority, Assignee, Due Date)  
**Alternative:** Kanban drag-and-drop board

A Kanban board was intentionally avoided for WorkNest because the requirement focuses on workspace management, not task visualization. A simple table view is more appropriate for a workspace platform and avoids unnecessary complexity (no dnd-kit dependency).

### Trade-off 4 — Tenant-level roles vs Project-level roles

**Chosen:** Tenant-level roles (owner/admin/member)  
**Alternative:** Project-level roles (like Tasks project)

Tenant-level roles are simpler and more appropriate for a workspace platform. Every member of the org has the same role across all projects. This avoids the complexity of managing per-project roles while still providing meaningful access control.

### Trade-off 5 — ESM vs CommonJS

**Chosen:** ESM (import/export)  
**Alternative:** CommonJS (require/module.exports)

ESM is the modern JavaScript standard and is used by both the frontend (Vite) and backend. This ensures consistency across the codebase and aligns with the direction of the Node.js ecosystem.

---

## 5. Testing

The backend has 34 tests across 3 test files covering:

- **Auth tests** — register org, register member, login, get me, logout
- **Tenant tests** — get tenant, stats, list members, update role, update tenant, remove member
- **Project & Task tests** — create/list/get projects, add members, add lists, create/list/update/delete tasks, archive project

All 34 tests pass. Tests use Vitest (replacing Jest) for native ESM support and faster execution.

---

## 6. Conclusion

WorkNest successfully implements a multi-tenant SaaS workspace platform with:

- ✅ Complete tenant-level data isolation via `tenantId`
- ✅ Three-tier role-based access control (owner/admin/member)
- ✅ Real-time task updates via Socket.IO
- ✅ Slug-based invite system with copyable invite links
- ✅ Clean layered architecture (Routes → Controllers → Services → Models)
- ✅ 34 passing tests
- ✅ Docker + docker-compose for reproducible deployment
- ✅ Production-ready ESM codebase with pnpm

The platform demonstrates the core concepts of multi-tenancy in a clean, maintainable, and extensible codebase that can serve as a foundation for a real production SaaS product.
