import * as tenantService from '../services/tenant.service.js';
import catchAsync from '../middleware/catchAsync.js';

const getTenant = catchAsync(async (req, res) => {
  const tenant = await tenantService.getTenant(req.user.tenantId);
  res.json(tenant);
});

const updateTenant = catchAsync(async (req, res) => {
  const tenant = await tenantService.updateTenant(req.user.tenantId, req.body);
  res.json(tenant);
});

const getTenantStats = catchAsync(async (req, res) => {
  const stats = await tenantService.getTenantStats(req.user.tenantId);
  res.json(stats);
});

const getMembers = catchAsync(async (req, res) => {
  const members = await tenantService.getMembers(req.user.tenantId);
  res.json(members);
});

const updateMemberRole = catchAsync(async (req, res) => {
  const user = await tenantService.updateMemberRole(
    req.user.tenantId, req.params.userId, req.body.role, req.user._id.toString()
  );
  res.json(user);
});

const removeMember = catchAsync(async (req, res) => {
  await tenantService.removeMember(req.user.tenantId, req.params.userId, req.user._id.toString());
  res.json({ message: 'Member removed' });
});

export { getTenant, updateTenant, getTenantStats, getMembers, updateMemberRole, removeMember };
