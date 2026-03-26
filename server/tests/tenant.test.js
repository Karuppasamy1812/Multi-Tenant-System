import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from './app.js';

let ownerToken, adminToken, memberToken, freshMemberToken;
let adminId, memberId;

const ORG    = { type: 'org',    orgName: 'Tenant Test Corp', name: 'Owner',  email: 'owner@tenanttest.com',  password: 'pass1234' };
const ADMIN  = { type: 'member', slug: 'tenant-test-corp',    name: 'Admin',  email: 'admin@tenanttest.com',  password: 'pass1234' };
const MEMBER = { type: 'member', slug: 'tenant-test-corp',    name: 'Member', email: 'member@tenanttest.com', password: 'pass1234' };
const FRESH  = { type: 'member', slug: 'tenant-test-corp',    name: 'Fresh',  email: 'fresh@tenanttest.com',  password: 'pass1234' };

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, { tls: true, tlsAllowInvalidCertificates: false, serverSelectionTimeoutMS: 10000 });

  const o = await request(app).post('/api/auth/register').send(ORG);
  ownerToken = o.body.token;

  const a = await request(app).post('/api/auth/register').send(ADMIN);
  adminToken = a.body.token;
  adminId = a.body.user._id;

  const m = await request(app).post('/api/auth/register').send(MEMBER);
  memberToken = m.body.token;
  memberId = m.body.user._id;

  // fresh member — never promoted, used for 403 checks
  const f = await request(app).post('/api/auth/register').send(FRESH);
  freshMemberToken = f.body.token;

  // promote admin only
  await request(app).put(`/api/tenant/members/${adminId}`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ role: 'admin' });
});

afterAll(async () => {
  await mongoose.connection.collection('users').deleteMany({
    email: { $in: [ORG.email, ADMIN.email, MEMBER.email, FRESH.email] },
  });
  await mongoose.connection.collection('tenants').deleteMany({ slug: 'tenant-test-corp' });
  await mongoose.disconnect();
});

describe('Tenant — Get', () => {
  it('should return tenant info', async () => {
    const res = await request(app).get('/api/tenant').set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('tenant-test-corp');
  });
});

describe('Tenant — Stats', () => {
  it('owner should get stats', async () => {
    const res = await request(app).get('/api/tenant/stats').set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('members');
    expect(res.body).toHaveProperty('projects');
    expect(res.body).toHaveProperty('tasks');
  });

  it('member should NOT get stats', async () => {
    const res = await request(app).get('/api/tenant/stats').set('Authorization', `Bearer ${freshMemberToken}`);
    expect(res.status).toBe(403);
  });
});

describe('Tenant — Members', () => {
  it('should list all members', async () => {
    const res = await request(app).get('/api/tenant/members').set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  it('owner should update member role', async () => {
    const res = await request(app).put(`/api/tenant/members/${memberId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ role: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('admin');
  });

  it('member should NOT update roles', async () => {
    const res = await request(app).put(`/api/tenant/members/${memberId}`)
      .set('Authorization', `Bearer ${freshMemberToken}`)
      .send({ role: 'admin' });
    expect(res.status).toBe(403);
  });
});

describe('Tenant — Update', () => {
  it('owner should update tenant name', async () => {
    const res = await request(app).put('/api/tenant')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Updated Corp' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Corp');
  });

  it('member should NOT update tenant', async () => {
    const res = await request(app).put('/api/tenant')
      .set('Authorization', `Bearer ${freshMemberToken}`)
      .send({ name: 'Hacked' });
    expect(res.status).toBe(403);
  });
});

describe('Tenant — Remove Member', () => {
  it('owner should remove member', async () => {
    const res = await request(app).delete(`/api/tenant/members/${memberId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
  });
});
