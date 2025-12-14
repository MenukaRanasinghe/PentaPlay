export const PEGS_3 = ["A", "B", "D"];
export const PEGS_4 = ["A", "B", "C", "D"];

export function formatMoves(moves) {
  return moves.map(([from, to]) => `${from}->${to}`);
}

export function hanoi3Recursive(n, from, aux, to, moves = []) {
  if (n === 0) return moves;
  hanoi3Recursive(n - 1, from, to, aux, moves);
  moves.push([from, to]);
  hanoi3Recursive(n - 1, aux, from, to, moves);
  return moves;
}

export function hanoi3Iterative(n, from = "A", aux = "B", to = "D") {
  const moves = [];
  const totalMoves = Math.pow(2, n) - 1;

  let src = from;
  let dest = to;
  let spare = aux;

  if (n % 2 === 0) {
    [dest, spare] = [spare, dest];
  }

  const pegs = {
    [src]: [],
    [dest]: [],
    [spare]: [],
  };

  for (let i = n; i >= 1; i--) pegs[src].push(i);

  function moveDisc(p1, p2) {
    const fromArr = pegs[p1];
    const toArr = pegs[p2];
    const top1 = fromArr[fromArr.length - 1];
    const top2 = toArr[toArr.length - 1];

    if (!top1) {
      fromArr.push(toArr.pop());
      moves.push([p2, p1]);
    } else if (!top2) {
      toArr.push(fromArr.pop());
      moves.push([p1, p2]);
    } else if (top1 < top2) {
      toArr.push(fromArr.pop());
      moves.push([p1, p2]);
    } else {
      fromArr.push(toArr.pop());
      moves.push([p2, p1]);
    }
  }

  for (let i = 1; i <= totalMoves; i++) {
    if (i % 3 === 1) {
      moveDisc(src, dest);
    } else if (i % 3 === 2) {
      moveDisc(src, spare);
    } else {
      moveDisc(spare, dest);
    }
  }

  return moves;
}

export function hanoi4NaiveVia3(n, pegs = PEGS_4) {
  const [A, B, , D] = pegs; 
  const moves = hanoi3Recursive(n, A, B, D, []);
  return moves;
}

const fsMemo = new Map();

export function frameStewart4(n, pegs = PEGS_4, from = "A", to = "D") {
  const key = `${n}|${from}|${to}`;
  if (fsMemo.has(key)) {
    const cached = fsMemo.get(key);
    return { moves: cached.map(m => [...m]) };
  }

  if (n === 0) {
    return { moves: [] };
  }
  if (n === 1) {
    const one = [[from, to]];
    fsMemo.set(key, one);
    return { moves: one.map(m => [...m]) };
  }

  const auxPegs = pegs.filter(p => p !== from && p !== to);

  let bestMoves = null;
  let bestCount = Infinity;

  for (let k = 1; k < n; k++) {
    for (const mid of auxPegs) {
      const part1 = frameStewart4(k, pegs, from, mid).moves;
      const otherAux = auxPegs.find(p => p !== mid);
      const part2 = hanoi3Recursive(n - k, from, otherAux, to, []);

      const part3 = frameStewart4(k, pegs, mid, to).moves;

      const candidate = [...part1, ...part2, ...part3];
      if (candidate.length < bestCount) {
        bestCount = candidate.length;
        bestMoves = candidate;
      }
    }
  }

  fsMemo.set(key, bestMoves);
  return { moves: bestMoves.map(m => [...m]) };
}

export function buildChoicesHanoi(correctMoves) {
  const s = new Set([correctMoves]);
  const min = Math.max(1, correctMoves - 10);
  const max = correctMoves + 10;

  while (s.size < 3) {
    const cand =
      Math.floor(Math.random() * (max - min + 1)) + min;
    s.add(cand);
  }
  return Array.from(s).sort(() => Math.random() - 0.5);
}

export function outcomeForHanoi(choice, correctMoves) {
  if (choice === correctMoves) return "win";
  if (Math.abs(choice - correctMoves) <= 2) return "draw";
  return "lose";
}

export function validateHanoiSequence({
  sequenceText,
  disks,
  pegLabels,
  source,
  dest,
}) {
  if (!sequenceText || !sequenceText.trim()) {
    return { valid: false, error: "Sequence is empty" };
  }

  const moves = sequenceText
    .split(",")
    .map(m => m.trim())
    .filter(Boolean)
    .map(m => {
      const [from, to] = m.split("->");
      return { from, to };
    });

  const pegs = {};
  pegLabels.forEach(p => (pegs[p] = []));
  for (let i = disks; i >= 1; i--) pegs[source].push(i);

  for (let i = 0; i < moves.length; i++) {
    const { from, to } = moves[i];

    if (!pegs[from] || !pegs[to]) {
      return { valid: false, error: `Invalid peg at move ${i + 1}` };
    }

    if (pegs[from].length === 0) {
      return { valid: false, error: `No disk on ${from} at move ${i + 1}` };
    }

    const disk = pegs[from][pegs[from].length - 1];
    const topDest = pegs[to][pegs[to].length - 1];

    if (topDest && topDest < disk) {
      return {
        valid: false,
        error: `Illegal move at step ${i + 1} (larger on smaller)`,
      };
    }

    pegs[from].pop();
    pegs[to].push(disk);
  }

  if (
    pegs[dest].length !== disks ||
    pegs[dest].some((d, i) => d !== disks - i)
  ) {
    return {
      valid: false,
      error: "Final configuration is incorrect",
    };
  }

  return { valid: true };
}
