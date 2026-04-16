import { KeyDownHandler } from './KeyDownHandler.js';

/**
 * H: toggle hint mode
 */
export class HintModeToggleHandler extends KeyDownHandler {
    canHandle(ctx) {
        return ctx.event.code === 'KeyH';
    }

    handle(ctx) {
        ctx.uiState.isHintMode = !ctx.uiState.isHintMode;
        const msg = ctx.uiState.isHintMode ? "HINT MODE: ON" : "HINT MODE: OFF";
        ctx.statusElement.innerText = `STATUS: ${msg}`;
    }
}
