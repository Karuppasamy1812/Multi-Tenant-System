import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from './app.js';

const ORG = { type: 'org', orgName: 'Test Corp', name: 'Owner User', email: 'owner@testcorp.com', password: 'pass1234' };
const MEMBER = { type: 'member', slug: 'test-corp', name: 'Member User', email: 'member@testcorp.com', password: 'pass1234' };

let ownerToken;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, { tls: true, tlsAllowInvalidCertificates: false, serverSelectionTimeoutMS: 10000 });
});

afterAll(async () => {
  await mongoose.connection.collection('users').deleteMany({ email: { $in: [ORG.email, MEMBER.email] } });
  await mongoose.connection.collection('tenants').deleteMany({ slug: 'test-corp' });
  await mongoose.disconnect();
});

describe('Auth — Register Org', () => {
  it('should create org and owner', async () => {
    const res = await request(app).post('/api/auth/register').send(ORG);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('owner');
    expect(res.body.user.tenant.slug).toBe('test-corp');
    ownerToken = res.body.token;
  });

  it('should reject duplicate org name', async () => {
    const res = await request(app).post('/api/auth/register').send(ORG);
    expect(res.status).toBe(400);
  });
});

describe('Auth — Register Member', () => {
  it('should join existing org by slug', async () => {
    const res = await request(app).post('/api/auth/register').send(MEMBER);
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('member');
    expect(res.body.user.tenant.slug).toBe('test-corp');
  });

  it('should reject invalid slug', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...MEMBER, slug: 'nonexistent-org', email: 'x@x.com' });
    expect(res.status).toBe(404);
  });
});

describe('Auth — Login', () => {
  it('should login and return token', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: ORG.email, password: ORG.password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should reject wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: ORG.email, password: 'wrong' });
    expect(res.status).toBe(401);
  });
});

describe('Auth — Me', () => {
  it('should return current user', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(ORG.email);
  });

  it('should reject without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
