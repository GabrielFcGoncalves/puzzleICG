import { MouseDownHandler } from './MouseDownHandler.js';
import { findAncestorWithFlag } from './Utils.js';

/**
 * Puzzle Box Color Part: plays the corresponding animation when clicked
 */
export class PuzzleBoxColorPartHandler extends MouseDownHandler {
    canHandle(ctx, raycastResults) {
        const { allHits } = raycastResults;

        for (const hit of allHits) {
            const partObj = findAncestorWithFlag(hit.object, 'isColorPart');
            if (partObj) {
                this.partObj = partObj;
                return true;
            }
        }
        return false;
    }

    handle(ctx) {
        const pBox = this.partObj.userData.puzzleBoxInstance;
        const animationName = this.partObj.userData.animationToPlay;
        if (pBox && animationName) {
            if (animationName === 'StartAction') {
                pBox.playAnimation(animationName);
                pBox.startSimonGame();
            } else {
                const color = animationName.replace('Action', '');
                pBox.handleColorInput(color);
            }
        }
    }
}
