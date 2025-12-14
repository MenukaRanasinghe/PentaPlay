import {
  PEGS_3,
  PEGS_4,
  hanoi3Recursive,
  hanoi3Iterative,
  hanoi4NaiveVia3,
  frameStewart4,
  buildChoicesHanoi,
  outcomeForHanoi,
  formatMoves,
  validateHanoiSequence,
} from "../logic/towerHanoi.js";

describe("Tower of Hanoi logic", () => {

  test("3-Peg Recursive solver produces correct number of moves (2^n - 1)", () => {
    const n = 4;
    const moves = hanoi3Recursive(n, "A", "B", "D", []);

    expect(moves.length).toBe(Math.pow(2, n) - 1);
  });

  test("3-Peg Iterative solver matches Recursive solver move count", () => {
    const n = 5;
    const rec = hanoi3Recursive(n, "A", "B", "D", []);
    const iter = hanoi3Iterative(n, "A", "B", "D");

    expect(iter.length).toBe(rec.length);
  });

  test("3-Peg Recursive produces valid formatted moves", () => {
    const moves = hanoi3Recursive(3, "A", "B", "D", []);
    const formatted = formatMoves(moves);

    expect(formatted[0]).toMatch(/A->D|A->B/);
    expect(formatted).toHaveLength(7);
  });

  test("4-Peg Frame–Stewart produces fewer moves than naive 3-peg approach", () => {
    const n = 6;

    const fs = frameStewart4(n, PEGS_4, "A", "D").moves;
    const naive = hanoi4NaiveVia3(n, PEGS_4);

    expect(fs.length).toBeLessThan(naive.length);
  });

  test("4-Peg Frame–Stewart returns valid move structure", () => {
    const fs = frameStewart4(4, PEGS_4, "A", "D").moves;

    expect(fs.length).toBeGreaterThan(0);
    expect(fs[0]).toHaveLength(2);
  });

  test("buildChoicesHanoi returns 3 choices and includes correct answer", () => {
    const correct = 31;
    const choices = buildChoicesHanoi(correct);

    expect(choices).toHaveLength(3);
    expect(choices).toContain(correct);
  });

  test("outcomeForHanoi win / draw / lose logic", () => {
    const correct = 31;

    expect(outcomeForHanoi(31, correct)).toBe("win");
    expect(outcomeForHanoi(30, correct)).toBe("draw");
    expect(outcomeForHanoi(33, correct)).toBe("draw");
    expect(outcomeForHanoi(20, correct)).toBe("lose");
  });

  test("validateHanoiSequence accepts correct solution", () => {
    const sequence = "A->D, A->B, D->B";

    const res = validateHanoiSequence({
      sequenceText: sequence,
      disks: 2,
      pegLabels: PEGS_3,
      source: "A",
      dest: "B",
    });

    expect(res.valid).toBe(true);
  });

  test("validateHanoiSequence rejects illegal move (larger on smaller)", () => {
    const sequence = "A->D, A->D";

    const res = validateHanoiSequence({
      sequenceText: sequence,
      disks: 2,
      pegLabels: PEGS_3,
      source: "A",
      dest: "D",
    });

    expect(res.valid).toBe(false);
  });

  test("validateHanoiSequence rejects invalid peg name", () => {
    const sequence = "A->X";

    const res = validateHanoiSequence({
      sequenceText: sequence,
      disks: 1,
      pegLabels: PEGS_3,
      source: "A",
      dest: "D",
    });

    expect(res.valid).toBe(false);
  });

  test("validateHanoiSequence rejects empty input", () => {
    const res = validateHanoiSequence({
      sequenceText: "",
      disks: 3,
      pegLabels: PEGS_3,
      source: "A",
      dest: "D",
    });

    expect(res.valid).toBe(false);
  });

  test("Final peg must contain all disks in correct order", () => {
    const moves = hanoi3Recursive(3, "A", "B", "D", []);
    const text = formatMoves(moves).join(", ");

    const res = validateHanoiSequence({
      sequenceText: text,
      disks: 3,
      pegLabels: PEGS_3,
      source: "A",
      dest: "D",
    });

    expect(res.valid).toBe(true);
  });

});
