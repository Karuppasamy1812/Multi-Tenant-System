import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, UserPlus, Loader2, Trash2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { useProject, useAddMember } from '../queries/projects.query';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../queries/tasks.query';
import { useMembers } from '../queries/tenant.query';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/cn';
import type { Task } from '../lib/types';

const priorityConfig: Record<Task['priority'], string> = {
  low:    'bg-emerald-50 text-emerald-700 border-emerald-100',
  medium: 'bg-amber-50 text-amber-700 border-amber-100',
  high:   'bg-red-50 text-red-700 border-red-100',
};

const statusConfig: Record<Task['status'], { label: string; cls: string }> = {
  'todo':        { label: 'To Do',       cls: 'bg-gray-100 text-gray-600' },
  'in-progress': { label: 'In Progress', cls: 'bg-blue-50 text-blue-700' },
  'review':      { label: 'Review',      cls: 'bg-violet-50 text-violet-700' },
  'done':        { label: 'Done',        cls: 'bg-emerald-50 text-emerald-700' },
};

const avatarColors = ['bg-indigo-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500'];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: project, isLoading: pLoading } = useProject(id!);
  const { data: tasks, isLoading: tLoading } = useTasks(id!);
  const { data: allMembers } = useMembers();
  const updateTask = useUpdateTask(id!);
  const deleteTask = useDeleteTask(id!);
  const createTask = useCreateTask(id!);
  const addMember = useAddMember();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');
  const [selectedUserId, setSelectedUserId] = useState('');

  const canManage = user?.role === 'owner' || user?.role === 'admin';

  const existingMemberIds = useMemo(() => {
    if (!project) return new Set<string>();
    return new Set([project.owner._id, ...project.members.map(m => m.user._id)]);
  }, [project]);

  const availableMembers = allMembers?.filter(m => !existingMemberIds.has(m._id)) ?? [];
  const projectMembers = project ? [project.owner, ...project.members.map(m => m.user)] : [];

  if (pLoading || tLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );
  if (!project) return <div className="p-8 text-center text-red-500">Project not found</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            {project.description && <p className="text-sm text-gray-400 mt-0.5">{project.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {projectMembers.slice(0, 5).map((m, i) => (
              <div key={m._id} title={m.name}
                className={`w-8 h-8 rounded-full ${avatarColors[i % avatarColors.length]} text-white text-xs flex items-center justify-center border-2 border-white font-bold`}>
                {m.name[0].toUpperCase()}
              </div>
            ))}
          </div>
          <button onClick={() => setShowCreateTask(true)}
            className="flex items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition font-medium shadow-sm">
            <Plus size={14} /> Add Task
          </button>
          {canManage && (
            <button onClick={() => setShowAddMember(true)}
              className="flex items-center gap-2 text-sm bg-white border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition font-medium text-gray-700 shadow-sm">
              <UserPlus size={14} className="text-indigo-600" /> Add Member
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span>Title</span>
          <span>Status</span>
          <span>Priority</span>
          <span>Assignee</span>
          <span>Due Date</span>
          <span />
        </div>

        {/* Table rows */}
        {!tasks?.length ? (
          <div className="py-16 text-center">
            <p className="font-medium text-gray-500">No tasks yet</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add Task" to get started</p>
          </div>
        ) : (
          tasks.map((task, i) => (
            <div key={task._id}
              onClick={() => setSelectedTask(task)}
              className={cn(
                'grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-5 py-3.5 items-center cursor-pointer hover:bg-gray-50 transition group',
                i !== 0 && 'border-t border-gray-50'
              )}>
              <span className="text-sm font-medium text-gray-800 truncate group-hover:text-indigo-600 transition">
                {task.title}
              </span>
              <span>
                <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', statusConfig[task.status].cls)}>
                  {statusConfig[task.status].label}
                </span>
              </span>
              <span>
                <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium border capitalize', priorityConfig[task.priority])}>
                  {task.priority}
                </span>
              </span>
              <span>
                {task.assignees.length === 0 ? (
                  <span className="text-xs text-gray-300">—</span>
                ) : (
                  <div className="flex -space-x-1.5">
                    {task.assignees.slice(0, 3).map((a, idx) => (
                      <div key={a._id} title={a.name}
                        className={`w-6 h-6 rounded-full ${avatarColors[idx % avatarColors.length]} text-white text-[9px] flex items-center justify-center border-2 border-white font-bold`}>
                        {a.name[0].toUpperCase()}
                      </div>
                    ))}
                    {task.assignees.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-[9px] flex items-center justify-center border-2 border-white">
                        +{task.assignees.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </span>
              <span className="text-xs text-gray-400">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : <span className="text-gray-300">—</span>}
              </span>
              {canManage && (
                <button onClick={e => { e.stopPropagation(); deleteTask.mutate(task._id, { onSuccess: () => toast.success('Task deleted') }); }}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition opacity-0 group-hover:opacity-100">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Task Modal */}
      <Dialog.Root open={showCreateTask} onOpenChange={o => { if (!o) { setShowCreateTask(false); setNewTaskTitle(''); setNewTaskPriority('medium'); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-full max-w-md shadow-2xl z-50">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <Dialog.Title className="text-base font-semibold text-gray-900">New Task</Dialog.Title>
              <Dialog.Close className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition">✕</Dialog.Close>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              if (!newTaskTitle.trim()) return;
              const listId = project.lists[0]?._id;
              createTask.mutate({ title: newTaskTitle, project: id!, listId, priority: newTaskPriority } as any, {
                onSuccess: () => { toast.success('Task created'); setShowCreateTask(false); setNewTaskTitle(''); setNewTaskPriority('medium'); },
              });
            }} className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Title <span className="text-red-400">*</span></label>
                <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} required autoFocus
                  placeholder="What needs to be done?"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Priority</label>
                <Select.Root value={newTaskPriority} onValueChange={v => setNewTaskPriority(v as Task['priority'])}>
                  <Select.Trigger className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none hover:border-indigo-400 transition">
                    <Select.Value />
                    <Select.Icon><ChevronDown size={14} className="text-gray-400" /></Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      <Select.Viewport className="p-1.5">
                        {(['low', 'medium', 'high'] as Task['priority'][]).map(p => (
                          <Select.Item key={p} value={p} className="px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 outline-none data-[highlighted]:bg-gray-50 capitalize text-sm">
                            <Select.ItemText>{p}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="submit" disabled={createTask.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-60">
                  {createTask.isPending ? 'Creating...' : 'Create Task'}
                </button>
                <Dialog.Close className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition border border-gray-200">
                  Cancel
                </Dialog.Close>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Task Detail Modal */}
      <Dialog.Root open={!!selectedTask} onOpenChange={o => { if (!o) setSelectedTask(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-full max-w-lg shadow-2xl z-50">
            {selectedTask && (
              <>
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs px-2.5 py-1 rounded-lg font-semibold border', priorityConfig[selectedTask.priority])}>
                      {selectedTask.priority}
                    </span>
                    <span className={cn('text-xs px-2.5 py-1 rounded-lg font-semibold', statusConfig[selectedTask.status].cls)}>
                      {statusConfig[selectedTask.status].label}
                    </span>
                  </div>
                  <Dialog.Close className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition">✕</Dialog.Close>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Title</label>
                    <input defaultValue={selectedTask.title}
                      onBlur={e => { if (e.target.value !== selectedTask.title) updateTask.mutate({ taskId: selectedTask._id, title: e.target.value } as any); }}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea defaultValue={selectedTask.description} rows={3}
                      onBlur={e => { if (e.target.value !== selectedTask.description) updateTask.mutate({ taskId: selectedTask._id, description: e.target.value } as any); }}
                      placeholder="Add a description..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <Select.Root defaultValue={selectedTask.status}
                        onValueChange={v => updateTask.mutate({ taskId: selectedTask._id, status: v as Task['status'] } as any, {
                          onSuccess: () => toast.success('Status updated'),
                        })}>
                        <Select.Trigger className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none hover:border-indigo-400 transition">
                          <Select.Value />
                          <Select.Icon><ChevronDown size={14} className="text-gray-400" /></Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className="bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                            <Select.Viewport className="p-1.5">
                              {Object.entries(statusConfig).map(([val, cfg]) => (
                                <Select.Item key={val} value={val} className="px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 outline-none data-[highlighted]:bg-gray-50 text-sm">
                                  <Select.ItemText>{cfg.label}</Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Priority</label>
                      <Select.Root defaultValue={selectedTask.priority}
                        onValueChange={v => updateTask.mutate({ taskId: selectedTask._id, priority: v as Task['priority'] } as any, {
                          onSuccess: () => toast.success('Priority updated'),
                        })}>
                        <Select.Trigger className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none hover:border-indigo-400 transition">
                          <Select.Value />
                          <Select.Icon><ChevronDown size={14} className="text-gray-400" /></Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className="bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                            <Select.Viewport className="p-1.5">
                              {(['low', 'medium', 'high'] as Task['priority'][]).map(p => (
                                <Select.Item key={p} value={p} className="px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 outline-none data-[highlighted]:bg-gray-50 capitalize text-sm">
                                  <Select.ItemText>{p}</Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </div>
                  </div>
                  {selectedTask.assignees.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Assignees</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedTask.assignees.map((a, i) => (
                          <div key={a._id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full pl-1 pr-3 py-1">
                            <div className={`w-5 h-5 rounded-full ${avatarColors[i % avatarColors.length]} text-white text-[9px] flex items-center justify-center font-bold`}>
                              {a.name[0].toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-gray-700">{a.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Add Member Modal */}
      <Dialog.Root open={showAddMember} onOpenChange={setShowAddMember}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-full max-w-sm shadow-2xl z-50">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <Dialog.Title className="text-base font-semibold text-gray-900">Add Member</Dialog.Title>
              <Dialog.Close className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition">✕</Dialog.Close>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Select member</label>
                <Select.Root value={selectedUserId} onValueChange={setSelectedUserId}>
                  <Select.Trigger className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 outline-none hover:border-indigo-400 transition">
                    <Select.Value placeholder="Choose a member..." />
                    <Select.Icon><ChevronDown size={14} className="text-gray-400" /></Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden w-[var(--radix-select-trigger-width)]">
                      <Select.Viewport className="p-1.5 max-h-48">
                        {availableMembers.length === 0
                          ? <div className="px-3 py-4 text-sm text-gray-400 text-center">No members available</div>
                          : availableMembers.map(m => (
                            <Select.Item key={m._id} value={m._id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-indigo-50 outline-none data-[highlighted]:bg-indigo-50">
                              <div className="w-7 h-7 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-semibold flex-shrink-0">
                                {m.name[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <Select.ItemText><p className="text-sm font-medium text-gray-800">{m.name}</p></Select.ItemText>
                                <p className="text-xs text-gray-400 truncate">{m.email}</p>
                              </div>
                            </Select.Item>
                          ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button disabled={!selectedUserId || addMember.isPending}
                  onClick={() => addMember.mutate({ projectId: id!, userId: selectedUserId, role: 'member' }, {
                    onSuccess: () => { toast.success('Member added'); setShowAddMember(false); setSelectedUserId(''); },
                  })}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50">
                  {addMember.isPending ? 'Adding...' : 'Add Member'}
                </button>
                <Dialog.Close className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition border border-gray-200">
                  Cancel
                </Dialog.Close>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
