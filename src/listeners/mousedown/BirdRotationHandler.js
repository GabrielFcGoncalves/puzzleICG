import { MouseDownHandler } from './MouseDownHandler.js';

/**
 * Bird rotation: drag bird model to rotate it
 */
export class BirdRotationHandler extends MouseDownHandler {
    canHandle(ctx, raycastResults) {
        const { birdHits } = raycastResults;

        return ctx.puzzle.showBirdInFocus &&
               ctx.birdProxy &&
               birdHits.length > 0;
    }

    handle(ctx) {
        this.startDrag(ctx.interaction, ctx, 'DraggingBird', {
            initialMouseX: ctx.event.clientX,
            initialMouseY: ctx.event.clientY,
            initialRotationY: ctx.birdProxy.rotation.y,
            initialRotationX: ctx.birdProxy.rotation.x
        });
    }
}
