import Konva from "konva";
import type { View } from "../../types.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import { STAGE_WIDTH, FONT_FAMILY, TITLE_COLOR } from "../../constants.ts";
import { createHomeButton } from "../../components/HomeButton.ts";

// Placeholder until Story 3 draws the map's 5 levels
export class AdventureMapScreenView implements View {
  private readonly group = new Konva.Group({ visible: false });
  private readonly title: Konva.Text;

  constructor(onHomeClick: () => void) {
    this.title = new Konva.Text({
      x: 0, y: 90, width: STAGE_WIDTH, align: "center", text: "",
      fontSize: 50, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
    });
    this.group.add(this.title);

    // Shared Home button, same as every other screen
    this.group.add(createHomeButton(onHomeClick));
  }

  setTopic(topic: LevelType): void {
    this.title.text(`${topic[0].toUpperCase()}${topic.slice(1)} Adventure`);
  }

  getGroup(): Konva.Group { return this.group; }
  show(): void { this.group.visible(true); this.group.getLayer()?.draw(); }
  hide(): void { this.group.visible(false); this.group.getLayer()?.draw(); }
}
