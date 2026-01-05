import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";
import { useState } from "react";

async function fetchUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/user', {
      credentials: 'include'
    });
    
    if (response.ok) {
      return await response.json();
    } else if (response.status === 401) {
      return null;
    } else {
      throw new Error('Failed to fetch user');
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

async function logout(): Promise<void> {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Logout failed');
  }
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      setIsLoggingOut(false);
    },
    onError: (error) => {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  });

  const handleLogout = () => {
    setIsLoggingOut(true);
    logoutMutation.mutate();
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login: () => {}, // Login is handled directly in login page
    logout: handleLogout,
    isLoggingOut: isLoggingOut || logoutMutation.isPending,
  };
}
