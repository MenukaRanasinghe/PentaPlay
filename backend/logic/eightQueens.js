import { Worker } from "worker_threads";
import os from "os";

export const N = 8;

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

export async function solveEightQueensThreaded() {
  const start = performance.now();
  const cpuCount = Math.min(os.cpus().length, N);
  const colsPerWorker = Math.ceil(N / cpuCount);
  const workers = [];

  for (let i = 0; i < cpuCount; i++) {
    const fromCol = i * colsPerWorker;
    const toCol = Math.min(fromCol + colsPerWorker, N);

    if (fromCol >= toCol) break;

    workers.push(
      new Promise((resolve, reject) => {
        const worker = new Worker(
          new URL("./queenWorker.js", import.meta.url),
          {
            workerData: { fromCol, toCol },
          }
        );

        worker.on("message", resolve);
        worker.on("error", reject);
        worker.on("exit", (code) => {
          if (code !== 0)
            reject(new Error(`Worker stopped with exit code ${code}`));
        });
      })
    );
  }

  const results = await Promise.all(workers);
  const solutions = results.flat();

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

  const parts = raw.trim().split(/[, ]+/);
  if (parts.length !== 8) return null;

  const nums = parts.map(Number);
  if (nums.some(Number.isNaN)) return null;

  const min = Math.min(...nums);
  const max = Math.max(...nums);

  if (min >= 1 && max <= 8) return nums.map((n) => n - 1);
  if (min >= 0 && max <= 7) return nums;

  return null;
}
