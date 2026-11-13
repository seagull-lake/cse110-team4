import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT, FONT_FAMILY, TITLE_COLOR, BUTTON_COLOR, BUTTON_TEXT_COLOR } from "../../constants.ts";
import { createHomeButton } from "../../components/HomeButton.ts";
import { ROW_HEIGHT } from "./MainProblemLayout.ts";
import type { FieldLayout, HorizontalLine, ProblemLayout } from "./MainProblemLayout.ts";

const BACK_BUTTON = { width: 150, height: 40 };
const BOX_INSET = 4;
const BOX_FILL = "#FFFFFF";
const BOX_STROKE = "#27695B";
/** The field being typed in */
const ACTIVE_FILL = "#FFF1B8";
const ACTIVE_STROKE = "#E0A100";


/** The screen for one level: its title and its problem, written in columns like on paper. */
export class MainProblemScreenView implements View {
  private readonly group = new Konva.Group({ visible: false });
  private readonly title: Konva.Text;
  // The problem's digits and lines; rebuilt for every new problem
  private readonly problemGroup = new Konva.Group();
  // The input boxes of every field, and the typed characters drawn inside them
  private readonly answerGroup = new Konva.Group();
  /** In the model's field order: the division box fields first, then the answer. */
  private fields: FieldLayout[] = [];
  /** Division: copies of a box's amount left at the top of the next box. */
  private carried: (FieldLayout & { from: number })[] = [];
  private readonly onFieldClick: (index: number) => void;

  /**
   * onKey gets every key pressed while this screen is shown, e.g. "7", "-", "Backspace" or "Tab"
   * ("Shift+Tab" with Shift held). onFieldClick gets the index of a clicked field.
   */
  constructor(onHomeClick: () => void, onBackClick: () => void, onKey: (key: string) => void = () => {},
    onFieldClick: (index: number) => void = () => {}) {
    this.onFieldClick = onFieldClick;
    window.addEventListener("keydown", event => {
      if (!this.group.visible()) return;
      if (event.key === "Tab") {
        event.preventDefault(); // keep the focus on the game
        onKey(event.shiftKey ? "Shift+Tab" : "Tab");
        return;
      }
      onKey(event.key);
    });
    this.title = new Konva.Text({
      x: 0, y: 90, width: STAGE_WIDTH, align: "center", text: "",
      fontSize: 50, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
    });
    this.group.add(this.title);
    this.group.add(this.problemGroup);
    this.group.add(this.answerGroup);

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
    const { width, height, fontSize } = layout.cellSize;
    layout.cells.forEach(cell => this.problemGroup.add(new Konva.Text({
      x: cell.x, y: cell.y, width, height, align: "center", verticalAlign: "middle",
      text: cell.text, fontSize, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
    })));

    if (layout.kind === "column") {
      this.problemGroup.add(this.makeLine(layout.line));
      if (layout.secondLine) this.problemGroup.add(this.makeLine(layout.secondLine));
      this.carried = [];
    } else {
      // Box method: one box per division step
      layout.boxes.forEach(box => this.problemGroup.add(new Konva.Rect({ ...box, stroke: TITLE_COLOR, strokeWidth: 3 })));
      layout.lines.forEach(line => this.problemGroup.add(this.makeLine(line, 2)));
      const { right, y } = layout.answerLabel;
      this.problemGroup.add(new Konva.Text({
        x: right - 200, y, width: 200, height: ROW_HEIGHT, align: "right", verticalAlign: "middle",
        text: "Answer", fontSize: 24, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
      }));
      this.carried = layout.carried;
    }
    this.fields = [...layout.steps, layout.answer];
    this.showAnswer(this.fields.map(() => ""), 0);
  }

  /** Draws every field's boxes with what was typed in them (right-aligned like a calculator); the active field is highlighted. */
  showAnswer(entries: readonly string[], active: number): void {
    this.answerGroup.destroyChildren();
    this.fields.forEach((field, index) => {
      const isActive = index === active;
      field.cellXs.forEach(x => {
        const box = new Konva.Rect({
          x: x + BOX_INSET, y: field.y + BOX_INSET,
          width: field.size.width - BOX_INSET * 2, height: field.size.height - BOX_INSET * 2,
          fill: isActive ? ACTIVE_FILL : BOX_FILL, stroke: isActive ? ACTIVE_STROKE : BOX_STROKE,
          strokeWidth: 2, cornerRadius: 6,
        });
        box.on("click tap", () => this.onFieldClick(index));
        box.on("mouseenter", () => (document.body.style.cursor = "text"));
        box.on("mouseleave", () => (document.body.style.cursor = "default"));
        this.answerGroup.add(box);
      });
      this.drawCharacters(field, entries[index] ?? "");
    });
    this.carried.forEach(copy => this.drawCharacters(copy, entries[copy.from] ?? ""));
    this.group.getLayer()?.draw();
  }

  /** Writes `entered` into the last cells of a field. Text doesn't catch clicks, so the box under it does. */
  private drawCharacters({ cellXs, y, size }: FieldLayout, entered: string): void {
    const firstFilled = cellXs.length - entered.length;
    cellXs.forEach((x, index) => {
      const character = index >= firstFilled ? entered[index - firstFilled] : "";
      if (!character) return;
      this.answerGroup.add(new Konva.Text({
        x, y, width: size.width, height: size.height, align: "center", verticalAlign: "middle", listening: false,
        text: character === "-" ? "−" : character, fontSize: size.fontSize, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
      }));
    });
  }

  private makeLine({ x1, x2, y }: HorizontalLine, strokeWidth = 3): Konva.Line {
    return new Konva.Line({ points: [x1, y, x2, y], stroke: TITLE_COLOR, strokeWidth, lineCap: "round" });
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
