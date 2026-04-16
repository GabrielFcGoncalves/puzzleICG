/**
 * Base class for all mousedown interaction handlers.
 * Subclasses implement canHandle() to match and handle() to act.
 */
export class MouseDownHandler {
    /**
     * Determines if this handler should process the click.
     * @param {object} ctx - World context
     * @param {object} raycastResults - Pre-collected raycast hits
     * @returns {boolean}
     */
    canHandle(_ctx, _raycastResults) {
        throw new Error('canHandle() not implemented');
    }

    /**
     * Process the click and update interaction state.
     * @param {object} ctx - World context
     */
    handle(_ctx) {
        throw new Error('handle() not implemented');
    }

    /**
     * Helper: Start a drag operation by setting an interaction flag
     * and disabling camera controls.
     */
    startDrag(interaction, ctx, type, state = {}) {
        interaction[`is${type}`] = true;
        Object.assign(interaction, state);
        ctx.controls.enabled = false;
    }
}
