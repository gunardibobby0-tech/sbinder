import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Event, InsertEvent } from "@shared/schema";

export function useEvents(projectId: number) {
  return useQuery<Event[]>({
    queryKey: [`/api/projects/${projectId}/events`],
    enabled: !!projectId,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: InsertEvent) => {
      const res = await apiRequest("POST", `/api/projects/${event.projectId}/events`, event);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${variables.projectId}/events`] });
    },
  });
}
