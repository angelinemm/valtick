import { useQuery } from "@tanstack/react-query";
import { fetchResortRanking } from "../api/client";

export function useResortRanking() {
  return useQuery({
    queryKey: ["resortRanking"],
    queryFn: fetchResortRanking,
  });
}
