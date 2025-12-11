const N = 8;

export function solutionToSig(sol) {
  return sol.join(",");
}

function backtrack(row, cols, diag1, diag2, current, solutions) {
  if (row === N) {
    solutions.push([...current]);
    return;
  }

  for (let col = 0; col < N; col++) {
    const d1 = row - col;
    const d2 = row + col;

    if (cols.has(col) || diag1.has(d1) || diag2.has(d2)) continue;

    cols.add(col);
    diag1.add(d1);
    diag2.add(d2);
    current[row] = col;

    backtrack(row + 1, cols, diag1, diag2, current, solutions);

    cols.delete(col);
    diag1.delete(d1);
    diag2.delete(d2);
  }
}

export function solveEightQueensSequential() {
  const start = performance.now();
  const solutions = [];
  backtrack(0, new Set(), new Set(), new Set(), new Array(N), solutions);
  const end = performance.now();

  return {
    solutions,
    total: solutions.length,
    timeMs: Math.round(end - start),
  };
}

function backtrackFromFirstCol(firstCol, solutions) {
  const cols = new Set([firstCol]);
  const diag1 = new Set([0 - firstCol]);
  const diag2 = new Set([0 + firstCol]);
  const current = new Array(N);
  current[0] = firstCol;

  backtrack(1, cols, diag1, diag2, current, solutions);
}

export function solveEightQueensThreadedStyle() {
  const start = performance.now();
  const solutions = [];

  for (let firstCol = 0; firstCol < N; firstCol++) {
    backtrackFromFirstCol(firstCol, solutions);
  }

  const end = performance.now();
  return {
    solutions,
    total: solutions.length,
    timeMs: Math.round(end - start),
  };
}

export function buildChoicesQueens(correctTotal) {
  const s = new Set([correctTotal]);
  const min = Math.max(10, correctTotal - 10);
  const max = correctTotal + 10;

  while (s.size < 3) {
    const cand = Math.floor(Math.random() * (max - min + 1)) + min;
    s.add(cand);
  }
  return Array.from(s).sort(() => Math.random() - 0.5);
}

export function outcomeForQueens(choice, correctTotal) {
  if (choice === correctTotal) return "win";
  if (Math.abs(choice - correctTotal) <= 2) return "draw";
  return "lose";
}

export function parseSolutionPattern(raw) {
  if (!raw || typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/[, ]+/).filter(Boolean);
  if (parts.length !== 8) return null;

  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => Number.isNaN(n))) return null;

  let min = Math.min(...nums);
  let max = Math.max(...nums);

  if (min >= 1 && max <= 8) {
    return nums.map((n) => n - 1);
  }

  if (min >= 0 && max <= 7) {
    return nums;
  }

  return null;
}
