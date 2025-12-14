import {
  generateTrafficGraph,
  edmondsKarpMaxFlow,
  dinicMaxFlow,
  buildChoices,
  outcomeFor,
} from "../logic/trafficSimulation.js";

describe("Traffic Simulation logic", () => {
  test("generateTrafficGraph creates 13 directed roads with capacity 5..15", () => {
    const { edges } = generateTrafficGraph();
    expect(edges).toHaveLength(13);
    for (const e of edges) {
      expect(e.capacity).toBeGreaterThanOrEqual(5);
      expect(e.capacity).toBeLessThanOrEqual(15);
    }
  });

  test("Edmonds-Karp and Dinic return the same max flow for the same graph", () => {
    const { graph } = generateTrafficGraph();
    const ek = edmondsKarpMaxFlow(graph, "A", "T");
    const dn = dinicMaxFlow(graph, "A", "T");
    expect(ek).toBe(dn);
  });

  test("buildChoices returns 3 options including correct", () => {
    const correct = 20;
    const choices = buildChoices(correct);
    expect(choices).toHaveLength(3);
    expect(choices).toContain(correct);
  });

  test("outcomeFor uses win/draw/lose rules (draw within 2)", () => {
    expect(outcomeFor(10, 10)).toBe("win");
    expect(outcomeFor(9, 10)).toBe("draw");
    expect(outcomeFor(12, 10)).toBe("draw");
    expect(outcomeFor(7, 10)).toBe("lose");
  });

  test("generateTrafficGraph(existingEdges,false) preserves capacities", () => {
    const base = generateTrafficGraph();
    const savedEdges = base.edges.map((e) => ({ ...e }));

    const rebuilt = generateTrafficGraph(savedEdges, false);
    for (let i = 0; i < savedEdges.length; i++) {
      expect(rebuilt.edges[i].capacity).toBe(savedEdges[i].capacity);
    }
  });
});
