import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Crew, CrewAssignment, InsertCrew, InsertCrewAssignment } from "@shared/schema";

export function useCrew(projectId: number) {
  return useQuery({
    queryKey: ["crew", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/crew`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch crew");
      return response.json() as Promise<Crew[]>;
    },
  });
}

export function useCrewAssignments(projectId: number) {
  return useQuery({
    queryKey: ["crew-assignments", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/crew-assignments`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch crew assignments");
      return response.json() as Promise<CrewAssignment[]>;
    },
  });
}

export function useCreateCrew() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: number;
      data: InsertCrew;
    }) => {
      const response = await fetch(`/api/projects/${projectId}/crew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create crew");
      return response.json();
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["crew", projectId] });
    },
  });
}

export function useUpdateCrew() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      crewId,
      data,
    }: {
      projectId: number;
      crewId: number;
      data: Partial<InsertCrew>;
    }) => {
      const response = await fetch(`/api/projects/${projectId}/crew/${crewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update crew");
      return response.json();
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["crew", projectId] });
    },
  });
}

export function useDeleteCrew() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, crewId }: { projectId: number; crewId: number }) => {
      const response = await fetch(`/api/projects/${projectId}/crew/${crewId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete crew");
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["crew", projectId] });
    },
  });
}

export function useCreateCrewAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: number;
      data: InsertCrewAssignment;
    }) => {
      const response = await fetch(`/api/projects/${projectId}/crew-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create crew assignment");
      return response.json();
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["crew-assignments", projectId] });
    },
  });
}

export function useDeleteCrewAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: number) => {
      const response = await fetch(`/api/crew-assignments/${assignmentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete crew assignment");
    },
    onSuccess: (_, assignmentId) => {
      queryClient.invalidateQueries({ queryKey: ["crew-assignments"] });
    },
  });
}

export function useCheckCrewConflicts() {
  return useMutation({
    mutationFn: async ({
      projectId,
      crewId,
      eventId,
    }: {
      projectId: number;
      crewId: number;
      eventId: number;
    }) => {
      const response = await fetch(`/api/projects/${projectId}/crew-assignments/check-conflicts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ crewId, eventId }),
      });
      if (!response.ok) throw new Error("Failed to check conflicts");
      return response.json() as Promise<{ hasConflict: boolean; conflicts: Array<{ eventId: number; eventTitle: string; startTime: Date; endTime: Date }> }>;
    },
  });
}
