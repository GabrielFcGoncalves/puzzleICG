/**
 * Base class for all keydown interaction handlers.
 * Subclasses implement canHandle() to match a key, handle() to act.
 */
export class KeyDownHandler {
    /**
     * Determines if this handler should process the keypress.
     * @param {object} ctx - World context (ctx.event has the KeyboardEvent)
     * @returns {boolean}
     */
    canHandle(_ctx) {
        throw new Error('canHandle() not implemented');
    }

    /**
     * Process the keypress and update state.
     * @param {object} ctx - World context
     */
    handle(_ctx) {
        throw new Error('handle() not implemented');
    }
}
