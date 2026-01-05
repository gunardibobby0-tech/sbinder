import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Contact, InsertContact } from "@shared/schema";

export function useContacts(projectId: number) {
  return useQuery<Contact[]>({
    queryKey: [`/api/projects/${projectId}/contacts`],
    enabled: !!projectId,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contact: InsertContact) => {
      const res = await apiRequest("POST", `/api/projects/${contact.projectId}/contacts`, contact);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${variables.projectId}/contacts`] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: number; projectId: number }) => {
      await apiRequest("DELETE", `/api/contacts/${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${variables.projectId}/contacts`] });
    },
  });
}
