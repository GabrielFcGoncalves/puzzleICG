
export class UIState {
    constructor() {
        // Mode toggles
        this.isInspecting = false;
        this.isHintMode = false;
        this.isEthereal = false;

        // Inventory
        this.inventory = [];
        this.draggedInventoryIndex = -1;

        // Rendering
        this.shadowNeedsRefresh = true;
    }
}
