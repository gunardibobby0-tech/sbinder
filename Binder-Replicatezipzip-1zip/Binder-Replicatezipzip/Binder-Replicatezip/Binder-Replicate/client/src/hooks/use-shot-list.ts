import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ShotList, InsertShotList } from "@shared/schema";

export function useShotList(projectId: number) {
  return useQuery<ShotList[]>({
    queryKey: [`/api/projects/${projectId}/shot-list`],
    enabled: !!projectId,
  });
}

export function useCreateShotListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertShotList) => {
      const res = await apiRequest(
        "POST",
        `/api/projects/${data.projectId}/shot-list`,
        data
      );
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${variables.projectId}/shot-list`],
      });
    },
  });
}

export function useUpdateShotListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; projectId: number; updates: Partial<InsertShotList> }) => {
      const res = await apiRequest(
        "PUT",
        `/api/projects/${data.projectId}/shot-list/${data.id}`,
        data.updates
      );
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${variables.projectId}/shot-list`],
      });
    },
  });
}

export function useDeleteShotListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; projectId: number }) => {
      const res = await apiRequest(
        "DELETE",
        `/api/projects/${data.projectId}/shot-list/${data.id}`
      );
      return res.ok;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${variables.projectId}/shot-list`],
      });
    },
  });
}
