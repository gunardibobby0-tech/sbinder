import { useQuery } from "@tanstack/react-query";
import type { Crew } from "@shared/schema";

export function useCrewSuggest(projectId: number, eventType?: string, eventDescription?: string) {
  return useQuery({
    queryKey: ["crew-suggest", projectId, eventType, eventDescription],
    queryFn: async () => {
      if (!eventType) return [];
      
      const response = await fetch(`/api/projects/${projectId}/crew/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ eventType, eventDescription }),
      });
      if (!response.ok) return [];
      return response.json() as Promise<Crew[]>;
    },
    enabled: !!eventType,
  });
}
