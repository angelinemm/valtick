import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "../api/auth";

export function useAuth() {
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  return { user: data ?? null, isLoading, isAuthenticated: data != null };
}
