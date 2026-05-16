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
            const puzzleBox = target.userData.puzzleBoxInstance;
            
            // If we clicked on any part of the scale, zoom to show both plates!
            if (target.userData.isScalePlate || target.name.includes('Scale') || target.name.includes('Plate')) {
                if (puzzleBox && puzzleBox.plates[1] && puzzleBox.plates[2]) {
                    const box1 = new THREE.Box3().setFromObject(puzzleBox.plates[1]);
                    const box2 = new THREE.Box3().setFromObject(puzzleBox.plates[2]);
                    const p1 = new THREE.Vector3();
                    const p2 = new THREE.Vector3();
                    box1.getCenter(p1);
                    box2.getCenter(p2);
                    
                    // Midpoint between the two plates
                    const midPoint = p1.clone().add(p2).multiplyScalar(0.5);
                    
                    // Zoom to midPoint with a wider view to see both plates!
                    // Increased offset to (0, 0.6, 1.2) to pull back and show both plates clearly.
                    ctx.zoomTo(midPoint, 0.8, midPoint, new THREE.Vector3(0, 0.6, 1.2));
                    return;
                }
            }

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
            puzzle.pBoxTargetPos.copy(new THREE.Vector3(1.85, -1, -1.6));
        }
    }

}
