import * as taskService from '../services/task.service.js';
import catchAsync from '../middleware/catchAsync.js';

const getProjectTasks = catchAsync(async (req, res) => {
  const tasks = await taskService.getTasksByProject(req.user.tenantId, req.params.projectId);
  res.json(tasks);
});

const createTask = catchAsync(async (req, res) => {
  const task = await taskService.createTask({ ...req.body, tenantId: req.user.tenantId });
  res.status(201).json(task);
});

const updateTask = catchAsync(async (req, res) => {
  const task = await taskService.updateTask(req.user.tenantId, req.params.taskId, req.body);
  res.json(task);
});

const deleteTask = catchAsync(async (req, res) => {
  await taskService.deleteTask(req.user.tenantId, req.params.taskId);
  res.json({ message: 'Task deleted' });
});

export { getProjectTasks, createTask, updateTask, deleteTask };
