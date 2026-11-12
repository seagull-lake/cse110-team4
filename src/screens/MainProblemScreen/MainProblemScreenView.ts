import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT, FONT_FAMILY, TITLE_COLOR, BUTTON_COLOR, BUTTON_TEXT_COLOR } from "../../constants.ts";
import { createHomeButton } from "../../components/HomeButton.ts";

const BACK_BUTTON = { width: 150, height: 40 };

/** The screen for one level. For now it shows which level is open; the problem is drawn in a later step. */
export class MainProblemScreenView implements View {
  private readonly group = new Konva.Group({ visible: false });
  private readonly title: Konva.Text;

  constructor(onHomeClick: () => void, onBackClick: () => void) {
    this.title = new Konva.Text({
      x: 0, y: 90, width: STAGE_WIDTH, align: "center", text: "",
      fontSize: 50, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
    });
    this.group.add(this.title);

    // Shared Home button (bottom-left) and Back to map next to it
    this.group.add(createHomeButton(onHomeClick));
    this.group.add(this.makeBackButton(onBackClick));
  }

  setTitle(title: string): void {
    this.title.text(title);
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
