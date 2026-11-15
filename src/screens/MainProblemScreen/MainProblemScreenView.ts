import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT, FONT_FAMILY, TITLE_COLOR, BUTTON_COLOR, BUTTON_TEXT_COLOR } from "../../constants.ts";
import { createHomeButton } from "../../components/HomeButton.ts";
import { MARKER_SIZE, ROW_HEIGHT } from "./MainProblemLayout.ts";
import type { FieldLayout, HorizontalLine, ProblemLayout, Rect, RowMarker } from "./MainProblemLayout.ts";
import { getCarryFieldIndexes, getRowProgress, getShownRow, isHiddenCarry, isWorkingRow } from "./MainProblemRows.ts";
import type { RowProgress } from "./MainProblemRows.ts";

const BACK_BUTTON = { width: 150, height: 40 };
/** The main button in the bottom-right corner: "Submit", then "Continue" or "Review Mistakes", in the same spot. */
const PRIMARY_BUTTON = { width: 170, height: 48 };
/** Same distance from the edges as the Home button has in the bottom-left. */
const SCREEN_MARGIN = 30;
const HOME_BUTTON_BOTTOM = STAGE_HEIGHT - 22; // the Home button is 40 high and starts at STAGE_HEIGHT - 62
const PRIMARY_BUTTON_X = STAGE_WIDTH - SCREEN_MARGIN - PRIMARY_BUTTON.width;
const PRIMARY_BUTTON_Y = HOME_BUTTON_BOTTOM - PRIMARY_BUTTON.height;
const BOX_INSET = 4;
const BOX_FILL = "#FFFFFF";
const BOX_STROKE = "#27695B";
/** The field being typed in */
const ACTIVE_FILL = "#FFF1B8";
const ACTIVE_STROKE = "#E0A100";
/** The answer once it is correct */
const CORRECT_FILL = "#B8E6C7";
/** The "Correct!" message */
const CORRECT_TEXT_COLOR = "#3f9a5b";
/** The circle beside a multiplication row: no carries filled in yet / some of them / all of them. */
const MARKER_FILL: Record<RowProgress, string> = {
  empty: "#E53935",
  partial: "#F2C94C",
  complete: CORRECT_TEXT_COLOR,
};
/** Multiplication: the boxes of the row being worked on (its carries and partial product) get a thicker outline. */
const WORKING_ROW_STROKE_WIDTH = 4;
/**
 * The outline around the digit of the second number being used. It is smaller than the digit's cell, so
 * it stays clear of the line right under that row and of the neighboring digits.
 */
const DIGIT_HIGHLIGHT_INSET = 4;

/** The screen for one level: its title and its problem, written in columns like on paper. */
export class MainProblemScreenView implements View {
  private readonly group = new Konva.Group({ visible: false });
  private readonly title: Konva.Text;
  // The problem's digits and lines; rebuilt for every new problem
  private readonly problemGroup = new Konva.Group();
  private readonly feedback: Konva.Text;
  private readonly submitButton: Konva.Group;
  private readonly continueButton: Konva.Group;
  // The input boxes of every field, and the typed characters drawn inside them
  private readonly answerGroup = new Konva.Group();
  // Solution content sits above the question and below the navigation buttons.
  private readonly solutionGroup = new Konva.Group();
  /** In the model's field order: the division box fields first, then the answer. */
  private fields: FieldLayout[] = [];
  /** Division: copies of a box's amount left at the top of the next box. */
  private carried: (FieldLayout & { from: number })[] = [];
  private readonly onFieldClick: (index: number) => void;
  /** Multiplication: a marker beside each partial product showing whether that row's carries are filled in. */
  private rowMarkers: RowMarker[] = [];
  /** Multiplication: where each digit of the second number is (index 0 = ones), to outline the one being used. */
  private multiplierCells: Rect[] = [];
  /**
   * Multiplication: the multiplier digit whose carries are drawn above the numbers (every row's carries
   * share those boxes). It follows the field being typed in, and stays on the last row when the answer is selected.
   */
  private shownRow = 0;
  /** What showAnswer last drew, so the answer can be read back and redrawn. */
  private entries: readonly string[] = [];
  private active = 0;
  /** Once the answer is correct, typing and clicking boxes does nothing. */
  private answerLocked = false;

  /**
   * onKey gets every key pressed while this screen is shown, e.g. "7", "-", "Backspace" or "Tab"
   * ("Shift+Tab" with Shift held). onFieldClick gets the index of a clicked field.
   */
  constructor(
    onHomeClick: () => void,
    onBackClick: () => void,
    onSubmitClick: () => void,
    onContinueClick: () => void,
    onKey: (key: string) => void = () => {},
    onFieldClick: (index: number) => void = () => {},
  ) {
    this.onFieldClick = onFieldClick;
    window.addEventListener("keydown", event => {
      if (!this.group.visible() || this.answerLocked) return;
      if (event.key === "Tab") {
        event.preventDefault(); // keep the focus on the game
        onKey(event.shiftKey ? "Shift+Tab" : "Tab");
        return;
      }
      if (event.key === "Enter") {
        this.submitButton.fire("click");
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

    // Centered right under the title (which ends around y = 135), above the problem (which starts at y = 180)
    this.feedback = new Konva.Text({
      x: 0, y: 142, width: STAGE_WIDTH, height: 32, align: "center",
      text: "", fontSize: 24, fontFamily: FONT_FAMILY, fill: CORRECT_TEXT_COLOR,
    });
    this.group.add(this.feedback);
    // Submit and Continue share the bottom-right corner: Continue replaces Submit on a correct answer
    this.submitButton = this.makePrimaryButton("Submit", PRIMARY_BUTTON_X, PRIMARY_BUTTON_Y, onSubmitClick);
    this.continueButton = this.makePrimaryButton("Continue", PRIMARY_BUTTON_X, PRIMARY_BUTTON_Y, onContinueClick);
    this.continueButton.visible(false);
    this.group.add(this.submitButton, this.continueButton);
    this.group.add(this.solutionGroup);

    // Shared Home button (bottom-left) and Back to map next to it
    this.group.add(createHomeButton(onHomeClick));
    this.group.add(this.makeBackButton(onBackClick));
  }

  setTitle(title: string): void {
    this.title.text(title);
  }

  /** Draws the problem; where everything goes is decided in MainProblemLayout. */
  setProblem(layout: ProblemLayout): void {
    this.solutionGroup.destroyChildren();
    this.title.show();
    this.problemGroup.show();
    this.answerGroup.show();
    this.feedback.show();
    this.problemGroup.destroyChildren();
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
      this.rowMarkers = layout.rowMarkers;
      this.multiplierCells = layout.multiplierCells;
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
      this.rowMarkers = [];
      this.multiplierCells = [];
    }

    this.fields = [...layout.steps, layout.answer];
    this.shownRow = 0;
    this.feedback.text("");
    this.submitButton.visible(true);
    this.continueButton.visible(false);
    this.showAnswer(this.fields.map(() => ""), 0);
  }

  /** Replace the question with a solution while keeping Home and Back to map available. */
  showSolution(view: View): void {
    this.answerLocked = true;
    this.title.hide();
    this.problemGroup.hide();
    this.answerGroup.hide();
    this.feedback.hide();
    this.submitButton.hide();
    this.continueButton.hide();
    this.solutionGroup.destroyChildren();
    this.solutionGroup.add(view.getGroup());
    view.show();
    this.group.getLayer()?.draw();
  }

  /** The characters typed in the final answer field, one per box. */
  getEnteredAnswer(): readonly string[] { return Array.from(this.entries.at(-1) ?? ""); }

  /** Turns the answer boxes green, locks the answer and offers Continue. */
  showCorrectAnswer(): void {
    this.answerLocked = true;
    this.feedback.text("Correct!");
    this.submitButton.visible(false);
    this.continueButton.visible(true);
    this.showAnswer(this.entries, this.active);
  }

  /** Draws every field's boxes with what was typed in them (right-aligned like a calculator); the active field is highlighted. */
  showAnswer(entries: readonly string[], active: number): void {
    this.entries = entries;
    this.active = active;
    this.answerGroup.destroyChildren();
    this.shownRow = getShownRow(this.fields, active, this.shownRow);
    this.drawMultiplierDigitHighlight();
    this.fields.forEach((field, index) => {
      if (isHiddenCarry(field, this.shownRow)) return; // another row's carries are in these boxes
      const inWorkingRow = isWorkingRow(field, this.shownRow, this.rowMarkers.length > 0);
      const isActive = index === active && !this.answerLocked;
      const isLockedAnswer = this.answerLocked && index === this.fields.length - 1;
      field.cellXs.forEach(x => {
        const box = new Konva.Rect({
          x: x + BOX_INSET, y: field.y + BOX_INSET,
          width: field.size.width - BOX_INSET * 2, height: field.size.height - BOX_INSET * 2,
          fill: isLockedAnswer ? CORRECT_FILL : isActive ? ACTIVE_FILL : BOX_FILL,
          stroke: isActive ? ACTIVE_STROKE : BOX_STROKE,
          strokeWidth: inWorkingRow ? WORKING_ROW_STROKE_WIDTH : 2, cornerRadius: 6,
        });
        box.on("click tap", () => { if (!this.answerLocked) this.onFieldClick(index); });
        box.on("mouseenter", () => (document.body.style.cursor = "text"));
        box.on("mouseleave", () => (document.body.style.cursor = "default"));
        this.answerGroup.add(box);
      });
      this.drawCharacters(field, entries[index] ?? "");
    });
    this.carried.forEach(copy => this.drawCharacters(copy, entries[copy.from] ?? ""));
    this.drawRowMarkers(entries);
    this.group.getLayer()?.draw();
  }

  /** Multiplication: outlines the digit of the second number that the row being worked on multiplies by. */
  private drawMultiplierDigitHighlight(): void {
    const cell = this.multiplierCells[this.shownRow];
    if (!cell) return;
    // A square centered on the digit, so it has the same gap above and below
    const side = Math.min(cell.width, cell.height) - DIGIT_HIGHLIGHT_INSET * 2;
    this.answerGroup.add(new Konva.Rect({
      x: cell.x + (cell.width - side) / 2, y: cell.y + (cell.height - side) / 2, width: side, height: side,
      stroke: TITLE_COLOR, strokeWidth: 3, cornerRadius: 8, listening: false,
    }));
  }

  /**
   * One circle beside each partial product: red when none of its carries are filled in, yellow when some
   * are, green when all are. The row whose carries are shown has a thicker outline; clicking a circle shows its carries.
   */
  private drawRowMarkers(entries: readonly string[]): void {
    this.rowMarkers.forEach(({ row, x, y }) => {
      const progress = getRowProgress(this.fields, entries, row);
      if (!progress) return;
      const marker = new Konva.Circle({
        x: x + MARKER_SIZE / 2, y: y + MARKER_SIZE / 2, radius: MARKER_SIZE / 2 - 3, // leaves room for the thickest outline
        fill: MARKER_FILL[progress],
        stroke: TITLE_COLOR, strokeWidth: row === this.shownRow ? 5 : 2,
      });
      const [firstCarry] = getCarryFieldIndexes(this.fields, row);
      marker.on("click tap", () => { if (!this.answerLocked) this.onFieldClick(firstCarry); });
      marker.on("mouseenter", () => (document.body.style.cursor = "pointer"));
      marker.on("mouseleave", () => (document.body.style.cursor = "default"));
      this.answerGroup.add(marker);
    });
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

  private makePrimaryButton(label: string, x: number, y: number, onClick: () => void): Konva.Group {
    const button = new Konva.Group({ x, y });
    button.add(new Konva.Rect({
      ...PRIMARY_BUTTON, fill: BUTTON_COLOR, cornerRadius: 8,
    }));
    button.add(new Konva.Text({
      ...PRIMARY_BUTTON, text: label, fontSize: 20, fontFamily: FONT_FAMILY,
      fill: BUTTON_TEXT_COLOR, align: "center", verticalAlign: "middle",
    }));
    button.on("click", onClick);
    button.on("mouseenter", () => (document.body.style.cursor = "pointer"));
    button.on("mouseleave", () => (document.body.style.cursor = "default"));
    return button;
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
    this.group.getLayer()?.draw();
  }
  hide(): void {
    this.group.visible(false);
    this.group.getLayer()?.draw();
  }
}
