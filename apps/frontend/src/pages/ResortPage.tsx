import { useParams } from "react-router-dom";
import { useResort, useBuyLiftMutation, useRepairLiftMutation } from "../hooks/useResort";
import { GameNotFoundPage } from "./GameNotFoundPage";
import { ResortTopBar } from "../components/ResortTopBar";
import { LiftList } from "../components/LiftList";

export function ResortPage() {
  const { guestId } = useParams<{ guestId: string }>();
  const { data, isLoading, error } = useResort(guestId!);
  const buyLift = useBuyLiftMutation(guestId!);
  const repairLift = useRepairLiftMutation(guestId!);

  if (isLoading) return <div>Loading...</div>;
  if (error?.message === "NOT_FOUND") return <GameNotFoundPage />;
  if (error || !data) return <div>Something went wrong.</div>;

  const activeLifts = data.lifts.filter((l) => l.status !== "junked");

  return (
    <div>
      <ResortTopBar resort={data.resort} summary={data.summary} />
      <LiftList
        liftModels={data.liftModels}
        lifts={activeLifts}
        currentMoneyCents={data.summary.moneyCents}
        onBuy={(key) => buyLift.mutate({ guestId: guestId!, liftModelKey: key })}
        onRepair={(id) => repairLift.mutate({ guestId: guestId!, liftId: id })}
      />
    </div>
  );
}
