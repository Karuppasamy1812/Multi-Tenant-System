import { Router } from 'express';
import { getProjects, getProject, createProject, updateProject, addMember, addList, archiveProject } from '../controllers/project.controller.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';

const router = Router();

router.get('/',                              authenticate, getProjects);
router.post('/',                             authenticate, authorize('owner', 'admin'), createProject);
router.get('/:projectId',                    authenticate, getProject);
router.put('/:projectId',                    authenticate, authorize('owner', 'admin'), updateProject);
router.post('/:projectId/members',           authenticate, authorize('owner', 'admin'), addMember);
router.post('/:projectId/lists',             authenticate, authorize('owner', 'admin', 'member'), addList);
router.delete('/:projectId',                 authenticate, authorize('owner', 'admin'), archiveProject);

export default router;
