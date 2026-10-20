import { describe, expect, it } from "vitest";
import { GameResult } from "@/game/types";
import { nextCaptainTurn } from "@/game/flow";

describe("game flow", () => {
  it("advances captains only after a team wins", () => {
    expect(nextCaptainTurn(3, GameResult.InProgress)).toBe(3);
    expect(nextCaptainTurn(3, GameResult.BothTeamsLost)).toBe(3);
    expect(nextCaptainTurn(3, GameResult.RedTeamWon)).toBe(4);
    expect(nextCaptainTurn(3, GameResult.BlueTeamWon)).toBe(4);
  });
});
