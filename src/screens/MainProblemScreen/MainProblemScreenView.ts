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
    this.title = new Konva.Text({
      x: 0, y: 90, width: STAGE_WIDTH, align: "center", text: "",
      fontSize: 50, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
    });
    this.group.add(this.title);
    this.group.add(this.problemGroup);

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
    this.group.getLayer()?.draw();
  }

  private makeLine({ x1, x2, y }: HorizontalLine): Konva.Line {
    return new Konva.Line({ points: [x1, y, x2, y], stroke: TITLE_COLOR, strokeWidth: 3, lineCap: "round" });
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
