import { KeyDownHandler } from './KeyDownHandler.js';

/**
 * Enter: detach camera (free-fly)
 */
export class DetachCameraHandler extends KeyDownHandler {
    canHandle(ctx) {
        return ctx.event.code === 'Enter';
    }

    handle(ctx) {
        ctx.detachCamera();
    }
}
