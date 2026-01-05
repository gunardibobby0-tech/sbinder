import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Conversation, Message } from "@shared/models/chat";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await fetch("/api/conversations", {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json() as Promise<Conversation[]>;
    },
  });
}

export function useConversation(id: number) {
  return useQuery({
    queryKey: ["conversation", id],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${id}`, {
        credentials: "include",
      });
      if (!response.ok) return null;
      return response.json() as Promise<Conversation & { messages: Message[] }>;
    },
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string = "New Chat") => {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error("Failed to create conversation");
      return response.json() as Promise<Conversation>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      model,
    }: {
      conversationId: number;
      content: string;
      model?: string;
    }) => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content, model }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json() as Promise<{ content: string }>;
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete conversation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
