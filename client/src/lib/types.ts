export type Role = 'owner' | 'admin' | 'member';

export type Tenant = {
  _id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
};

export type User = {
  _id: string;
  name: string;
  email: string;
  role: Role;
  tenant: Tenant;
};

export type Member = {
  _id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
};

export type List = {
  _id: string;
  title: string;
  order: number;
};

export type ProjectMember = {
  _id: string;
  user: Member;
  role: 'admin' | 'member';
};

export type Project = {
  _id: string;
  name: string;
  description: string;
  owner: Member;
  members: ProjectMember[];
  lists: List[];
  isArchived: boolean;
  createdAt: string;
};

export type Task = {
  _id: string;
  title: string;
  description: string;
  project: string;
  listId: string;
  assignees: Member[];
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  order: number;
  createdAt: string;
};

export type TenantStats = {
  members: number;
  projects: number;
  tasks: number;
};
