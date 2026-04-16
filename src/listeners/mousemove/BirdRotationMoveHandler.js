import { MouseMoveHandler } from './MouseMoveHandler.js';
import { MOUSEMOVE_CONFIG } from './Config.js';

/**
 * Bird rotation: rotate bird model based on mouse drag
 */
export class BirdRotationMoveHandler extends MouseMoveHandler {
    canHandle(ctx) {
        return ctx.interaction.isDraggingBird && ctx.birdProxy;
    }

    handle(ctx) {
        const { interaction, event } = ctx;
        const deltaX = event.clientX - interaction.initialMouseX;
        const deltaY = event.clientY - interaction.initialMouseY;

        ctx.birdProxy.rotation.y =
            interaction.initialRotationY + deltaX * MOUSEMOVE_CONFIG.birdRotationSensitivity;
        ctx.birdProxy.rotation.x =
            interaction.initialRotationX + deltaY * MOUSEMOVE_CONFIG.birdRotationSensitivity;
    }
}
