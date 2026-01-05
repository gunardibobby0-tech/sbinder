import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

const settingsSchema = z.object({
  openaiKey: z.string().optional(),
  preferredModel: z.string().optional(),
  currency: z.enum(["IDR", "USD"]).optional(),
});

export type Settings = z.infer<typeof settingsSchema>;

async function fetchSettings(): Promise<Settings> {
  const response = await fetch("/api/settings", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function updateSettings(settings: Settings): Promise<Settings> {
  const response = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function fetchAvailableModels(): Promise<Array<{ id: string; name: string }>> {
  const response = await fetch("/api/settings/models", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export function useSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: fetchSettings,
    retry: false,
  });

  const { data: models = [] } = useQuery({
    queryKey: ["/api/settings/models"],
    queryFn: fetchAvailableModels,
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/settings"], data);
    },
  });

  return {
    settings,
    models,
    isLoading,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
