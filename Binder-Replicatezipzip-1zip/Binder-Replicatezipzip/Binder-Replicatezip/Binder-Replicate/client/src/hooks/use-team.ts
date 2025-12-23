import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface ProjectMember {
  id: number;
  projectId: number;
  userId: string;
  email: string;
  userName: string;
  role: "owner" | "editor" | "viewer";
  joinedAt: string;
}

export interface ProjectInvitation {
  id: number;
  projectId: number;
  email: string;
  role: "editor" | "viewer";
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  projectId: number;
  userId: string;
  userName: string;
  action: string;
  description: string;
  timestamp: string;
}

export function useProjectMembers(projectId: number) {
  return useQuery<ProjectMember[]>({
    queryKey: [`/api/projects/${projectId}/members`],
    enabled: !!projectId,
  });
}

export function useProjectInvitations(projectId: number) {
  return useQuery<ProjectInvitation[]>({
    queryKey: [`/api/projects/${projectId}/invitations`],
    enabled: !!projectId,
  });
}

export function useActivityLog(projectId: number) {
  return useQuery<ActivityLog[]>({
    queryKey: [`/api/projects/${projectId}/activity`],
    enabled: !!projectId,
  });
}

export function useInviteTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { projectId: number; email: string; role: "editor" | "viewer" }) => {
      const res = await apiRequest("POST", `/api/projects/${data.projectId}/invite`, {
        email: data.email,
        role: data.role,
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${variables.projectId}/invitations`],
      });
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { projectId: number; memberId: number }) => {
      await apiRequest("DELETE", `/api/projects/${data.projectId}/members/${data.memberId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${variables.projectId}/members`],
      });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { projectId: number; memberId: number; role: string }) => {
      const res = await apiRequest("PUT", `/api/projects/${data.projectId}/members/${data.memberId}`, {
        role: data.role,
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${variables.projectId}/members`],
      });
    },
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { projectId: number; invitationId: number }) => {
      await apiRequest("DELETE", `/api/projects/${data.projectId}/invitations/${data.invitationId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${variables.projectId}/invitations`],
      });
    },
  });
}
