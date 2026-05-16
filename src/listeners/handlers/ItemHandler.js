import { DoubleClickHandler } from './DoubleClickHandler.js';
import { INTERACTION_RANGES } from './Constants.js';

export class ItemHandler extends DoubleClickHandler {
    match(target) {
        return target.userData.isItem;
    }

    handle(target, worldPos, ctx) {
        const { controls, cameraState } = ctx;

        if (target.userData.itemName === 'Old Key' && !cameraState.isZoomedOnFoot) {
            return;
        }

        // Find the group that holds the item instance (it might be a child mesh that was clicked)
        let itemGroup = target;
        while (itemGroup && !itemGroup.userData.itemInstance) {
            itemGroup = itemGroup.parent;
        }

        if (this.isWithinRange(worldPos, controls.target, INTERACTION_RANGES.pickup)) {
            ctx.pickupItem(itemGroup || target);
        } else if (target.userData.isZoomable !== false) {
            cameraState.isZoomedOnFoot = false;
            ctx.zoomTo(worldPos, 1.0);
        }
    }
}
