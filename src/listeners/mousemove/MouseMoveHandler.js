/**
 * Base class for all mousemove interaction handlers.
 * Subclasses implement canHandle() to check if active, handle() to process.
 */
export class MouseMoveHandler {
    /**
     * Determines if this handler should process the move.
     * @param {object} ctx - World context
     * @returns {boolean}
     */
    canHandle(_ctx) {
        throw new Error('canHandle() not implemented');
    }

    /**
     * Process the mouse movement.
     * @param {object} ctx - World context
     */
    handle(_ctx) {
        throw new Error('handle() not implemented');
    }
}
