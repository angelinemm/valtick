import { describe, it, expectTypeOf } from "vitest";
import type { LiftStatus, LiftModelKey } from "../enums";
import type { LiftDTO, SummaryDTO } from "../models";

describe("LiftStatus", () => {
  it('allows "working"', () => {
    expectTypeOf<"working">().toMatchTypeOf<LiftStatus>();
  });

  it('allows "broken"', () => {
    expectTypeOf<"broken">().toMatchTypeOf<LiftStatus>();
  });

  it('allows "junked"', () => {
    expectTypeOf<"junked">().toMatchTypeOf<LiftStatus>();
  });
});

describe("LiftModelKey", () => {
  it('allows "magic_carpet"', () => {
    expectTypeOf<"magic_carpet">().toMatchTypeOf<LiftModelKey>();
  });

  it('allows "cable_car"', () => {
    expectTypeOf<"cable_car">().toMatchTypeOf<LiftModelKey>();
  });
});

describe("LiftDTO", () => {
  it("has a status field of type LiftStatus", () => {
    expectTypeOf<LiftDTO["status"]>().toEqualTypeOf<LiftStatus>();
  });
});

describe("SummaryDTO", () => {
  it("has a moneyCents field of type number", () => {
    expectTypeOf<SummaryDTO["moneyCents"]>().toEqualTypeOf<number>();
  });
});
