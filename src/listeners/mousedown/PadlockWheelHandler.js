import { MouseDownHandler } from './MouseDownHandler.js';
import { getWheelIndex } from './Utils.js';

/**
 * Padlock wheels: rotate digit on click
 */
export class PadlockWheelHandler extends MouseDownHandler {
    canHandle(ctx, raycastResults) {
        const { wheelHits } = raycastResults;

        if (!ctx.cameraState.isZoomedOnPadlock || wheelHits.length === 0) {
            return false;
        }

        this.wheelObj = wheelHits[0].object;
        return true;
    }

    handle(ctx) {
        const { cabinet, controls } = ctx;

        const wheelIndex = getWheelIndex(this.wheelObj);
        cabinet.currentCode[wheelIndex] = (cabinet.currentCode[wheelIndex] + 1) % 10;
        cabinet.wheels[wheelIndex].userData.targetRot += (Math.PI * 2) / 10;
        controls.enabled = false;
    }
}
