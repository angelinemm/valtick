import type { LiftDTO, LiftModelDTO } from "@val-tick/shared";
import { liftIcons } from "../assets/liftIcons";

interface Props {
  liftModels: LiftModelDTO[];
  junkedLifts: LiftDTO[];
}

export function JunkyardSection({ liftModels, junkedLifts }: Props) {
  if (junkedLifts.length === 0) return null;

  const groupedByModel = liftModels
    .map((model) => ({
      model,
      lifts: junkedLifts.filter((l) => l.liftModelKey === model.key),
    }))
    .filter(({ lifts }) => lifts.length > 0);

  return (
    <section>
      <h2>Junkyard</h2>
      <p>{junkedLifts.length} lifts junked</p>
      {groupedByModel.map(({ model, lifts }) => (
        <div key={model.key}>
          <strong>{model.name}</strong>
          {lifts.map((lift) => (
            <div
              key={lift.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.25rem 0",
              }}
            >
              <img src={liftIcons[model.iconKey]} alt={model.name} width={24} height={24} />
              <span>{model.name}</span>
              <span style={{ color: "#888", fontWeight: "bold" }}>JUNKED</span>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
