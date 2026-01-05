import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CrewMaster, InsertCrewMaster } from "@shared/schema";

export function useCrewMaster() {
  return useQuery<CrewMaster[]>({
    queryKey: ["crew-master"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/crew-master");
      return res.json();
    },
  });
}

export function useCreateCrewMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCrewMaster) => {
      const res = await apiRequest("POST", "/api/crew-master", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew-master"] });
    },
  });
}

export function useUpdateCrewMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      crewMasterId,
      data,
    }: {
      crewMasterId: number;
      data: Partial<InsertCrewMaster>;
    }) => {
      const res = await apiRequest("PUT", `/api/crew-master/${crewMasterId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew-master"] });
    },
  });
}

export function useDeleteCrewMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (crewMasterId: number) => {
      await apiRequest("DELETE", `/api/crew-master/${crewMasterId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew-master"] });
    },
  });
}
