import type { LevelType } from "../../levels/levelConfig.ts";
import { getLevelStatus, progressCount } from "../../levels/progression.ts";
import type { LevelStatus } from "../../levels/progression.ts";
import type { AdventureMapData } from "./AdventureMapScreenModel.ts";

// Everything here is plain numbers and strings (no Konva), so it can be unit tested.
// The View only draws what these functions return.

export interface Point { x: number; y: number }

/** The rounded panel the map is drawn on. */
export const MAP_PANEL = { x: 30, y: 160, width: 740, height: 348 };

export const NODE_RADIUS = 28;
/** Nodes zigzag between these two heights (low, high, low, ...) and the path eases between them. */
const NODE_LOW_Y = MAP_PANEL.y + 275;
const NODE_HIGH_Y = MAP_PANEL.y + 155;
/** Distance from the panel's side edges to the first and last node. */
const NODE_SIDE_MARGIN = 100;

// Info card above each node
export const CARD_PADDING = 9;
export const CARD_HEADER_HEIGHT = 15;
export const CARD_LINE_HEIGHT = 16;
/** Space between the card's bottom and whatever sits right below it (the node or the badge). */
export const CARD_GAP = 8;
/** Width reserved left of every operand for its "+", "−", "×" or "÷", so the digits line up. */
export const CARD_OPERATOR_WIDTH = 16;

// "YOU ARE HERE" badge between the card and the current node
export const BADGE_HEIGHT = 18;
export const BADGE_GAP = 4;

export const PROGRESS_TEXT = { x: MAP_PANEL.x + 20, y: MAP_PANEL.y + MAP_PANEL.height - 28 };
/** Static for now; clicking it is a later task. */
export const START_BUTTON = { x: 580, y: 528, width: 190, height: 50 };

const OPERATOR_SYMBOLS: Record<LevelType, string> = {
  addition: "+",
  subtraction: "−",
  multiplication: "×",
  division: "÷",
};

export function getOperatorSymbol(type: LevelType): string {
  return OPERATOR_SYMBOLS[type];
}

/** One operand of a level, e.g. { operator: "+", text: "5-digit" }; the first line has no operator. */
export interface OperandLine { operator: string; text: string }

/** Builds the card's operand lines straight from the digit counts in the level config. */
export function getOperandLines(type: LevelType, operandDigits: readonly number[]): OperandLine[] {
  return operandDigits.map((digits, index) => ({
    operator: index === 0 ? "" : getOperatorSymbol(type),
    text: `${digits}-digit`,
  }));
}

/** Tall enough for the title and exactly this many operand lines, with no blank space left over. */
export function getCardHeight(lineCount: number): number {
  return CARD_PADDING + CARD_HEADER_HEIGHT + lineCount * CARD_LINE_HEIGHT + CARD_PADDING;
}

/** Centers of the nodes, evenly spread across the panel and alternating low/high. */
export function getNodePositions(count: number): Point[] {
  const left = MAP_PANEL.x + NODE_SIDE_MARGIN;
  const right = MAP_PANEL.x + MAP_PANEL.width - NODE_SIDE_MARGIN;
  return Array.from({ length: count }, (_, index) => ({
    x: count === 1 ? (left + right) / 2 : left + (index * (right - left)) / (count - 1),
    y: index % 2 === 0 ? NODE_LOW_Y : NODE_HIGH_Y,
  }));
}

/**
 * Points of the wavy path through the nodes, as a flat [x1, y1, x2, y2, ...] list for Konva.
 * Between two nodes the height eases like a cosine, so the wave is flat at every node.
 */
export function getWavePoints(nodes: readonly Point[], stepsPerSegment = 16): number[] {
  if (nodes.length < 2) return [];
  const points: number[] = [];
  for (let segment = 0; segment < nodes.length - 1; segment++) {
    const from = nodes[segment];
    const to = nodes[segment + 1];
    for (let step = 0; step < stepsPerSegment; step++) {
      const t = step / stepsPerSegment;
      points.push(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * (1 - Math.cos(Math.PI * t)) / 2);
    }
  }
  const last = nodes[nodes.length - 1];
  points.push(last.x, last.y);
  return points;
}

/** Everything the View needs to draw one level. */
export interface LevelLayout {
  difficulty: number;
  status: LevelStatus;
  center: Point;
  card: { top: number; height: number; lines: OperandLine[] };
  /** Top of the "YOU ARE HERE" badge; null for every level except the current one. */
  badgeTop: number | null;
}

export function getMapLayout(data: AdventureMapData): LevelLayout[] {
  const centers = getNodePositions(data.difficulties.length);
  return data.difficulties.map((stage, index) => {
    const status = getLevelStatus(data.progression, stage.difficulty);
    const center = centers[index];
    const lines = getOperandLines(data.level.type, stage.operandDigits);
    const circleTop = center.y - NODE_RADIUS;
    // The current level's card moves up to make room for the badge
    const badgeTop = status === "current" ? circleTop - BADGE_GAP - BADGE_HEIGHT : null;
    const height = getCardHeight(lines.length);
    return {
      difficulty: stage.difficulty,
      status,
      center,
      card: { top: (badgeTop ?? circleTop) - CARD_GAP - height, height, lines },
      badgeTop,
    };
  });
}

/** The map's text labels, worked out from the progress data. */
export function getMapLabels(data: AdventureMapData): { progress: string; start: string } {
  const { completed, total } = progressCount(data.level, data.progression);
  return {
    progress: `${completed} / ${total} levels complete`,
    start: `Start level ${data.progression.currentDifficulty}`,
  };
}
