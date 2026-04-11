import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  useResort,
  useBuyLiftMutation,
  useRepairLiftMutation,
  useResetResortMutation,
} from "../hooks/useResort";
import { useAuth } from "../hooks/useAuth";
import { GameNotFoundPage } from "./GameNotFoundPage";
import { ResortTopBar } from "../components/ResortTopBar";
import { LiftList } from "../components/LiftList";
import { JunkyardSection } from "../components/JunkyardSection";
import { NextLiftProgress } from "../components/NextLiftProgress";
import { useTick } from "../hooks/useTick";
import { logout } from "../api/auth";

export function ResortPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading, error } = useResort();
  const buyLift = useBuyLiftMutation();
  const repairLift = useRepairLiftMutation();
  const resetResort = useResetResortMutation();

  const { tickCount } = useTick();

  async function handleLogout() {
    await logout();
    queryClient.clear();
    navigate("/login");
  }

  if (isLoading) return <div>Loading...</div>;
  if (error?.message === "NOT_FOUND") return <GameNotFoundPage />;
  if (error || !data) return <div>Something went wrong.</div>;

  const activeLifts = data.lifts.filter((l) => l.status !== "junked");
  const junkedLifts = data.lifts.filter((l) => l.status === "junked");

  return (
    <div>
      <ResortTopBar
        resort={data.resort}
        summary={data.summary}
        tickCount={tickCount}
        username={user?.username ?? ""}
        isAdmin={user?.role === "ADMIN"}
        onReset={() => resetResort.mutate()}
        onLogout={handleLogout}
      />
      <NextLiftProgress
        liftModels={data.liftModels}
        currentMoneyCents={data.summary.moneyCents}
        ownedModelKeys={new Set(activeLifts.map((l) => l.liftModelKey))}
      />
      <LiftList
        liftModels={data.liftModels}
        lifts={activeLifts}
        currentMoneyCents={data.summary.moneyCents}
        onBuy={(key) => buyLift.mutate({ liftModelKey: key })}
        onRepair={(id) => repairLift.mutate({ liftId: id })}
      />
      <JunkyardSection liftModels={data.liftModels} junkedLifts={junkedLifts} />
    </div>
  );
}
