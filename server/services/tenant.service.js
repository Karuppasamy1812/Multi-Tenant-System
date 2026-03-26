import Tenant from '../models/tenant.model.js';
import User from '../models/user.model.js';
import Project from '../models/project.model.js';
import Task from '../models/task.model.js';
import AppError from '../config/AppError.js';

const getTenant = async (tenantId) => {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new AppError('Tenant not found', 404);
  return tenant;
};

const updateTenant = async (tenantId, { name }) => {
  const tenant = await Tenant.findByIdAndUpdate(tenantId, { name }, { new: true });
  if (!tenant) throw new AppError('Tenant not found', 404);
  return tenant;
};

const getTenantStats = async (tenantId) => {
  const [members, projects, tasks] = await Promise.all([
    User.countDocuments({ tenantId }),
    Project.countDocuments({ tenantId, isArchived: false }),
    Task.countDocuments({ tenantId }),
  ]);
  return { members, projects, tasks };
};

const getMembers = async (tenantId) =>
  User.find({ tenantId }).select('-password');

const updateMemberRole = async (tenantId, userId, role, requesterId) => {
  if (userId === requesterId) throw new AppError('Cannot change your own role', 400);
  const user = await User.findOne({ _id: userId, tenantId });
  if (!user) throw new AppError('Member not found', 404);
  if (user.role === 'owner') throw new AppError('Cannot change owner role', 400);
  user.role = role;
  await user.save();
  return user;
};

const removeMember = async (tenantId, userId, requesterId) => {
  if (userId === requesterId) throw new AppError('Cannot remove yourself', 400);
  const user = await User.findOne({ _id: userId, tenantId });
  if (!user) throw new AppError('Member not found', 404);
  if (user.role === 'owner') throw new AppError('Cannot remove owner', 400);
  await user.deleteOne();
};

export { getTenant, updateTenant, getTenantStats, getMembers, updateMemberRole, removeMember };
