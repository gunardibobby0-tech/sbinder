import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Budget, BudgetLineItem, InsertBudgetLineItem } from "@shared/schema";

export function useBudget(projectId: number) {
  return useQuery({
    queryKey: ["budget", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/budget`, {
        credentials: "include",
      });
      if (!response.ok) return null;
      return response.json() as Promise<Budget>;
    },
  });
}

export function useBudgetLineItems(projectId: number) {
  return useQuery({
    queryKey: ["budget-line-items", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/budget/line-items`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json() as Promise<BudgetLineItem[]>;
    },
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, totalBudget, contingency }: { projectId: number; totalBudget: string; contingency?: string }) => {
      const response = await fetch(`/api/projects/${projectId}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ totalBudget, contingency }),
      });
      if (!response.ok) throw new Error("Failed to create budget");
      return response.json();
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["budget", projectId] });
    },
  });
}

export function useCreateBudgetLineItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: number; data: InsertBudgetLineItem }) => {
      const response = await fetch(`/api/projects/${projectId}/budget/line-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create line item");
      return response.json();
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["budget-line-items", projectId] });
    },
  });
}

export function useDeleteBudgetLineItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, itemId }: { projectId: number; itemId: number }) => {
      const response = await fetch(`/api/projects/${projectId}/budget/line-items/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete line item");
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["budget-line-items", projectId] });
    },
  });
}
