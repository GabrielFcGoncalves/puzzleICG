import { MouseDownHandler } from './MouseDownHandler.js';
import { findAncestorWithFlag } from './Utils.js';

/**
 * Padlock button: check the code when clicked
 */
export class PadlockButtonHandler extends MouseDownHandler {
    canHandle(ctx, raycastResults) {
        const { allHits } = raycastResults;

        if (!ctx.cameraState.isZoomedOnPadlock) {
            return false;
        }

        for (const hit of allHits) {
            const buttonObj = findAncestorWithFlag(hit.object, 'isPadlockButton');
            if (buttonObj) {
                this.buttonObj = buttonObj;
                return true;
            }
        }
        return false;
    }

    handle(ctx) {
        this.buttonObj.userData.isPressed = true;

        if (ctx.cabinet.checkPuzzle()) {
            ctx.statusElement.innerText = "STATUS: UNLOCKED (Grab handle)";
        }
    }
}
