import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from './app.js';

let ownerToken, memberToken, memberId;
let projectId, listId, taskId;

const ORG    = { type: 'org',    orgName: 'Project Test Corp', name: 'Owner',  email: 'owner@projtest.com',  password: 'pass1234' };
const MEMBER = { type: 'member', slug: 'project-test-corp',    name: 'Member', email: 'member@projtest.com', password: 'pass1234' };

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, { tls: true, tlsAllowInvalidCertificates: false, serverSelectionTimeoutMS: 10000 });

  const o = await request(app).post('/api/auth/register').send(ORG);
  ownerToken = o.body.token;

  const m = await request(app).post('/api/auth/register').send(MEMBER);
  memberToken = m.body.token;
  memberId = m.body.user._id;
});

afterAll(async () => {
  await mongoose.connection.collection('users').deleteMany({ email: { $in: [ORG.email, MEMBER.email] } });
  await mongoose.connection.collection('tenants').deleteMany({ slug: 'project-test-corp' });
  await mongoose.connection.collection('projects').deleteMany({ name: /project test/i });
  await mongoose.connection.collection('tasks').deleteMany({});
  await mongoose.disconnect();
});

describe('Projects — Create', () => {
  it('owner should create project with 3 default lists', async () => {
    const res = await request(app).post('/api/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Project Test Alpha', description: 'Test' });
    expect(res.status).toBe(201);
    expect(res.body.lists).toHaveLength(3);
    projectId = res.body._id;
    listId = res.body.lists[0]._id;
  });

  it('member should NOT create project', async () => {
    const res = await request(app).post('/api/projects')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Unauthorized' });
    expect(res.status).toBe(403);
  });
});

describe('Projects — List & Get', () => {
  it('should list all tenant projects', async () => {
    const res = await request(app).get('/api/projects').set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.some((p) => p._id === projectId)).toBe(true);
  });

  it('member should also see tenant projects', async () => {
    const res = await request(app).get('/api/projects').set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(200);
  });

  it('should get project by id', async () => {
    const res = await request(app).get(`/api/projects/${projectId}`).set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(projectId);
  });
});

describe('Projects — Members & Lists', () => {
  it('owner should add member to project', async () => {
    const res = await request(app).post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId: memberId, role: 'member' });
    expect(res.status).toBe(200);
  });

  it('should reject duplicate member', async () => {
    const res = await request(app).post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId: memberId, role: 'member' });
    expect(res.status).toBe(400);
  });

  it('owner should add list', async () => {
    const res = await request(app).post(`/api/projects/${projectId}/lists`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Backlog' });
    expect(res.status).toBe(200);
    expect(res.body.lists.some((l) => l.title === 'Backlog')).toBe(true);
  });
});

describe('Tasks — Create', () => {
  it('owner should create task', async () => {
    const res = await request(app).post('/api/tasks')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Fix bug', project: projectId, listId, priority: 'high' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Fix bug');
    taskId = res.body._id;
  });

  it('member should create task', async () => {
    const res = await request(app).post('/api/tasks')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ title: 'Member task', project: projectId, listId });
    expect(res.status).toBe(201);
  });
});

describe('Tasks — List & Update', () => {
  it('should list tasks by project', async () => {
    const res = await request(app).get(`/api/tasks/project/${projectId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('should update task status', async () => {
    const res = await request(app).put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'in-progress' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in-progress');
  });

  it('should return 404 for non-existent task', async () => {
    const res = await request(app).put(`/api/tasks/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'done' });
    expect(res.status).toBe(404);
  });
});

describe('Tasks — Delete', () => {
  it('member should NOT delete task', async () => {
    const res = await request(app).delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });

  it('owner should delete task', async () => {
    const res = await request(app).delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
  });
});

describe('Projects — Archive', () => {
  it('member should NOT archive project', async () => {
    const res = await request(app).delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });

  it('owner should archive project', async () => {
    const res = await request(app).delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
  });
});
