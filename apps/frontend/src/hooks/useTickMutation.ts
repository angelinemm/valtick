import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postTick } from "../api/client";

export function useTickMutation(onTick?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => postTick(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resort"] });
      onTick?.();
    },
  });
}
