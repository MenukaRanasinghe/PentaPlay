import {
  generateBoard,
  bfsMinThrows,
  dijkstraMinThrows,
  buildChoices,
  outcomeFor,
  generateSolvableRound,
} from "../logic/snakeLadder.js";

describe("Snake & Ladder logic", () => {
  test("generateBoard creates N-2 ladders and N-2 snakes", () => {
    const N = 6;
    const { ladders, snakes } = generateBoard(N);
    expect(ladders).toHaveLength(N - 2);
    expect(snakes).toHaveLength(N - 2);
  });

  test("buildChoices returns 3 values and includes correct", () => {
    const correct = 4;
    const choices = buildChoices(correct);
    expect(choices).toHaveLength(3);
    expect(choices).toContain(correct);
  });

  test("outcomeFor win/draw/lose", () => {
    expect(outcomeFor(5, 5)).toBe("win");
    expect(outcomeFor(4, 5)).toBe("draw");
    expect(outcomeFor(6, 5)).toBe("draw");
    expect(outcomeFor(2, 5)).toBe("lose");
  });

  test("BFS and Dijkstra match on solvable rounds", () => {
    const N = 6;
    const { board } = generateSolvableRound(N, 2000);
    const b = bfsMinThrows(board, N);
    const d = dijkstraMinThrows(board, N);
    expect(b).toBeGreaterThan(0);
    expect(b).toBe(d);
  });

  test("min throws is -1 only if unreachable (rare), solvable round avoids that", () => {
    const N = 6;
    const { board, answer } = generateSolvableRound(N, 2000);
    expect(answer).not.toBe(-1);
    expect(bfsMinThrows(board, N)).toBe(answer);
  });
});
