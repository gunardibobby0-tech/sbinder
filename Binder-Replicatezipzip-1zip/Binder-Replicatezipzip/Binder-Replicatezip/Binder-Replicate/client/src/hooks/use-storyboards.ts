import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface Storyboard {
  id: number;
  projectId: number;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoryboardImage {
  id: number;
  storyboardId: number;
  imageUrl: string;
  caption: string;
  order: number;
  createdAt: string;
}

export interface InsertStoryboard {
  projectId: number;
  title: string;
  description?: string;
}

export interface InsertStoryboardImage {
  storyboardId: number;
  imageUrl: string;
  caption?: string;
  order: number;
}

export function useStoryboards(projectId: number) {
  return useQuery<Storyboard[]>({
    queryKey: [`/api/projects/${projectId}/storyboards`],
    enabled: !!projectId,
  });
}

export function useStoryboardImages(storyboardId: number) {
  return useQuery<StoryboardImage[]>({
    queryKey: [`/api/storyboards/${storyboardId}/images`],
    enabled: !!storyboardId,
  });
}

export function useCreateStoryboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertStoryboard) => {
      const res = await apiRequest(
        "POST",
        `/api/projects/${data.projectId}/storyboards`,
        data
      );
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${variables.projectId}/storyboards`],
      });
    },
  });
}

export function useDeleteStoryboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { storyboardId: number; projectId: number }) => {
      await apiRequest(
        "DELETE",
        `/api/storyboards/${data.storyboardId}`
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${variables.projectId}/storyboards`],
      });
    },
  });
}

export function useAddImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertStoryboardImage) => {
      const res = await apiRequest(
        "POST",
        `/api/storyboards/${data.storyboardId}/images`,
        data
      );
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/storyboards/${variables.storyboardId}/images`],
      });
    },
  });
}

export function useDeleteImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imageId: number) => {
      await apiRequest("DELETE", `/api/storyboards/images/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/storyboards/"],
      });
    },
  });
}

export function useGenerateImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ storyboardId, prompt, order }: { storyboardId: number; prompt: string; order: number }) => {
      const res = await apiRequest("POST", "/api/generate-image", { prompt });
      const { b64_json } = await res.json();
      
      const imageUrl = `data:image/png;base64,${b64_json}`;
      
      const addRes = await apiRequest("POST", `/api/storyboards/${storyboardId}/images`, {
        storyboardId,
        imageUrl,
        caption: prompt,
        order,
      });
      return addRes.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/storyboards/${variables.storyboardId}/images`],
      });
    },
  });
}
