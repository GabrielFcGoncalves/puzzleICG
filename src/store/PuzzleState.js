import * as THREE from 'three';

export class PuzzleState {
    constructor() {
        // Bird alignment puzzle
        this.isBirdPuzzleSolved = false;
        this.showBirdInFocus = false;

        // Puzzle box pedestal sequence
        this.isBoxOnPedestal = false;
        this.isMovingPuzzleBox = false;
        this.pBoxTargetPos = new THREE.Vector3(0, 0, 0);

        // Hidden wall panel
        this.isSecretSquareTriggered = false;
    }
}
