export function generateBoard(N) {
  const total = N * N;

  const ladders = [];
  const snakes = [];
  const occupied = new Set([1, total]); 

  const taken = (x) => occupied.has(x);
  const reserve = (x) => occupied.add(x);

  for (let i = 0; i < N - 2; i++) {
    let bottom, top, attempts = 0;
    do {
      attempts++;
      if (attempts > 5000) throw new Error("Failed to place ladders");
      bottom = randInt(2, total - 2);
      top = randInt(bottom + 1, total - 1);
    } while (taken(bottom) || taken(top) || top - bottom < 2);
    ladders.push([bottom, top]);
    reserve(bottom);
    reserve(top);
  }

  for (let i = 0; i < N - 2; i++) {
    let head, tail, attempts = 0;
    do {
      attempts++;
      if (attempts > 5000) throw new Error("Failed to place snakes");
      head = randInt(3, total - 1);
      tail = randInt(2, head - 1);
    } while (taken(head) || taken(tail) || head - tail < 2);
    snakes.push([head, tail]);
    reserve(head);
    reserve(tail);
  }

  const board = Array(total + 1).fill(-1);
  for (const [b, t] of ladders) board[b] = t;
  for (const [h, t] of snakes) board[h] = t;

  return { board, ladders, snakes };
}

export function bfsMinThrows(board, N) {
  const target = N * N;
  const visited = Array(target + 1).fill(false);
  const q = [];
  visited[1] = true;
  q.push({ cell: 1, dist: 0 });

  while (q.length) {
    const { cell, dist } = q.shift();
    if (cell === target) return dist;

    for (let dice = 1; dice <= 6; dice++) {
      let next = cell + dice;
      if (next > target) continue;
      if (board[next] !== -1) next = board[next];
      if (!visited[next]) {
        visited[next] = true;
        q.push({ cell: next, dist: dist + 1 });
      }
    }
  }
  return -1;
}

export function dijkstraMinThrows(board, N) {
  const target = N * N;
  const dist = Array(target + 1).fill(Infinity);
  dist[1] = 0;

  const pq = [{ node: 1, d: 0 }];

  while (pq.length) {
    pq.sort((a, b) => a.d - b.d);
    const { node, d } = pq.shift();
    if (d !== dist[node]) continue;
    if (node === target) return d;

    for (let dice = 1; dice <= 6; dice++) {
      let next = node + dice;
      if (next > target) continue;
      if (board[next] !== -1) next = board[next];

      if (dist[next] > d + 1) {
        dist[next] = d + 1;
        pq.push({ node: next, d: dist[next] });
      }
    }
  }
  return -1;
}

export function buildChoices(correct) {
  const s = new Set([correct]);
  const min = Math.max(1, correct - 3);
  const max = correct + 3;

  while (s.size < 3) s.add(randInt(min, max));

  const arr = Array.from(s);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function outcomeFor(choice, correct) {
  if (choice === correct) return "win";
  if (Math.abs(choice - correct) === 1) return "draw";
  return "lose";
}

export function generateSolvableRound(N, maxTries = 1000) {
  for (let i = 0; i < maxTries; i++) {
    const { board, ladders, snakes } = generateBoard(N);
    const bfs = bfsMinThrows(board, N);
    const dij = dijkstraMinThrows(board, N);
    if (bfs !== -1 && bfs === dij) {
      return { board, ladders, snakes, answer: bfs };
    }
  }
  throw new Error("Failed to generate a solvable board");
}

function randInt(a, bInclusive) {
  return Math.floor(Math.random() * (bInclusive - a + 1)) + a;
}
