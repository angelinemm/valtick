import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchResort,
  postBuyLift,
  postRepairLift,
  postResetResort,
  patchRenameResort,
} from "../api/client";
import type { BuyLiftRequest, RepairLiftRequest, GetResortResponse } from "@val-tick/shared";

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

export function useRenameResortMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => patchRenameResort(name),
    onSuccess: ({ name }) => {
      queryClient.setQueryData<GetResortResponse>(["resort"], (old) => {
        if (!old) return old;
        return { ...old, resort: { ...old.resort, name } };
      });
    },
  });
}
