import { parentPort, workerData } from "worker_threads";

const N = 8;

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

const { fromCol, toCol } = workerData;
const solutions = [];

for (let firstCol = fromCol; firstCol < toCol; firstCol++) {
  const cols = new Set([firstCol]);
  const diag1 = new Set([0 - firstCol]);
  const diag2 = new Set([0 + firstCol]);
  const current = new Array(N);
  current[0] = firstCol;

  backtrack(1, cols, diag1, diag2, current, solutions);
}

parentPort.postMessage(solutions);
