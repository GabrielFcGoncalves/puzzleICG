import { MouseMoveHandler } from './MouseMoveHandler.js';
import { MOUSEMOVE_CONFIG } from './Config.js';

/**
 * Key turning: detect horizontal drag to turn the key
 */
export class KeyTurningMoveHandler extends MouseMoveHandler {
    canHandle(ctx) {
        return ctx.interaction.isTurningKey;
    }

    handle(ctx) {
        const { interaction, cabinet, event } = ctx;
        const deltaX = event.clientX - interaction.initialMouseX;

        if (deltaX > MOUSEMOVE_CONFIG.keyMinDragPixels) {
            cabinet.isKeyTurned = true;
            cabinet.drawerGroups[0].userData.isLocked = false;
            cabinet.targetDrawerZ[0] = cabinet.drawerGroups[0].userData.restZ + 0.05;
            ctx.statusElement.innerText = "STATUS: MIDDLE DRAWER UNLOCKED";
        }
    }
}
