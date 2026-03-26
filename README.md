# WorkNest

**WorkNest** is a **Multi-Tenant SaaS Workspace Platform** (MERN stack). Organizations create isolated workspaces, manage users with role-based access control, and collaborate on projects and tasks in real time.

---

## Features

- **Multi-Tenancy:** Shared database, isolated by `tenantId`  
- **Tenant Roles:** Owner, Admin, Member (org-wide permissions)  
- **Real-Time Updates:** Task creation, updates, deletion via Socket.IO  
- **Task Table View:** Tasks shown in a table (Title, Status, Priority, Assignee, Due Date)  
- **Two-Path Registration:** Create org or join via unique slug  
- **JWT Authentication:** Secure tokens with tenant-level data isolation  

---

## Tech Stack

**Backend:** Node.js, Express, MongoDB Atlas, Mongoose, Socket.IO, JWT  
**Frontend:** React, TypeScript, Vite, TailwindCSS, TanStack Query, Axios, Radix UI  
**DevOps:** Docker, Nginx, pnpm, ESLint  

---

## Database Schema

- **Tenant:** `_id, name, slug, plan, isActive`  
- **User:** `_id, tenantId, name, email, password, role`  
- **Project:** `_id, tenantId, name, description, owner, members[], lists[], isArchived`  
- **Task:** `_id, tenantId, project, listId, title, description, assignees[], status, priority, dueDate, order`  

> `tenantId` ensures strict data isolation.

---

## API Endpoints

- **Auth:** `/register, /login, /me, /logout`  
- **Tenant:** `/ (GET, PUT), /stats, /members`  
- **Projects:** `/ (GET, POST), /:id (GET, PUT, DELETE), /:id/members, /:id/lists`  
- **Tasks:** `/project/:id (GET), / (POST), /:id (PUT, DELETE)`  

---

## Socket Events

`join-project, leave-project, task-created, task-updated, task-deleted`

---

## Frontend Pages

Login | Register | Join | Dashboard | ProjectBoard | Members | Settings

---

## Deployment

```bash
docker-compose up --build
