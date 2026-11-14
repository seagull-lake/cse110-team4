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
  private readonly feedback: Konva.Text;
  private readonly submitButton: Konva.Group;
  private readonly continueButton: Konva.Group;
  private answerCells: { rect: Konva.Rect; text: Konva.Text }[] = [];
  private enteredAnswer: string[] = [];
  private focusedCell = 0;
  private answerLocked = false;
  private readonly keydownHandler = (event: KeyboardEvent) => this.handleKeyDown(event);

  constructor(
    onHomeClick: () => void,
    onBackClick: () => void,
    onSubmitClick: () => void,
    onContinueClick: () => void,
  ) {
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

    this.feedback = new Konva.Text({
      x: 120, y: STAGE_HEIGHT - 190, width: 560, height: 32, align: "center",
      text: "", fontSize: 22, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
    });
    this.group.add(this.feedback);
    this.submitButton = this.makeActionButton(
      "Submit", 330, STAGE_HEIGHT - 145, onSubmitClick,
    );
    this.continueButton = this.makeActionButton(
      "Continue", 490, STAGE_HEIGHT - 145, onContinueClick,
    );
    this.continueButton.visible(false);
    this.group.add(this.submitButton, this.continueButton);

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
    this.answerCells = [];
    this.enteredAnswer = Array.from({ length: layout.answer.cellXs.length }, () => "");
    this.focusedCell = 0;
    this.answerLocked = false;
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

    layout.answer.cellXs.forEach((x, index) => {
      const rect = new Konva.Rect({
        x: x + 2, y: layout.answer.y + 2, width: CELL_WIDTH - 4, height: ROW_HEIGHT - 4,
        fill: "#FFFFFF", stroke: "#000000", strokeWidth: 2, cornerRadius: 6,
      });
      const text = new Konva.Text({
        x: x + 2, y: layout.answer.y + 2, width: CELL_WIDTH - 4, height: ROW_HEIGHT - 4,
        text: "", fontSize: DIGIT_FONT_SIZE - 4, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
        align: "center", verticalAlign: "middle",
      });
      const focusCell = () => {
        this.focusedCell = index;
        this.updateCellFocus();
      };
      rect.on("click", focusCell);
      text.on("click", focusCell);
      this.answerCells.push({ rect, text });
      this.problemGroup.add(rect, text);
    });
    this.updateCellFocus();
    this.feedback.text("");
    this.continueButton.visible(false);
    this.group.getLayer()?.draw();
  }

  getEnteredAnswer(): readonly string[] { return this.enteredAnswer; }

  showCorrectAnswer(): void {
    this.answerLocked = true;
    this.answerCells.forEach(({ rect }) => rect.fill("#B8E6C7"));
    this.feedback.text("Correct!");
    this.continueButton.visible(true);
    this.updateCellFocus();
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

  private makeActionButton(label: string, x: number, y: number, onClick: () => void): Konva.Group {
    const button = new Konva.Group({ x, y });
    button.add(new Konva.Rect({
      width: 140, height: 48, fill: BUTTON_COLOR, cornerRadius: 8,
    }));
    button.add(new Konva.Text({
      width: 140, height: 48, text: label, fontSize: 20, fontFamily: FONT_FAMILY,
      fill: BUTTON_TEXT_COLOR, align: "center", verticalAlign: "middle",
    }));
    button.on("click", onClick);
    button.on("mouseenter", () => (document.body.style.cursor = "pointer"));
    button.on("mouseleave", () => (document.body.style.cursor = "default"));
    return button;
  }

  private updateCellFocus(): void {
    this.answerCells.forEach(({ rect }, index) => {
      rect.strokeWidth(index === this.focusedCell ? 3 : 2);
    });
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.group.visible() || this.answerCells.length === 0 || this.answerLocked) return;
    if (/^\d$/.test(event.key) || (event.key === "-" && this.focusedCell === 0)) {
      this.enteredAnswer[this.focusedCell] = event.key;
      this.answerCells[this.focusedCell].text.text(event.key);
      if (this.focusedCell < this.answerCells.length - 1) this.focusedCell++;
      this.clearAnswerFeedback();
      this.updateCellFocus();
    } else if (event.key === "Backspace") {
      if (this.enteredAnswer[this.focusedCell] === "" && this.focusedCell > 0) this.focusedCell--;
      this.enteredAnswer[this.focusedCell] = "";
      this.answerCells[this.focusedCell].text.text("");
      this.clearAnswerFeedback();
      this.updateCellFocus();
    } else if (event.key === "ArrowLeft" && this.focusedCell > 0) {
      this.focusedCell--;
      this.updateCellFocus();
    } else if (event.key === "ArrowRight" && this.focusedCell < this.answerCells.length - 1) {
      this.focusedCell++;
      this.updateCellFocus();
    } else if (event.key === "Enter") {
      this.submitButton.fire("click");
    } else {
      return;
    }
    event.preventDefault();
    this.group.getLayer()?.draw();
  }

  private clearAnswerFeedback(): void {
    this.answerCells.forEach(({ rect }) => rect.fill("#FFFFFF"));
    this.feedback.text("");
    this.continueButton.visible(false);
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
  show(): void {
    this.group.visible(true);
    window.addEventListener("keydown", this.keydownHandler);
    this.group.getLayer()?.draw();
  }
  hide(): void {
    this.group.visible(false);
    window.removeEventListener("keydown", this.keydownHandler);
    this.group.getLayer()?.draw();
  }
}
