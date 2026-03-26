import Project from '../models/project.model.js';
import AppError from '../config/AppError.js';

const populate = (query) =>
  query.populate('owner', 'name email').populate('members.user', 'name email');

const getProjects = (tenantId) =>
  populate(Project.find({ tenantId, isArchived: false }));

const getProjectById = async (tenantId, projectId) => {
  const project = await populate(Project.findOne({ _id: projectId, tenantId }));
  if (!project) throw new AppError('Project not found', 404);
  return project;
};

const createProject = async ({ tenantId, name, description, ownerId }) => {
  const project = await Project.create({
    tenantId, name, description, owner: ownerId,
    lists: [
      { title: 'To Do', order: 0 },
      { title: 'In Progress', order: 1 },
      { title: 'Done', order: 2 },
    ],
  });
  await project.populate('owner', 'name email');
  return project;
};

const updateProject = (tenantId, projectId, { name, description }) =>
  populate(Project.findOneAndUpdate({ _id: projectId, tenantId }, { name, description }, { new: true }));

const addMember = async (tenantId, projectId, { userId, role }) => {
  const project = await Project.findOne({ _id: projectId, tenantId });
  if (!project) throw new AppError('Project not found', 404);
  if (project.members.find((m) => m.user.toString() === userId))
    throw new AppError('User is already a member of this project', 400);
  project.members.push({ user: userId, role: role || 'member' });
  await project.save();
  await project.populate('members.user', 'name email');
  return project;
};

const addList = async (tenantId, projectId, { title }) => {
  const project = await Project.findOne({ _id: projectId, tenantId });
  if (!project) throw new AppError('Project not found', 404);
  project.lists.push({ title, order: project.lists.length });
  await project.save();
  return project;
};

const archiveProject = (tenantId, projectId) =>
  Project.findOneAndUpdate({ _id: projectId, tenantId }, { isArchived: true });

export { getProjects, getProjectById, createProject, updateProject, addMember, addList, archiveProject };
