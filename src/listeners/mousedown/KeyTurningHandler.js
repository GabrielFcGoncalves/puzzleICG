import { MouseDownHandler } from './MouseDownHandler.js';

/**
 * Key turning: drag to turn the inserted key
 */
export class KeyTurningHandler extends MouseDownHandler {
    canHandle(ctx, raycastResults) {
        const { keyHits } = raycastResults;

        return keyHits.length > 0 &&
               ctx.cabinet.isKeyInserted &&
               !ctx.cabinet.isKeyTurned;
    }

    handle(ctx) {
        this.startDrag(ctx.interaction, ctx, 'TurningKey', {
            initialMouseX: ctx.event.clientX
        });
    }
}
