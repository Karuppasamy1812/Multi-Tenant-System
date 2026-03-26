import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Tenant from '../models/tenant.model.js';
import AppError from '../config/AppError.js';
import logger from '../config/logger.js';

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const formatUser = (user, tenant) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  tenant: { _id: tenant._id, name: tenant.name, slug: tenant.slug, plan: tenant.plan },
});

// Create new org + owner
const registerOrg = async ({ orgName, name, email, password }) => {
  const slug = orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const existingTenant = await Tenant.findOne({ slug });
  if (existingTenant) throw new AppError('Organization name already taken', 400);

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError('Email already in use', 400);

  const tenant = await Tenant.create({ name: orgName, slug });
  const user = await User.create({ tenantId: tenant._id, name, email, password, role: 'owner' });
  logger.info('Auth', `New org created: ${tenant.slug} by ${user.email}`);

  return { token: signToken(user._id), user: formatUser(user, tenant) };
};

// Join existing org by slug
const registerMember = async ({ slug, name, email, password }) => {
  const tenant = await Tenant.findOne({ slug, isActive: true });
  if (!tenant) throw new AppError('Organization not found', 404);

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError('Email already in use', 400);

  const user = await User.create({ tenantId: tenant._id, name, email, password, role: 'member' });
  logger.info('Auth', `New member joined: ${user.email} → ${tenant.slug}`);

  return { token: signToken(user._id), user: formatUser(user, tenant) };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password)))
    throw new AppError('Invalid email or password', 401);

  const tenant = await Tenant.findById(user.tenantId);
  if (!tenant || !tenant.isActive) throw new AppError('Organization is inactive', 403);

  return { token: signToken(user._id), user: formatUser(user, tenant) };
};

export { registerOrg, registerMember, loginUser };
