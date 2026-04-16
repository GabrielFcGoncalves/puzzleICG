import { KeyDownHandler } from './KeyDownHandler.js';

/**
 * Space: toggle ethereal/x-ray mode
 */
export class EtherealToggleHandler extends KeyDownHandler {
    canHandle(ctx) {
        return ctx.event.code === 'Space';
    }

    handle(ctx) {
        ctx.uiState.isEthereal = !ctx.uiState.isEthereal;
        ctx.overlayElement.classList.toggle('active-ethereal');
    }
}
