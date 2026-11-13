import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT, FONT_FAMILY, TITLE_COLOR, BUTTON_COLOR, BUTTON_TEXT_COLOR } from "../../constants.ts";
import { createHomeButton } from "../../components/HomeButton.ts";
import { CELL_WIDTH, DIGIT_FONT_SIZE, ROW_HEIGHT } from "./MainProblemLayout.ts";
import type { HorizontalLine, ProblemLayout } from "./MainProblemLayout.ts";

const BACK_BUTTON = { width: 150, height: 40 };

/** The screen for one level: its title and its problem, written in columns like on paper. */
export class MainProblemScreenView implements View {
  private readonly group = new Konva.Group({ visible: false });
  private readonly title: Konva.Text;
  // The problem's digits and lines; rebuilt for every new problem
  private readonly problemGroup = new Konva.Group();

  constructor(onHomeClick: () => void, onBackClick: () => void) {
    this.title = new Konva.Text({
      x: 0, y: 90, width: STAGE_WIDTH, align: "center", text: "",
      fontSize: 50, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
    });
    this.group.add(this.title);
    this.group.add(this.problemGroup);

    // Shared Home button (bottom-left) and Back to map next to it
    this.group.add(createHomeButton(onHomeClick));
    this.group.add(this.makeBackButton(onBackClick));
  }

  setTitle(title: string): void {
    this.title.text(title);
  }

  /** Draws the problem; where everything goes is decided in MainProblemLayout. */
  setProblem(layout: ProblemLayout): void {
    this.problemGroup.destroyChildren();
    layout.cells.forEach(cell => this.problemGroup.add(new Konva.Text({
      x: cell.x, y: cell.y, width: CELL_WIDTH, height: ROW_HEIGHT, align: "center", verticalAlign: "middle",
      text: cell.text, fontSize: DIGIT_FONT_SIZE, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
    })));

    if (layout.kind === "column") {
      this.problemGroup.add(this.makeLine(layout.line));
    } else {
      const { x, top, bottom } = layout.bracket;
      this.problemGroup.add(new Konva.Line({
        points: [x, top, x + 12, (top + bottom) / 2, x, bottom],
        tension: 0.5, stroke: TITLE_COLOR, strokeWidth: 3, lineCap: "round",
      }));
      this.problemGroup.add(this.makeLine(layout.bar));
    }
    this.group.getLayer()?.draw();
  }

  private makeLine({ x1, x2, y }: HorizontalLine): Konva.Line {
    return new Konva.Line({ points: [x1, y, x2, y], stroke: TITLE_COLOR, strokeWidth: 3, lineCap: "round" });
  }

  private makeBackButton(onClick: () => void): Konva.Group {
    const button = new Konva.Group({ x: 140, y: STAGE_HEIGHT - 62 });
    button.add(new Konva.Rect({ ...BACK_BUTTON, fill: BUTTON_COLOR, cornerRadius: 8 }));
    button.add(new Konva.Text({
      ...BACK_BUTTON, text: "Back to map", fontSize: 18, fontFamily: FONT_FAMILY,
      fill: BUTTON_TEXT_COLOR, align: "center", verticalAlign: "middle",
    }));
    button.on("click", onClick);
    button.on("mouseenter", () => (document.body.style.cursor = "pointer"));
    button.on("mouseleave", () => (document.body.style.cursor = "default"));
    return button;
  }

  getGroup(): Konva.Group { return this.group; }
  show(): void { this.group.visible(true); this.group.getLayer()?.draw(); }
  hide(): void { this.group.visible(false); this.group.getLayer()?.draw(); }
}
