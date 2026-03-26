import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { TasksApi } from '@api/tasks.api';
import { getSocket } from '../lib/socket';
import type { Task } from '../lib/types';

export const useTasks = (projectId: string) => {
  const qc = useQueryClient();

  useEffect(() => {
    if (!projectId) return;
    const socket = getSocket();
    socket.emit('join-project', projectId);

    const upsert = (task: Task) =>
      qc.setQueryData<Task[]>(['tasks', projectId], (old = []) => {
        const idx = old.findIndex(t => t._id === task._id);
        return idx >= 0 ? old.map(t => t._id === task._id ? task : t) : [...old, task];
      });

    const remove = (taskId: string) =>
      qc.setQueryData<Task[]>(['tasks', projectId], (old = []) => old.filter(t => t._id !== taskId));

    socket.on('task-created', upsert);
    socket.on('task-updated', upsert);
    socket.on('task-deleted', remove);

    return () => {
      socket.emit('leave-project', projectId);
      socket.off('task-created', upsert);
      socket.off('task-updated', upsert);
      socket.off('task-deleted', remove);
    };
  }, [projectId, qc]);

  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => TasksApi.listByProject(projectId),
    enabled: !!projectId,
  });
};

export const useCreateTask = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Task>) => TasksApi.create(data),
    onSuccess: (task) => {
      qc.setQueryData<Task[]>(['tasks', projectId], (old = []) => [...old, task]);
      getSocket().emit('task-created', { projectId, task });
    },
  });
};

export const useUpdateTask = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, ...data }: { taskId: string } & Partial<Task>) => TasksApi.update(taskId, data),
    onSuccess: (task) => {
      qc.setQueryData<Task[]>(['tasks', projectId], (old = []) =>
        old.map(t => t._id === task._id ? task : t));
      getSocket().emit('task-updated', { projectId, task });
    },
  });
};

export const useDeleteTask = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => TasksApi.delete(taskId),
    onSuccess: (_, taskId) => {
      qc.setQueryData<Task[]>(['tasks', projectId], (old = []) => old.filter(t => t._id !== taskId));
      getSocket().emit('task-deleted', { projectId, taskId });
    },
  });
};
