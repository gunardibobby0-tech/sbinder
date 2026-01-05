import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Document, InsertDocument } from "@shared/schema";

export function useDocuments(projectId: number) {
  return useQuery<Document[]>({
    queryKey: [`/api/projects/${projectId}/documents`],
    enabled: !!projectId,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (doc: InsertDocument) => {
      const res = await apiRequest("POST", `/api/projects/${doc.projectId}/documents`, doc);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${variables.projectId}/documents`] });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertDocument>) => {
      const res = await apiRequest("PUT", `/api/documents/${id}`, updates);
      return res.json();
    },
    onSuccess: (updatedDoc) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${updatedDoc.projectId}/documents`] });
    },
  });
}
