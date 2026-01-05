import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Cast, InsertCast } from "@shared/schema";

export function useCast(projectId: number) {
  return useQuery<Cast[]>({
    queryKey: [`/api/projects/${projectId}/cast`],
    enabled: !!projectId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${projectId}/cast`);
      return res.json();
    },
  });
}

export function useCreateCast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: number;
      data: InsertCast;
    }) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/cast`, data);
      return res.json();
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/cast`] });
    },
  });
}

export function useUpdateCast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      castId,
      data,
    }: {
      projectId: number;
      castId: number;
      data: Partial<InsertCast>;
    }) => {
      const res = await apiRequest("PUT", `/api/projects/${projectId}/cast/${castId}`, data);
      return res.json();
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/cast`] });
    },
  });
}

export function useDeleteCast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, castId }: { projectId: number; castId: number }) => {
      await apiRequest("DELETE", `/api/projects/${projectId}/cast/${castId}`);
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/cast`] });
    },
  });
}
