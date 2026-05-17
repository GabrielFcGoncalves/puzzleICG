import { MouseDownHandler } from './MouseDownHandler.js';
import { findAncestorWithFlag } from './Utils.js';

/**
 * Puzzle Box Lever: plays Lever move and TopUp animations when clicked
 */
export class PuzzleBoxLeverHandler extends MouseDownHandler {
    canHandle(ctx, raycastResults) {
        const { allHits } = raycastResults;

        for (const hit of allHits) {
            const leverObj = findAncestorWithFlag(hit.object, 'isLever');
            if (leverObj) {
                this.leverObj = leverObj;
                return true;
            }
        }
        return false;
    }

    handle(ctx) {
        const pBox = this.leverObj.userData.puzzleBoxInstance;
        if (pBox) {
            pBox.playLever();
        }
    }
}
