import Konva from "konva";
import type { View } from "../../types.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import { STAGE_WIDTH, FONT_FAMILY, TITLE_COLOR } from "../../constants.ts";
import { createHomeButton } from "../../components/HomeButton.ts";
import type { AdventureMapData } from "./AdventureMapScreenModel.ts";
import {
  BADGE_HEIGHT, CARD_HEADER_HEIGHT, CARD_LINE_HEIGHT, CARD_OPERATOR_WIDTH, CARD_PADDING,
  MAP_PANEL, NODE_RADIUS, PROGRESS_TEXT, START_BUTTON,
  getMapLabels, getMapLayout, getWavePoints,
} from "./AdventureMapLayout.ts";
import type { LevelLayout } from "./AdventureMapLayout.ts";

// Constants
const FONT = FONT_FAMILY;
const COLORS = {
  panel: "#F4E8CB",
  path: "#10B981",
  progressText: "#717171",
  cardFill: "#FFFFFF",
  cardStroke: "#E5E7EB",
  cardLevel: "#27695B",
  cardDescription: "#202020",
  completedFill: "#27695B",
  completedStroke: "#000000",
  completedCheck: "#FFFCF4",
  currentFill: "#FFE69B",
  currentStroke: "#202020",
  currentText: "#000000",
  lockedFill: "#FFFFFF",
  lockedStroke: "#000000",
  lockedText: "#717171",
  hereFill: "#FFE69B",
  hereText: "#000000",
  startFill: "#FFE8AD",
  startOutline: TITLE_COLOR,
  startText: TITLE_COLOR,
};

/** Calls the handler on click and shows a pointer cursor while hovering (if clickable). */
function onClick(shape: Konva.Group, handler: () => void, showPointer: boolean): void {
  const setCursor = (cursor: string) => { document.body.style.cursor = cursor; };
  shape.on("click tap", () => { setCursor("default"); handler(); });
  if (!showPointer) return;
  shape.on("mouseenter", () => setCursor("pointer"));
  shape.on("mouseleave", () => setCursor("default"));
}

/** Draws the topic's map from the data it is given; where things go is decided in AdventureMapLayout. */
export class AdventureMapScreenView implements View {
  private readonly group = new Konva.Group({ visible: false });
  private readonly title: Konva.Text;
  // Everything on the map except the title and Home button; rebuilt whenever the data changes
  private readonly mapGroup = new Konva.Group();
  private data: AdventureMapData | null = null;
  private readonly onLevelClick: (difficulty: number) => void;
  private readonly onStartClick: () => void;

  /** Clicks are only reported; the controller decides whether a level can be opened. */
  constructor(onHomeClick: () => void, onLevelClick: (difficulty: number) => void, onStartClick: () => void) {
    this.onLevelClick = onLevelClick;
    this.onStartClick = onStartClick;
    this.title = new Konva.Text({
      x: 0, y: 90, width: STAGE_WIDTH, align: "center", text: "",
      fontSize: 50, fontFamily: FONT, fill: TITLE_COLOR,
    });
    this.group.add(this.title);
    this.group.add(this.mapGroup);

    // Shared Home button, same as every other screen
    this.group.add(createHomeButton(onHomeClick));

    // Card sizes are measured from the text, so rebuild once the web font has loaded
    document.fonts.load(`20px ${FONT}`).then(() => this.redraw()).catch(() => {});
  }

  setTopic(topic: LevelType, data: AdventureMapData): void {
    this.title.text(`${topic[0].toUpperCase()}${topic.slice(1)} Adventure`);
    this.data = data;
    this.render();
  }

  private redraw(): void {
    this.render();
    this.group.getLayer()?.draw();
  }

  private render(): void {
    this.mapGroup.destroyChildren();
    if (!this.data) return;
    const labels = getMapLabels(this.data);
    const levels = getMapLayout(this.data);

    this.mapGroup.add(new Konva.Rect({
      x: MAP_PANEL.x, y: MAP_PANEL.y, width: MAP_PANEL.width, height: MAP_PANEL.height,
      fill: COLORS.panel, cornerRadius: 20,
    }));
    this.mapGroup.add(new Konva.Line({
      points: getWavePoints(levels.map(level => level.center)),
      stroke: COLORS.path, strokeWidth: 4, dash: [0.1, 10], lineCap: "round", lineJoin: "round",
    }));
    this.mapGroup.add(new Konva.Text({
      x: PROGRESS_TEXT.x, y: PROGRESS_TEXT.y, text: labels.progress,
      fontSize: 14, fontFamily: FONT, fill: COLORS.progressText,
    }));

    // Nodes first, then cards and badges on top
    levels.forEach(level => this.mapGroup.add(this.makeNode(level)));
    levels.forEach(level => {
      this.mapGroup.add(this.makeCard(level));
      if (level.badgeTop !== null) this.mapGroup.add(this.makeBadge(level));
    });

    this.addStartButton(labels.start);
  }

  private makeNode(level: LevelLayout): Konva.Group {
    const { x, y } = level.center;
    const node = new Konva.Group({ x, y });
    const style = {
      completed: { fill: COLORS.completedFill, stroke: COLORS.completedStroke },
      current: { fill: COLORS.currentFill, stroke: COLORS.currentStroke },
      locked: { fill: COLORS.lockedFill, stroke: COLORS.lockedStroke },
    }[level.status];
    node.add(new Konva.Circle({
      radius: NODE_RADIUS, fill: style.fill, stroke: style.stroke,
      strokeWidth: level.status === "current" ? 2.5 : 1.5,
    }));

    if (level.status === "completed") {
      node.add(new Konva.Line({
        points: [-10, 1, -3, 8, 10, -7], stroke: COLORS.completedCheck,
        strokeWidth: 4, lineCap: "round", lineJoin: "round",
      }));
    } else {
      node.add(new Konva.Text({
        x: -NODE_RADIUS, y: -NODE_RADIUS, width: NODE_RADIUS * 2, height: NODE_RADIUS * 2,
        align: "center", verticalAlign: "middle", text: String(level.difficulty),
        fontSize: 24, fontFamily: FONT,
        fill: level.status === "current" ? COLORS.currentText : COLORS.lockedText,
      }));
    }
    // Only unlocked levels get the pointer cursor; every click is still reported to the controller
    onClick(node, () => this.onLevelClick(level.difficulty), level.status !== "locked");
    return node;
  }

  /**
   * The card is as wide as its content. The operators sit in their own narrow column so the
   * digit text lines up on every line (the first operand has no operator), and that whole
   * block is centered in the card.
   */
  private makeCard(level: LevelLayout): Konva.Group {
    const text = (value: string, fontSize: number, fill: string) =>
      new Konva.Text({ text: value, fontSize, fontFamily: FONT, fill });

    const header = text(`Level ${level.difficulty}`, 11, COLORS.cardLevel);
    const operands = level.card.lines.map(line => text(line.text, 13, COLORS.cardDescription));
    const operators = level.card.lines.map(line => text(line.operator, 13, COLORS.cardDescription));

    const blockWidth = CARD_OPERATOR_WIDTH + Math.max(0, ...operands.map(operand => operand.width()));
    const width = Math.max(blockWidth, header.width()) + CARD_PADDING * 2;
    const blockLeft = (width - blockWidth) / 2;

    const card = new Konva.Group({ x: level.center.x - width / 2, y: level.card.top });
    card.add(new Konva.Rect({
      width, height: level.card.height, fill: COLORS.cardFill,
      stroke: COLORS.cardStroke, strokeWidth: 1, cornerRadius: 8,
    }));
    header.position({ x: blockLeft, y: CARD_PADDING });
    card.add(header);
    level.card.lines.forEach((_, index) => {
      const y = CARD_PADDING + CARD_HEADER_HEIGHT + index * CARD_LINE_HEIGHT;
      operators[index].position({ x: blockLeft, y });
      operands[index].position({ x: blockLeft + CARD_OPERATOR_WIDTH, y });
      card.add(operators[index], operands[index]);
    });
    return card;
  }

  private makeBadge(level: LevelLayout): Konva.Group {
    const label = new Konva.Text({
      text: "YOU ARE HERE", fontSize: 10, fontStyle: "bold", fontFamily: FONT, fill: COLORS.hereText,
    });
    const width = label.width() + 16;
    label.setAttrs({ width, height: BADGE_HEIGHT, align: "center", verticalAlign: "middle" });

    const badge = new Konva.Group({ x: level.center.x - width / 2, y: level.badgeTop ?? 0 });
    badge.add(new Konva.Rect({ width, height: BADGE_HEIGHT, fill: COLORS.hereFill, cornerRadius: BADGE_HEIGHT / 2 }));
    badge.add(label);
    return badge;
  }

  // Opens the current level
  private addStartButton(label: string): void {
    const button = new Konva.Group({ x: START_BUTTON.x, y: START_BUTTON.y });
    button.add(new Konva.Rect({
      width: START_BUTTON.width, height: START_BUTTON.height, fill: COLORS.startFill,
      stroke: COLORS.startOutline, strokeWidth: 3, cornerRadius: 12,
    }));
    button.add(new Konva.Text({
      width: START_BUTTON.width, height: START_BUTTON.height, align: "center", verticalAlign: "middle",
      text: label, fontSize: 24, fontFamily: FONT, fill: COLORS.startText,
    }));
    onClick(button, this.onStartClick, true);
    this.mapGroup.add(button);
  }

  getGroup(): Konva.Group { return this.group; }
  show(): void { this.group.visible(true); this.group.getLayer()?.draw(); }
  hide(): void { this.group.visible(false); this.group.getLayer()?.draw(); }
}
