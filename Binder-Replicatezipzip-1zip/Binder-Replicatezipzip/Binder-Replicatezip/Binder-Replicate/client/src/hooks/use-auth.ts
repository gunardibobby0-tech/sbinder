import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";
import { useState } from "react";

const MOCK_USER: User = {
  id: "user_1",
  email: "user@studiobinder.local",
  firstName: "Studio",
  lastName: "User",
  profileImageUrl: undefined,
};

async function fetchUser(): Promise<User | null> {
  return MOCK_USER;
}

async function login(): Promise<User> {
  return MOCK_USER;
}

async function logout(): Promise<void> {
  // No-op for mock auth
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      setIsLoggingOut(false);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingOut: isLoggingOut || logoutMutation.isPending,
  };
}
