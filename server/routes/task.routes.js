import { Router } from 'express';
import { getProjectTasks, createTask, updateTask, deleteTask } from '../controllers/task.controller.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';

const router = Router();

router.get('/project/:projectId', authenticate, getProjectTasks);
router.post('/',                  authenticate, authorize('owner', 'admin', 'member'), createTask);
router.put('/:taskId',            authenticate, authorize('owner', 'admin', 'member'), updateTask);
router.delete('/:taskId',         authenticate, authorize('owner', 'admin'), deleteTask);

export default router;
