export const CITIES = ["A","B","C","D","E","F","G","H","I","J"];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateDistanceMatrix() {
  const n = CITIES.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = randInt(50, 100);
      matrix[i][j] = d;
      matrix[j][i] = d;
    }
  }
  return matrix;
}

export function cityIndex(city) {
  return CITIES.indexOf(city);
}

export function nearestNeighbourTsp(distanceMatrix, homeIndex, targetIndices) {
  const unvisited = new Set(targetIndices);
  let route = [homeIndex];
  let total = 0;
  let current = homeIndex;

  while (unvisited.size > 0) {
    let bestNext = null;
    let bestDist = Infinity;

    for (const idx of unvisited) {
      const d = distanceMatrix[current][idx];
      if (d < bestDist) {
        bestDist = d;
        bestNext = idx;
      }
    }

    total += bestDist;
    current = bestNext;
    route.push(current);
    unvisited.delete(current);
  }

  total += distanceMatrix[current][homeIndex];
  route.push(homeIndex);

  return { distance: total, route };
}

export function bruteForceTsp(distanceMatrix, homeIndex, targetIndices) {
  let bestDist = Infinity;
  let bestRoute = null;

  function permute(prefix, remaining) {
    if (remaining.length === 0) {
      let total = 0;
      let prev = homeIndex;
      for (const idx of prefix) {
        total += distanceMatrix[prev][idx];
        prev = idx;
      }
      total += distanceMatrix[prev][homeIndex];

      if (total < bestDist) {
        bestDist = total;
        bestRoute = [homeIndex, ...prefix, homeIndex];
      }
      return;
    }

    for (let i = 0; i < remaining.length; i++) {
      const next = remaining[i];
      const rest = remaining.slice(0, i).concat(remaining.slice(i + 1));
      permute([...prefix, next], rest);
    }
  }

  permute([], targetIndices);
  return { distance: bestDist, route: bestRoute };
}

export function heldKarpTsp(distanceMatrix, homeIndex, targetIndices) {
  const k = targetIndices.length;
  if (k === 0) {
    return { distance: 0 };
  }

  const t = targetIndices.slice(); 
  const FULL = 1 << k;
  const dp = Array.from({ length: FULL }, () => Array(k).fill(Infinity));

  for (let i = 0; i < k; i++) {
    const mask = 1 << i;
    dp[mask][i] = distanceMatrix[homeIndex][t[i]];
  }

  for (let mask = 1; mask < FULL; mask++) {
    for (let i = 0; i < k; i++) {
      if (!(mask & (1 << i))) continue;
      const prevMask = mask ^ (1 << i);
      if (prevMask === 0) continue;

      for (let j = 0; j < k; j++) {
        if (!(prevMask & (1 << j))) continue;
        const cand = dp[prevMask][j] + distanceMatrix[t[j]][t[i]];
        if (cand < dp[mask][i]) {
          dp[mask][i] = cand;
        }
      }
    }
  }

  let best = Infinity;
  for (let i = 0; i < k; i++) {
    const cost = dp[FULL - 1][i] + distanceMatrix[t[i]][homeIndex];
    if (cost < best) best = cost;
  }

  return { distance: best };
}

export function buildChoicesTsp(correctDistance) {
  const s = new Set([correctDistance]);
  const min = Math.max(50, correctDistance - 40);
  const max = correctDistance + 40;

  while (s.size < 3) {
    const cand = randInt(min, max);
    s.add(cand);
  }

  return Array.from(s).sort(() => Math.random() - 0.5);
}

export function outcomeForTsp(choice, correctDistance) {
  if (choice === correctDistance) return "win";
  if (Math.abs(choice - correctDistance) <= 10) return "draw";
  return "lose";
}

export function routeToCities(routeIndices) {
  return routeIndices.map(i => CITIES[i]);
}
