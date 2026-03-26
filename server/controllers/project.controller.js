import * as projectService from '../services/project.service.js';
import catchAsync from '../middleware/catchAsync.js';

const getProjects = catchAsync(async (req, res) => {
  const projects = await projectService.getProjects(req.user.tenantId);
  res.json(projects);
});

const getProject = catchAsync(async (req, res) => {
  const project = await projectService.getProjectById(req.user.tenantId, req.params.projectId);
  res.json(project);
});

const createProject = catchAsync(async (req, res) => {
  const project = await projectService.createProject({
    ...req.body,
    tenantId: req.user.tenantId,
    ownerId: req.user._id,
  });
  res.status(201).json(project);
});

const updateProject = catchAsync(async (req, res) => {
  const project = await projectService.updateProject(req.user.tenantId, req.params.projectId, req.body);
  res.json(project);
});

const addMember = catchAsync(async (req, res) => {
  const project = await projectService.addMember(req.user.tenantId, req.params.projectId, req.body);
  res.json(project);
});

const addList = catchAsync(async (req, res) => {
  const project = await projectService.addList(req.user.tenantId, req.params.projectId, req.body);
  res.json(project);
});

const archiveProject = catchAsync(async (req, res) => {
  await projectService.archiveProject(req.user.tenantId, req.params.projectId);
  res.json({ message: 'Project archived' });
});

export { getProjects, getProject, createProject, updateProject, addMember, addList, archiveProject };
