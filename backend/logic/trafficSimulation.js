export function generateTrafficGraph(existingEdges = null, randomize = true) {
  const nodes = ["A","B","C","D","E","F","G","H","T"];
  const roads = [
    ["A","B"],["A","C"],["A","D"],
    ["B","E"],["B","F"],
    ["C","E"],["C","F"],
    ["D","F"],
    ["E","G"],["E","H"],
    ["F","H"],
    ["G","T"],["H","T"]
  ];

  const edges = existingEdges || roads.map(([u, v]) => ({
    from: u,
    to: v,
    capacity: randomize ? randInt(5, 15) : 0,
  }));

  const graph = {};
  for (const n of nodes) graph[n] = [];

  for (const e of edges) {
    if (randomize) e.capacity = randInt(5, 15);
    graph[e.from].push({ to: e.to, cap: e.capacity });
  }

  return { graph, edges };
}

export function edmondsKarpMaxFlow(graph, s, t) {
  const resGraph = JSON.parse(JSON.stringify(graph));
  const parent = {};

  function bfs() {
    const visited = new Set();
    const q = [s];
    visited.add(s);
    parent[s] = null;

    while (q.length) {
      const u = q.shift();
      for (const edge of resGraph[u]) {
        if (!visited.has(edge.to) && edge.cap > 0) {
          parent[edge.to] = u;
          visited.add(edge.to);
          if (edge.to === t) return true;
          q.push(edge.to);
        }
      }
    }
    return false;
  }

  let maxFlow = 0;

  while (bfs()) {
    let pathFlow = Infinity;

    for (let v = t; v !== s; v = parent[v]) {
      const u = parent[v];
      const e = resGraph[u].find(x => x.to === v);
      pathFlow = Math.min(pathFlow, e.cap);
    }

    for (let v = t; v !== s; v = parent[v]) {
      const u = parent[v];
      const e = resGraph[u].find(x => x.to === v);
      e.cap -= pathFlow;
      const rev = resGraph[v].find(x => x.to === u);
      if (rev) rev.cap += pathFlow;
      else resGraph[v].push({ to: u, cap: pathFlow });
    }

    maxFlow += pathFlow;
  }

  return maxFlow;
}

export function dinicMaxFlow(graph, s, t) {
  const res = JSON.parse(JSON.stringify(graph));
  let level = {};

  function bfs() {
    level = {};
    const q = [s];
    level[s] = 0;

    while (q.length) {
      const u = q.shift();
      for (const e of res[u]) {
        if (e.cap > 0 && level[e.to] === undefined) {
          level[e.to] = level[u] + 1;
          q.push(e.to);
        }
      }
    }
    return level[t] !== undefined;
  }

  function sendFlow(u, flow, t) {
    if (u === t) return flow;

    for (const e of res[u]) {
      if (e.cap > 0 && level[e.to] === level[u] + 1) {
        const curr = Math.min(flow, e.cap);
        const pushed = sendFlow(e.to, curr, t);
        if (pushed > 0) {
          e.cap -= pushed;
          const rev = res[e.to].find(x => x.to === u);
          if (rev) rev.cap += pushed;
          else res[e.to].push({ to: u, cap: pushed });
          return pushed;
        }
      }
    }
    return 0;
  }

  let total = 0;

  while (bfs()) {
    let flow;
    do {
      flow = sendFlow(s, Infinity, t);
      if (flow > 0) total += flow;
    } while (flow > 0);
  }

  return total;
}

export function buildChoices(correct, range = 30) {
  const s = new Set([correct]);
  const min = Math.max(1, correct - 5);
  const max = correct + 5;
  while (s.size < 3) s.add(randInt(min, max));
  return Array.from(s).sort(() => Math.random() - 0.5);
}

export function outcomeFor(choice, correct) {
  if (choice === correct) return "win";
  if (Math.abs(choice - correct) <= 2) return "draw";
  return "lose";
}

function randInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}
