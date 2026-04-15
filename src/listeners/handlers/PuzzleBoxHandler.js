import * as THREE from 'three';
import { DoubleClickHandler } from './DoubleClickHandler.js';

export class PuzzleBoxHandler extends DoubleClickHandler {
    match(target) {
        return target.userData.isPuzzleBox;
    }

    handle(target, worldPos, ctx) {
        const { puzzle, scene } = ctx;

        if (puzzle.isBoxOnPedestal) {
            this.zoomWithPreset(ctx, worldPos, 'cabinet');
        } else {
            if (puzzle.isMovingPuzzleBox) return;

            ctx.statusElement.innerText = "STATUS: MOVING BOX TO PEDESTAL";
            scene.attach(ctx.puzzleBox.group);
            puzzle.isMovingPuzzleBox = true;
            ctx.cameraState.isTransitioning = false;
            puzzle.pBoxTargetPos.copy(new THREE.Vector3(0, 0.15, 0));
        }
    }
}
