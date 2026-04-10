import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postTick } from "../api/client";

export function useTickMutation(guestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => postTick(guestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resort", guestId] });
    },
  });
}
