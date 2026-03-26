import { Router } from 'express';
import { getTenant, updateTenant, getTenantStats, getMembers, updateMemberRole, removeMember } from '../controllers/tenant.controller.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';

const router = Router();

router.get('/',        authenticate, getTenant);
router.put('/',        authenticate, authorize('owner'), updateTenant);
router.get('/stats',   authenticate, authorize('owner', 'admin'), getTenantStats);
router.get('/members', authenticate, getMembers);
router.put('/members/:userId',    authenticate, authorize('owner', 'admin'), updateMemberRole);
router.delete('/members/:userId', authenticate, authorize('owner', 'admin'), removeMember);

export default router;
