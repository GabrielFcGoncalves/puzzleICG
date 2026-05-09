import * as THREE from 'three';
import { DoubleClickHandler } from './DoubleClickHandler.js';

export class PuzzleBoxHandler extends DoubleClickHandler {
    match(target) {
        return target.userData.isPuzzleBox;
    }

    handle(target, worldPos, ctx) {
        const { puzzle, scene, puzzleBox } = ctx;

        // If we clicked a button part, we let the single-click handler play the animation.
        // We only handle zooming/moving here.
        if (target.userData.isPushButton) {
            if (puzzle.isBoxOnPedestal) return;
        }


        if (puzzle.isBoxOnPedestal) {
            // Target the center of the box for orbital rotation, not the click point
            const boxWorldPos = new THREE.Vector3();
            target.getWorldPosition(boxWorldPos);
            this.zoomWithPreset(ctx, boxWorldPos, 'pedestal');
        } else {
            if (puzzle.isMovingPuzzleBox) return;

            ctx.statusElement.innerText = "STATUS: MOVING BOX TO PEDESTAL";
            scene.attach(puzzleBox.group);
            puzzle.isMovingPuzzleBox = true;
            ctx.cameraState.isTransitioning = false;
            puzzle.pBoxTargetPos.copy(new THREE.Vector3(1, 0.02, -1.2));
        }
    }

}
