import { describe, expect, it } from "vitest";

import { GameResult } from "@/stores/game";
import { gameMode, nextGame, roomSeed } from "@/plugins/game-flow";

describe("game flow", () => {
  it("chooses the next-game mode", () => {
    expect(gameMode(GameResult.InProgress)).toBe("restart");
    expect(gameMode(GameResult.BothTeamsLost)).toBe("restart");
    expect(gameMode(GameResult.RedTeamWon)).toBe("next");
    expect(gameMode(GameResult.BlueTeamWon)).toBe("next");
  });

  it("calculates idempotent game transitions", () => {
    expect(nextGame(1, 2, "restart", 2)).toEqual({
      turn: 2,
      captainTurn: 2,
    });
    expect(nextGame(1, 2, "next", 2)).toEqual({
      turn: 2,
      captainTurn: 3,
    });
    expect(nextGame(2, 2, "next", 2)).toBeNull();
  });

  it("builds a stable daily room seed", () => {
    expect(roomSeed(new Date(2024, 0, 2), "212")).toBe("20240102212");
  });
});
