import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchResort, postBuyLift, postRepairLift, postResetResort } from "../api/client";
import type { BuyLiftRequest, RepairLiftRequest } from "@val-tick/shared";

export function useResort() {
  return useQuery({
    queryKey: ["resort"],
    queryFn: fetchResort,
  });
}

export function useBuyLiftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: BuyLiftRequest) => postBuyLift(req),
    onSuccess: (data) => {
      queryClient.setQueryData(["resort"], data);
    },
  });
}

export function useRepairLiftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: RepairLiftRequest) => postRepairLift(req),
    onSuccess: (data) => {
      queryClient.setQueryData(["resort"], data);
    },
  });
}

export function useResetResortMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => postResetResort(),
    onSuccess: (data) => {
      queryClient.setQueryData(["resort"], data);
    },
  });
}
