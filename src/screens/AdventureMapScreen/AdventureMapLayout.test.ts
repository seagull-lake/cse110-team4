import { describe, expect, it } from "vitest";
import { getLevelDefinition, problemDifficultyConfig } from "../../levels/levelConfig.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import {
  BADGE_GAP, BADGE_HEIGHT, CARD_GAP, CARD_HEADER_HEIGHT, CARD_LINE_HEIGHT, CARD_PADDING,
  MAP_PANEL, NODE_RADIUS, getCardHeight, getMapLabels, getMapLayout, getNodePositions,
  getOperandLines, getOperatorSymbol, getWavePoints,
} from "./AdventureMapLayout.ts";
import { AdventureMapScreenModel } from "./AdventureMapScreenModel.ts";
import type { AdventureMapData } from "./AdventureMapScreenModel.ts";

const topics: readonly LevelType[] = ["addition", "subtraction", "multiplication", "division"];
const panelBottom = MAP_PANEL.y + MAP_PANEL.height;

function mapData(topic: LevelType, currentDifficulty = 1, isCompleted = false): AdventureMapData {
  const level = getLevelDefinition(topic);
  return new AdventureMapScreenModel(level, {
    levelId: level.id, currentDifficulty, isActive: false, isCompleted,
  }).getMapData();
}

/** Every state a topic can be saved in: on level 1..5, and finished. */
const savedStates = [
  ...[1, 2, 3, 4, 5].map(difficulty => ({ difficulty, completed: false })),
  { difficulty: 5, completed: true },
];

describe("node positions", () => {
  it("gives no positions for no levels and centers a single level", () => {
    expect(getNodePositions(0)).toEqual([]);
    const [only] = getNodePositions(1);
    expect(only.x).toBe(MAP_PANEL.x + MAP_PANEL.width / 2);
  });

  it("spreads five nodes evenly from left to right inside the panel", () => {
    const nodes = getNodePositions(5);
    expect(nodes).toHaveLength(5);
    const gaps = nodes.slice(1).map((node, index) => node.x - nodes[index].x);
    expect(gaps.every(gap => gap > 0)).toBe(true);
    expect(new Set(gaps).size).toBe(1);
    for (const node of nodes) {
      expect(node.x - NODE_RADIUS).toBeGreaterThan(MAP_PANEL.x);
      expect(node.x + NODE_RADIUS).toBeLessThan(MAP_PANEL.x + MAP_PANEL.width);
      expect(node.y - NODE_RADIUS).toBeGreaterThan(MAP_PANEL.y);
      expect(node.y + NODE_RADIUS).toBeLessThan(panelBottom);
    }
  });

  it("zigzags: low, high, low, high, low", () => {
    const nodes = getNodePositions(5);
    expect(nodes[0].y).toBeGreaterThan(nodes[1].y);
    expect(nodes[1].y).toBeLessThan(nodes[2].y);
    expect(nodes[0].y).toBe(nodes[2].y);
    expect(nodes[2].y).toBe(nodes[4].y);
    expect(nodes[1].y).toBe(nodes[3].y);
  });

  it.each([2, 3, 6, 10])("handles %i levels", count => {
    const nodes = getNodePositions(count);
    expect(nodes).toHaveLength(count);
    expect(nodes.every((node, index) => index === 0 || node.x > nodes[index - 1].x)).toBe(true);
  });
});

describe("wave path", () => {
  const nodes = getNodePositions(5);
  const steps = 16;
  const wave = getWavePoints(nodes, steps);
  const at = (pointIndex: number) => ({ x: wave[pointIndex * 2], y: wave[pointIndex * 2 + 1] });

  it("needs at least two nodes", () => {
    expect(getWavePoints([])).toEqual([]);
    expect(getWavePoints(nodes.slice(0, 1))).toEqual([]);
  });

  it("is a flat list of x, y pairs", () => {
    expect(wave).toHaveLength(((nodes.length - 1) * steps + 1) * 2);
    expect(wave.every(Number.isFinite)).toBe(true);
  });

  it("starts at the first node, ends at the last and passes through every node", () => {
    nodes.forEach((node, index) => expect(at(index * steps)).toEqual(node));
  });

  it("moves left to right and never goes above or below the nodes", () => {
    const ys = nodes.map(node => node.y);
    for (let index = 0; index < wave.length / 2; index++) {
      const point = at(index);
      if (index > 0) expect(point.x).toBeGreaterThanOrEqual(at(index - 1).x);
      expect(point.y).toBeGreaterThanOrEqual(Math.min(...ys));
      expect(point.y).toBeLessThanOrEqual(Math.max(...ys));
    }
  });

  it("is smooth and flat at each node, like a wave", () => {
    const amplitude = Math.abs(nodes[0].y - nodes[1].y);
    for (let index = 0; index < nodes.length; index++) {
      const here = at(index * steps);
      const neighbours = [index * steps - 1, index * steps + 1]
        .filter(point => point >= 0 && point < wave.length / 2).map(at);
      for (const neighbour of neighbours) {
        expect(Math.abs(neighbour.y - here.y)).toBeLessThan(amplitude * 0.02);
      }
    }
  });

  it("rises or falls steadily between two nodes", () => {
    for (let segment = 0; segment < nodes.length - 1; segment++) {
      const direction = Math.sign(nodes[segment + 1].y - nodes[segment].y);
      for (let step = 1; step <= steps; step++) {
        const change = at(segment * steps + step).y - at(segment * steps + step - 1).y;
        expect(Math.sign(change)).toBe(direction);
      }
    }
  });
});

describe("card text", () => {
  it("uses one symbol per topic", () => {
    expect(topics.map(getOperatorSymbol)).toEqual(["+", "−", "×", "÷"]);
  });

  it("puts one operand per line, with the operator on every line but the first", () => {
    expect(getOperandLines("addition", [5, 5, 5])).toEqual([
      { operator: "", text: "5-digit" },
      { operator: "+", text: "5-digit" },
      { operator: "+", text: "5-digit" },
    ]);
    expect(getOperandLines("division", [4, 2])).toEqual([
      { operator: "", text: "4-digit" },
      { operator: "÷", text: "2-digit" },
    ]);
    expect(getOperandLines("subtraction", [5, 4, 4]).map(line => line.operator)).toEqual(["", "−", "−"]);
    expect(getOperandLines("multiplication", [3, 2]).map(line => line.text)).toEqual(["3-digit", "2-digit"]);
  });

  it("describes every level in the config", () => {
    for (const topic of topics) {
      const { difficulties } = mapData(topic);
      expect(difficulties).toHaveLength(5);
      for (const stage of difficulties) {
        const lines = getOperandLines(topic, stage.operandDigits);
        expect(lines.map(line => line.text)).toEqual(stage.operandDigits.map(digits => `${digits}-digit`));
        expect(lines[0].operator).toBe("");
        expect(lines.slice(1).every(line => line.operator === getOperatorSymbol(topic))).toBe(true);
        expect(lines.length).toBeLessThanOrEqual(3);
      }
    }
  });

  it("changes when the config changes", () => {
    const original = problemDifficultyConfig.mainGame.addition[2];
    try {
      problemDifficultyConfig.mainGame.addition[2] = [7, 2, 4];
      const card = getMapLayout(mapData("addition"))[1].card;
      expect(card.lines).toEqual([
        { operator: "", text: "7-digit" },
        { operator: "+", text: "2-digit" },
        { operator: "+", text: "4-digit" },
      ]);
      expect(card.height).toBe(getCardHeight(3));
    } finally {
      problemDifficultyConfig.mainGame.addition[2] = original;
    }
    expect(getMapLayout(mapData("addition"))[1].card.lines).toHaveLength(2);
  });
});

describe("card height", () => {
  it("fits the title and exactly the operand lines, with no blank space", () => {
    for (const lineCount of [1, 2, 3]) {
      const lastLineBottom = CARD_PADDING + CARD_HEADER_HEIGHT + lineCount * CARD_LINE_HEIGHT;
      expect(getCardHeight(lineCount)).toBe(lastLineBottom + CARD_PADDING);
    }
  });

  it("is shorter with two operands than with three", () => {
    expect(getCardHeight(2)).toBe(getCardHeight(3) - CARD_LINE_HEIGHT);
  });

  it("matches each level's operand count on the map", () => {
    for (const topic of topics) {
      for (const level of getMapLayout(mapData(topic))) {
        expect(level.card.height).toBe(getCardHeight(level.card.lines.length));
      }
    }
    const addition = getMapLayout(mapData("addition"));
    expect(addition[2].card.height).toBeLessThan(addition[3].card.height); // 2 operands vs 3
  });
});

describe("map layout", () => {
  it.each(topics)("lays out all five %s levels for every saved state", topic => {
    for (const { difficulty, completed } of savedStates) {
      const levels = getMapLayout(mapData(topic, difficulty, completed));
      expect(levels.map(level => level.difficulty)).toEqual([1, 2, 3, 4, 5]);

      const statuses = levels.map(level => level.status);
      if (completed) {
        expect(statuses).toEqual(Array(5).fill("completed"));
      } else {
        expect(statuses.filter(status => status === "completed")).toHaveLength(difficulty - 1);
        expect(statuses[difficulty - 1]).toBe("current");
        expect(statuses.filter(status => status === "locked")).toHaveLength(5 - difficulty);
      }
    }
  });

  it.each(topics)("keeps every %s card inside the panel and clear of its neighbours", topic => {
    for (const { difficulty, completed } of savedStates) {
      const levels = getMapLayout(mapData(topic, difficulty, completed));
      levels.forEach((level, index) => {
        expect(level.card.top).toBeGreaterThanOrEqual(MAP_PANEL.y);
        expect(level.card.top + level.card.height).toBeLessThan(level.center.y - NODE_RADIUS);
        expect(level.center.y + NODE_RADIUS).toBeLessThanOrEqual(panelBottom);
        if (index > 0) {
          const previous = levels[index - 1];
          const apart = level.card.top >= previous.card.top + previous.card.height ||
            previous.card.top >= level.card.top + level.card.height;
          expect(apart).toBe(true);
        }
      });
    }
  });

  it("puts the 'you are here' badge on the current level only", () => {
    for (const { difficulty, completed } of savedStates) {
      const levels = getMapLayout(mapData("addition", difficulty, completed));
      const badged = levels.filter(level => level.badgeTop !== null);
      expect(badged).toHaveLength(completed ? 0 : 1);
      if (!completed) expect(badged[0].status).toBe("current");
    }
  });

  it("stacks card, badge and node without overlap on the current level", () => {
    const current = getMapLayout(mapData("addition", 4))[3];
    const circleTop = current.center.y - NODE_RADIUS;
    expect(current.badgeTop).toBe(circleTop - BADGE_GAP - BADGE_HEIGHT);
    expect(current.card.top + current.card.height + CARD_GAP).toBe(current.badgeTop);
  });

  it("puts the card right above the node on other levels", () => {
    for (const level of getMapLayout(mapData("addition", 4)).filter(level => level.status !== "current")) {
      expect(level.card.top + level.card.height + CARD_GAP).toBe(level.center.y - NODE_RADIUS);
    }
  });

  it("draws extra levels added to the config without any other change", () => {
    const sixLevels: AdventureMapData = {
      level: { id: "addition", type: "addition", maxDifficulty: 6 },
      progression: { levelId: "addition", currentDifficulty: 3, isActive: false, isCompleted: false },
      difficulties: [1, 2, 3, 4, 5, 6].map(difficulty => ({ difficulty, operandDigits: [difficulty, difficulty] })),
    };
    const levels = getMapLayout(sixLevels);
    expect(levels).toHaveLength(6);
    expect(levels.map(level => level.status))
      .toEqual(["completed", "completed", "current", "locked", "locked", "locked"]);
    expect(levels.every(level => level.card.top >= MAP_PANEL.y)).toBe(true);
    expect(getMapLabels(sixLevels).progress).toBe("2 / 6 levels complete");

    const threeLevels = getMapLayout({
      ...sixLevels,
      level: { ...sixLevels.level, maxDifficulty: 3 },
      difficulties: sixLevels.difficulties.slice(0, 3),
    });
    expect(threeLevels).toHaveLength(3);
  });
});

describe("map labels", () => {
  it.each(topics)("counts finished levels and names the level to start for %s", topic => {
    expect(getMapLabels(mapData(topic))).toMatchObject({ progress: "0 / 5 levels complete", start: "Start level 1" });
    expect(getMapLabels(mapData(topic, 4))).toMatchObject({ progress: "3 / 5 levels complete", start: "Start level 4" });
    expect(getMapLabels(mapData(topic, 5))).toMatchObject({ progress: "4 / 5 levels complete", start: "Start level 5" });
    expect(getMapLabels(mapData(topic, 5, true)))
      .toMatchObject({ progress: "5 / 5 levels complete", start: "Start level 5" });
  });

  it("has only the progress count and the Start button text", () => {
    expect(Object.keys(getMapLabels(mapData("addition"))).sort()).toEqual(["progress", "start"]);
  });
});
