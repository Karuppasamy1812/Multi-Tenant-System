import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProjectsApi } from '@api/projects.api';

export const useProjects = () => useQuery({ queryKey: ['projects'], queryFn: ProjectsApi.list });

export const useProject = (id: string) =>
  useQuery({ queryKey: ['projects', id], queryFn: () => ProjectsApi.get(id), enabled: !!id });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ProjectsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
};

export const useUpdateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; description: string }) => ProjectsApi.update(id, data),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['projects', v.id] });
    },
  });
};

export const useArchiveProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ProjectsApi.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
};

export const useAddMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, userId, role }: { projectId: string; userId: string; role: string }) =>
      ProjectsApi.addMember(projectId, { userId, role }),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['projects', v.projectId] }),
  });
};

export const useAddList = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, title }: { projectId: string; title: string }) =>
      ProjectsApi.addList(projectId, { title }),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['projects', v.projectId] }),
  });
};
