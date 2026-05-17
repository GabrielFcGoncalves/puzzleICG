import { MouseDownHandler } from './MouseDownHandler.js';

export class DoorDragHandler extends MouseDownHandler {
    canHandle(ctx, raycastResults) {
        const { allHits } = raycastResults;
        const hit = allHits.find(h => h.object.userData.isDoorHandle);
        
        if (hit && ctx.store.placedGems < 3) {
            ctx.world.uiManager.setStatus("The door is locked. Find all 3 gems.");
            return false;
        }
        
        return !!hit;
    }

    handle(ctx) {
        const { interaction, mouse } = ctx;
        
        this.startDrag(interaction, ctx, 'DraggingDoor', {
            initialMouseX: mouse.x,
            initialMouseY: mouse.y,
            initialRotationY: ctx.puzzle.doorRotation
        });
        
        interaction.isDragging = true;
        console.log("Door dragging started");
    }
}
