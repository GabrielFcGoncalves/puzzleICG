export class InteractionState {
    constructor() {
        // Active interaction flags
        this.isDragging = false;
        this.isRotatingFooting = false;
        this.isTurningKey = false;
        this.isDraggingBird = false;
        this.isDraggingDoor = false;
        this.draggedDrawerIndex = -1;
        this.rotatedFooting = null;

        // Mouse memory (captured at mousedown, consumed during mousemove)
        this.initialMouseX = 0;
        this.initialMouseY = 0;
        this.initialRotationY = 0;
        this.initialRotationX = 0;
        this.hoveredSlot = null; // Entity being hovered during inventory drag
    }

    /**
     * Clears all active interaction flags back to their idle state.
     * Called on mouseup to ensure a clean slate for the next gesture.
     */
    resetAll() {
        this.isDragging = false;
        this.isRotatingFooting = false;
        this.isTurningKey = false;
        this.isDraggingBird = false;
        this.isDraggingDoor = false;
        this.draggedDrawerIndex = -1;
        this.rotatedFooting = null;
        this.hoveredSlot = null;
    }
}
