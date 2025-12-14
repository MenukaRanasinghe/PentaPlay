import {
  CITIES,
  generateDistanceMatrix,
  cityIndex,
  nearestNeighbourTsp,
  bruteForceTsp,
  heldKarpTsp,
  buildChoicesTsp,
  outcomeForTsp,
  routeToCities,
} from "../logic/travellingSalesman.js";

describe("Travelling Salesman Problem logic", () => {

  test("generateDistanceMatrix creates symmetric matrix with values 50–100", () => {
    const matrix = generateDistanceMatrix();

    expect(matrix.length).toBe(CITIES.length);

    for (let i = 0; i < CITIES.length; i++) {
      for (let j = 0; j < CITIES.length; j++) {
        if (i === j) {
          expect(matrix[i][j]).toBe(0);
        } else {
          expect(matrix[i][j]).toBeGreaterThanOrEqual(50);
          expect(matrix[i][j]).toBeLessThanOrEqual(100);
          expect(matrix[i][j]).toBe(matrix[j][i]); // symmetry
        }
      }
    }
  });

  test("cityIndex returns correct index for each city", () => {
    CITIES.forEach((city, idx) => {
      expect(cityIndex(city)).toBe(idx);
    });
  });

  test("buildChoicesTsp returns 3 choices including the correct distance", () => {
    const correct = 250;
    const choices = buildChoicesTsp(correct);

    expect(choices).toHaveLength(3);
    expect(choices).toContain(correct);
  });

  test("outcomeForTsp win / draw / lose logic", () => {
    expect(outcomeForTsp(300, 300)).toBe("win");
    expect(outcomeForTsp(295, 300)).toBe("draw");
    expect(outcomeForTsp(308, 300)).toBe("draw");
    expect(outcomeForTsp(260, 300)).toBe("lose");
  });

  test("brute force returns optimal route starting and ending at home", () => {
    const matrix = generateDistanceMatrix();
    const homeIndex = 0; // City A
    const targets = [1, 2, 3]; // B, C, D

    const result = bruteForceTsp(matrix, homeIndex, targets);

    expect(result.distance).toBeGreaterThan(0);
    expect(result.route[0]).toBe(homeIndex);
    expect(result.route[result.route.length - 1]).toBe(homeIndex);
    expect(result.route.length).toBe(targets.length + 2);
  });

  test("Held–Karp and Brute Force return same optimal distance", () => {
    const matrix = generateDistanceMatrix();
    const homeIndex = 0;
    const targets = [1, 2, 3, 4]; // small set for exact match

    const bf = bruteForceTsp(matrix, homeIndex, targets);
    const hk = heldKarpTsp(matrix, homeIndex, targets);

    expect(hk.distance).toBe(bf.distance);
  });

  test("Nearest Neighbour returns a valid tour (not necessarily optimal)", () => {
    const matrix = generateDistanceMatrix();
    const homeIndex = 0;
    const targets = [1, 2, 3, 4];

    const nn = nearestNeighbourTsp(matrix, homeIndex, targets);

    expect(nn.distance).toBeGreaterThan(0);
    expect(nn.route[0]).toBe(homeIndex);
    expect(nn.route[nn.route.length - 1]).toBe(homeIndex);
  });

  test("routeToCities converts route indices to city labels", () => {
    const route = [0, 2, 4, 0];
    const cities = routeToCities(route);

    expect(cities).toEqual(["A", "C", "E", "A"]);
  });

});
