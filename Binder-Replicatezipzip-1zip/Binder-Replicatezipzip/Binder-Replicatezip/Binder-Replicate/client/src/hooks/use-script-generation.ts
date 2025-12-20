import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useGenerateScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      docId,
      prompt,
      model,
      language,
    }: {
      docId: number;
      prompt: string;
      model?: string;
      language?: 'en' | 'id';
    }) => {
      const response = await fetch(api.documents.generate.path.replace(":id", String(docId)), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt, model, language: language || 'id' }),
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
  });
}

export function useAutoSuggest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      scriptContent,
      model,
    }: {
      projectId: number;
      scriptContent: string;
      model?: string;
    }) => {
      const response = await fetch(`/api/projects/${projectId}/auto-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ scriptContent, model }),
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });
}
