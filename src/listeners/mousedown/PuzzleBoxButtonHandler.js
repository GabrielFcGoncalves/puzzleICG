import { MouseDownHandler } from './MouseDownHandler.js';
import { findAncestorWithFlag } from './Utils.js';

/**
 * Puzzle Box Button: plays the animation when clicked
 */
export class PuzzleBoxButtonHandler extends MouseDownHandler {
    canHandle(ctx, raycastResults) {
        const { allHits } = raycastResults;

        for (const hit of allHits) {
            const buttonObj = findAncestorWithFlag(hit.object, 'isPushButton');
            if (buttonObj) {
                this.buttonObj = buttonObj;
                return true;
            }
        }
        return false;
    }

    handle(ctx) {
        if (ctx.puzzleBox) {
            if (ctx.puzzle.isBoxOnPedestal) {
                ctx.puzzleBox.playPressedButton();
            } else {
                ctx.world.uiManager.setStatus("The button cannot be pressed yet. Move the box to the pedestal first.");
            }
        }
    }
}
