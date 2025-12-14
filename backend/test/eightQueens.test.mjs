import {
  solveEightQueensSequential,
  solveEightQueensThreaded,
  solutionToSig,
  buildChoicesQueens,
  outcomeForQueens,
  parseSolutionPattern,
  N,
} from "../logic/eightQueens.js";

describe("Eight Queens logic", () => {
  test("Sequential solver finds correct number of solutions (8-Queens = 92)", () => {
    const res = solveEightQueensSequential();
    expect(res.total).toBe(92);
    expect(res.solutions).toHaveLength(92);
    expect(res.timeMs).toBeGreaterThanOrEqual(0);
  });

  test("Threaded solver finds same number of solutions as Sequential", async () => {
    const seq = solveEightQueensSequential();
    const thr = await solveEightQueensThreaded();

    expect(thr.total).toBe(seq.total);
    expect(thr.solutions).toHaveLength(seq.solutions.length);
    expect(thr.timeMs).toBeGreaterThanOrEqual(0);
  });

  test("solutionToSig creates consistent signature", () => {
    const sol = [0, 4, 7, 5, 2, 6, 1, 3];
    const sig = solutionToSig(sol);
    expect(sig).toBe("0,4,7,5,2,6,1,3");
  });

  test("buildChoicesQueens returns 3 values and includes correct total", () => {
    const correct = 92;
    const choices = buildChoicesQueens(correct);

    expect(choices).toHaveLength(3);
    expect(choices).toContain(correct);
  });

  test("outcomeForQueens win / draw / lose logic", () => {
    expect(outcomeForQueens(92, 92)).toBe("win");
    expect(outcomeForQueens(91, 92)).toBe("draw");
    expect(outcomeForQueens(94, 92)).toBe("draw");
    expect(outcomeForQueens(80, 92)).toBe("lose");
  });

  test("parseSolutionPattern accepts 0-based input", () => {
    const raw = "0,4,7,5,2,6,1,3";
    const parsed = parseSolutionPattern(raw);

    expect(parsed).toEqual([0, 4, 7, 5, 2, 6, 1, 3]);
  });

  test("parseSolutionPattern accepts 1-based input and converts to 0-based", () => {
    const raw = "1 5 8 6 3 7 2 4";
    const parsed = parseSolutionPattern(raw);

    expect(parsed).toEqual([0, 4, 7, 5, 2, 6, 1, 3]);
  });

  test("parseSolutionPattern rejects invalid input", () => {
    expect(parseSolutionPattern("1,2,3")).toBeNull();          
    expect(parseSolutionPattern("a,b,c,d,e,f,g,h")).toBeNull(); 
    expect(parseSolutionPattern("9,9,9,9,9,9,9,9")).toBeNull(); 
    expect(parseSolutionPattern(null)).toBeNull();
  });

  test("All generated solutions are valid (no duplicate columns)", () => {
    const { solutions } = solveEightQueensSequential();

    for (const sol of solutions) {
      const uniqueCols = new Set(sol);
      expect(uniqueCols.size).toBe(N);
    }
  });

  test("All generated solutions satisfy diagonal constraints", () => {
    const { solutions } = solveEightQueensSequential();

    for (const sol of solutions) {
      const d1 = new Set();
      const d2 = new Set();

      sol.forEach((col, row) => {
        const diag1 = row - col;
        const diag2 = row + col;

        expect(d1.has(diag1)).toBe(false);
        expect(d2.has(diag2)).toBe(false);

        d1.add(diag1);
        d2.add(diag2);
      });
    }
  });
});
