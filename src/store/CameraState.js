import * as THREE from 'three';

/**
 * CameraState owns camera transition targets, zoom-level flags,
 * and clamping configuration.
 */
export class CameraState {
    constructor() {
        // Transition animation
        this.isTransitioning = false;
        this.targetFocus = new THREE.Vector3(0, 0, 0);
        this.cameraFocus = new THREE.Vector3(3, 2, 4);

        // Zoom context flags
        this.isZoomedOnFoot = false;
        this.isZoomedOnPadlock = false;

        // Debug / free-fly mode
        this.camClampingDisabled = false;
    }
}
