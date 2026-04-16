import { MouseMoveHandler } from './MouseMoveHandler.js';
import { MOUSEMOVE_CONFIG } from './Config.js';

/**
 * Foot rotation: update foot angle based on horizontal mouse movement
 */
export class FootRotationMoveHandler extends MouseMoveHandler {
    canHandle(ctx) {
        return ctx.interaction.isRotatingFooting && ctx.interaction.rotatedFooting;
    }

    handle(ctx) {
        const { interaction, event } = ctx;
        const deltaX = event.clientX - interaction.initialMouseX;
        interaction.rotatedFooting.rotation.y =
            interaction.initialRotationY + deltaX * MOUSEMOVE_CONFIG.footRotationSensitivity;
    }
}
