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
                // If we hit the hitbox mesh, the actual logical button is its parent bone
                this.buttonObj = buttonObj.userData.isButtonMesh ? buttonObj.parent : buttonObj;
                return true;
            }
        }
        return false;
    }

    handle(ctx) {
        this.buttonObj.userData.isPressed = true;

        if (ctx.cabinet.checkPuzzle(ctx)) {
            ctx.statusElement.innerText = "STATUS: UNLOCKED (Grab handle)";
        }
    }
}
