import { useParams } from "react-router-dom";
import { useResort } from "../hooks/useResort";
import { GameNotFoundPage } from "./GameNotFoundPage";
import { ResortTopBar } from "../components/ResortTopBar";

export function ResortPage() {
  const { guestId } = useParams<{ guestId: string }>();
  const { data, isLoading, error } = useResort(guestId!);

  if (isLoading) return <div>Loading...</div>;
  if (error?.message === "NOT_FOUND") return <GameNotFoundPage />;
  if (error || !data) return <div>Something went wrong.</div>;

  return (
    <div>
      <ResortTopBar resort={data.resort} summary={data.summary} />
      {/* lift list coming next */}
    </div>
  );
}
