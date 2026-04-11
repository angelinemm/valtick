import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchResort, postBuyLift, postRepairLift, postResetResort } from "../api/client";
import type { BuyLiftRequest, RepairLiftRequest, ResetResortRequest } from "@val-tick/shared";

export function useResort(guestId: string) {
  return useQuery({
    queryKey: ["resort", guestId],
    queryFn: () => fetchResort(guestId),
  });
}

export function useBuyLiftMutation(guestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: BuyLiftRequest) => postBuyLift(req),
    onSuccess: (data) => {
      queryClient.setQueryData(["resort", guestId], data);
    },
  });
}

export function useRepairLiftMutation(guestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: RepairLiftRequest) => postRepairLift(req),
    onSuccess: (data) => {
      queryClient.setQueryData(["resort", guestId], data);
    },
  });
}

export function useResetResortMutation(guestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: ResetResortRequest) => postResetResort(req),
    onSuccess: (data) => {
      queryClient.setQueryData(["resort", guestId], data);
    },
  });
}
