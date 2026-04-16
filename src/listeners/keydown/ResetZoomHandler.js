import { KeyDownHandler } from './KeyDownHandler.js';

/**
 * Escape: reset camera zoom and re-enable clamping
 */
export class ResetZoomHandler extends KeyDownHandler {
    canHandle(ctx) {
        return ctx.event.code === 'Escape';
    }

    handle(ctx) {
        ctx.cameraState.camClampingDisabled = false;
        ctx.resetZoom();
    }
}
