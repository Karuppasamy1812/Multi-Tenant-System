# WorkNest — Technical Documentation

## 1. System Overview

WorkNest is a Multi-Tenant SaaS Workspace Platform built on the MERN stack. It allows organizations to create isolated workspaces, manage their own users with role-based access control, and collaborate on projects and tasks in real time.

---

## 2. Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20 | Runtime |
| Express | 4.x | HTTP framework |
| MongoDB Atlas | Cloud | Database |
| Mongoose | 7.x | ODM |
| Socket.IO | 4.x | Real-time communication |
| JSON Web Token | 9.x | Authentication |
| bcryptjs | 2.x | Password hashing |
| Vitest | 2.x | Testing |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 8.x | Build tool |
| TailwindCSS | 4.x | Styling |
| TanStack Query | 5.x | Server state management |
| Axios | 1.x | HTTP client |
| Socket.IO Client | 4.x | Real-time communication |
| Radix UI | latest | Accessible UI components |
| Lucide React | latest | Icons |
| Sonner | latest | Toast notifications |

---

## 3. Database Schema

### Tenant
```js
{
  _id:       ObjectId,
  name:      String (required),
  slug:      String (required, unique, lowercase),
  plan:      String (enum: free | pro | enterprise, default: free),
  isActive:  Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### User
```js
{
  _id:       ObjectId,
  tenantId:  ObjectId (ref: Tenant, required),  // tenant isolation key
  name:      String (required),
  email:     String (required, unique),
  password:  String (bcrypt hashed),
  role:      String (enum: owner | admin | member, default: member),
  createdAt: Date,
  updatedAt: Date
}
```

### Project
```js
{
  _id:         ObjectId,
  tenantId:    ObjectId (ref: Tenant, required),  // tenant isolation key
  name:        String (required),
  description: String,
  owner:       ObjectId (ref: User),
  members: [{
    user: ObjectId (ref: User),
    role: String (enum: admin | member)
  }],
  lists: [{
    title: String,
    order: Number
  }],
  isArchived:  Boolean (default: false),
  createdAt:   Date,
  updatedAt:   Date
}
```

### Task
```js
{
  _id:         ObjectId,
  tenantId:    ObjectId (ref: Tenant, required),  // tenant isolation key
  project:     ObjectId (ref: Project, required),
  listId:      ObjectId (required),
  title:       String (required),
  description: String,
  assignees:   [ObjectId (ref: User)],
  status:      String (enum: todo | in-progress | review | done, default: todo),
  priority:    String (enum: low | medium | high, default: medium),
  dueDate:     Date,
  order:       Number (default: 0),
  createdAt:   Date,
  updatedAt:   Date
}
```

---

## 4. API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Create org (type: org) or join org (type: member) |
| POST | `/login` | Public | Login and receive JWT |
| GET | `/me` | Authenticated | Get current user |
| POST | `/logout` | Authenticated | Logout |

### Tenant — `/api/tenant`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Get tenant info |
| PUT | `/` | Owner | Update tenant name |
| GET | `/stats` | Owner, Admin | Get workspace stats |
| GET | `/members` | Authenticated | List all members |
| PUT | `/members/:userId` | Owner, Admin | Update member role |
| DELETE | `/members/:userId` | Owner, Admin | Remove member |

### Projects — `/api/projects`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated | List all tenant projects |
| POST | `/` | Owner, Admin | Create project |
| GET | `/:projectId` | Authenticated | Get project by ID |
| PUT | `/:projectId` | Owner, Admin | Update project |
| POST | `/:projectId/members` | Owner, Admin | Add member to project |
| POST | `/:projectId/lists` | All roles | Add list to project |
| DELETE | `/:projectId` | Owner, Admin | Archive project |

### Tasks — `/api/tasks`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/project/:projectId` | Authenticated | List tasks by project |
| POST | `/` | All roles | Create task |
| PUT | `/:taskId` | All roles | Update task |
| DELETE | `/:taskId` | Owner, Admin | Delete task |

---

## 5. Authentication & Authorization

### JWT Authentication
- Token signed with `JWT_SECRET`, expires in 7 days
- Sent as `Authorization: Bearer <token>` header
- `authenticate` middleware verifies token and attaches `req.user`

### Tenant-Level RBAC
```
owner  → full access to all routes
admin  → manage members, projects, tasks
member → view projects, create/update tasks
```

The `authorize(...roles)` middleware checks `req.user.role`:
```js
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role))
    return next(new AppError('You do not have permission', 403));
  next();
};
```

### Tenant Isolation
Every service query includes `tenantId` from the authenticated user:
```js
// Users can only see their own tenant's data
Project.find({ tenantId: req.user.tenantId })
Task.find({ tenantId: req.user.tenantId })
```

---

## 6. Real-Time Communication

Socket.IO is used for real-time task updates across connected clients in the same project.

### Socket Events
| Event | Direction | Description |
|---|---|---|
| `join-project` | Client → Server | Join a project room |
| `leave-project` | Client → Server | Leave a project room |
| `task-created` | Client → Server → Clients | Broadcast new task |
| `task-updated` | Client → Server → Clients | Broadcast task update |
| `task-deleted` | Client → Server → Clients | Broadcast task deletion |

### Socket Authentication
Every socket connection is authenticated via JWT:
```js
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  socket.user = await User.findById(decoded.id);
  next();
});
```

---

## 7. Frontend Architecture

### State Management
- **TanStack Query** — server state (API data, caching, invalidation)
- **React Context** — auth state (user, token, login/logout)
- **useState** — local UI state (modals, form inputs)

### Query Keys
```
['auth.me']           → current user
['tenant']            → tenant info
['tenant.stats']      → workspace stats
['tenant.members']    → all members
['projects']          → all projects
['projects', id]      → single project
['tasks', projectId]  → tasks for a project
```

### Real-Time Cache Updates
When a socket event is received, TanStack Query cache is updated directly without a refetch:
```ts
socket.on('task-updated', (task) =>
  qc.setQueryData(['tasks', projectId], (old) =>
    old.map(t => t._id === task._id ? task : t)
  )
);
```

---

## 8. Project Structure

```
worknest/
├── server/                  Backend
│   ├── config/              AppError, db, logger
│   ├── models/              Tenant, User, Project, Task
│   ├── services/            Business logic layer
│   ├── controllers/         Request/response handlers
│   ├── middleware/          authenticate, authorize, catchAsync, errorHandler
│   ├── routes/              Route definitions
│   ├── socket/              Socket.IO event handlers
│   ├── tests/               Vitest test suites
│   ├── server.js            Entry point
│   └── Dockerfile
│
├── client/                  Frontend
│   ├── src/
│   │   ├── api/             Axios API functions
│   │   ├── queries/         TanStack Query hooks
│   │   ├── context/         AuthContext
│   │   ├── pages/           Login, Register, Join, Dashboard, ProjectDetail, Members, Settings
│   │   ├── components/      Sidebar
│   │   └── lib/             types, cn, socket, config
│   ├── nginx.conf
│   └── Dockerfile
│
├── docker-compose.yml
├── ARCHITECTURE.md
├── DOCUMENTATION.md
└── REPORT.md
```

---

## 9. Environment Variables

### Backend (.env)
```
PORT=5001
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:3000
```

---

## 10. Running the Project

### Development
```bash
# Backend
cd server && pnpm install && pnpm dev

# Frontend
cd client && pnpm install && pnpm dev
```

### Production (Docker)
```bash
docker-compose up --build
```

### Tests
```bash
cd server && pnpm test
```
