import Task from '../models/task.model.js';
import AppError from '../config/AppError.js';
import logger from '../config/logger.js';

const populate = (query) => query.populate('assignees', 'name email');

const getTasksByProject = (tenantId, projectId) =>
  populate(Task.find({ tenantId, project: projectId })).sort({ order: 1 });

const createTask = async ({ tenantId, title, description, project, listId, assignees, priority, dueDate }) => {
  const count = await Task.countDocuments({ tenantId, project, listId });
  const task = await Task.create({
    tenantId, title, description, project, listId,
    assignees, priority, dueDate, order: count,
  });
  logger.info('Tasks', `Task created: "${task.title}"`);
  return populate(Task.findById(task._id));
};

const updateTask = async (tenantId, taskId, updates) => {
  const task = await Task.findOne({ _id: taskId, tenantId });
  if (!task) throw new AppError('Task not found', 404);

  const { title, description, status, priority, assignees, dueDate, listId, order } = updates;
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  if (priority !== undefined) task.priority = priority;
  if (assignees !== undefined) task.assignees = assignees;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (listId) task.listId = listId;
  if (order !== undefined) task.order = order;

  await task.save();
  return populate(Task.findById(task._id));
};

const deleteTask = async (tenantId, taskId) => {
  const task = await Task.findOneAndDelete({ _id: taskId, tenantId });
  if (task) logger.info('Tasks', `Task deleted: "${task.title}"`);
};

export { getTasksByProject, createTask, updateTask, deleteTask };
