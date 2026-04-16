import { MouseDownHandler } from './MouseDownHandler.js';
import { findAncestorWithFlag, isMountedOnStand, findItemInstance } from './Utils.js';

/**
 * Flashlight switch: toggle mounted flashlight on/off
 */
export class FlashlightSwitchHandler extends MouseDownHandler {
    canHandle(ctx, raycastResults) {
        const { allHits } = raycastResults;

        for (const hit of allHits) {
            const switchObj = findAncestorWithFlag(hit.object, 'isFlashlightSwitch');
            if (switchObj && isMountedOnStand(switchObj)) {
                this.switchObj = switchObj;
                return true;
            }
        }
        return false;
    }

    handle() {
        const itemInstance = findItemInstance(this.switchObj);
        if (itemInstance?.toggle) {
            itemInstance.toggle();
        }
    }
}
