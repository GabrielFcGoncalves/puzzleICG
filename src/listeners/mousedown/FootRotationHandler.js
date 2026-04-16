import { MouseDownHandler } from './MouseDownHandler.js';
import { findAncestorWithFlag } from './Utils.js';

/**
 * Foot rotation: drag to rotate the cabinet foot
 */
export class FootRotationHandler extends MouseDownHandler {
    canHandle(ctx, raycastResults) {
        const { footHits } = raycastResults;

        if (footHits.length === 0) {
            return false;
        }

        const obj = footHits[0].object;
        return obj.userData.isRotatable ||
               findAncestorWithFlag(obj, 'isRotatable') !== null;
    }

    handle(ctx) {
        const { interaction, cabinet } = ctx;

        this.startDrag(interaction, ctx, 'RotatingFooting', {
            rotatedFooting: cabinet.rotatableFoot,
            initialMouseX: ctx.event.clientX,
            initialRotationY: cabinet.rotatableFoot.rotation.y
        });
    }
}
