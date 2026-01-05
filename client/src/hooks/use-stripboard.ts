import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";

export interface StripboardStrip {
  id: number;
  eventId: number;
  sceneNumber: string;
  order: number;
  event: Event;
  color?: string;
}

export function useStripboardEvents(projectId: number) {
  return useQuery<Event[]>({
    queryKey: [`/api/projects/${projectId}/stripboard/events`],
    enabled: !!projectId,
  });
}

export function useReorderStripboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { projectId: number; orderedEventIds: number[] }) => {
      const res = await apiRequest(
        "POST",
        `/api/projects/${data.projectId}/stripboard/reorder`,
        { orderedEventIds: data.orderedEventIds }
      );
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${variables.projectId}/stripboard/events`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${variables.projectId}/events`],
      });
    },
  });
}

export function useUpdateEventOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { eventId: number; projectId: number; order: number }) => {
      const res = await apiRequest(
        "PUT",
        `/api/events/${data.eventId}/order`,
        { order: data.order }
      );
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${variables.projectId}/stripboard/events`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${variables.projectId}/events`],
      });
    },
  });
}
