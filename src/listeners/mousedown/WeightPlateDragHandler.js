import { MouseDownHandler } from './MouseDownHandler.js';

export class WeightPlateDragHandler extends MouseDownHandler {
    canHandle(ctx, raycastResults) {
        const { allHits } = raycastResults;
        if (allHits.length === 0) return false;
        
        const hit = allHits[0].object;
        
        // Find the group with itemInstance
        let search = hit;
        while (search && !search.userData.itemInstance) {
            search = search.parent;
        }
        
        // Check if it's on a plate
        if (search && search.userData.onPlateId) {
            this.draggedWeightGroup = search;
            return true;
        }
        return false;
    }

    handle(ctx) {
        const { interaction, renderer } = ctx;
        
        this.startDrag(interaction, ctx, 'DraggingWeight', {
            draggedWeight: this.draggedWeightGroup.userData.itemInstance,
            draggedWeightGroup: this.draggedWeightGroup
        });
        
        this.draggedWeightGroup.visible = false; // Hide while dragging
        
        renderer.domElement.classList.add('grabbing');
        console.log("Started dragging weight from plate:", this.draggedWeightGroup.userData.onPlateId);
    }
}
