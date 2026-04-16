import { EtherealToggleHandler } from './keydown/EtherealToggleHandler.js';
import { HintModeToggleHandler } from './keydown/HintModeToggleHandler.js';
import { DetachCameraHandler } from './keydown/DetachCameraHandler.js';
import { ResetZoomHandler } from './keydown/ResetZoomHandler.js';

// ============================================================================
// HANDLER REGISTRY
// ============================================================================

/**
 * Handlers are tried in order. First match wins.
 * Each handler checks for a specific key code.
 */
const KEYDOWN_HANDLERS = [
    new EtherealToggleHandler(),
    new HintModeToggleHandler(),
    new DetachCameraHandler(),
    new ResetZoomHandler(),
];

// ============================================================================
// MAIN EXPORT
// ============================================================================

export function handleKeyDown(event, ctx) {
    ctx.event = event;

    // Try each handler in order. First match wins.
    for (const handler of KEYDOWN_HANDLERS) {
        if (handler.canHandle(ctx)) {
            handler.handle(ctx);
            return;
        }
    }
}
