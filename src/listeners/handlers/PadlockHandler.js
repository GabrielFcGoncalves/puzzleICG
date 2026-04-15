import * as THREE from 'three';
import { DoubleClickHandler } from './DoubleClickHandler.js';
import { CAMERA_PRESETS } from './Constants.js';
import { applyPresetAngles } from './Utils.js';

export class PadlockHandler extends DoubleClickHandler {
    match(target) {
        return target.userData.isPadlock ||
               target.userData.isPadlockWheel ||
               target.userData.isPadlockButton;
    }

    handle(target, worldPos, ctx) {
        const { cameraState } = ctx;

        cameraState.isZoomedOnFoot = false;
        cameraState.isZoomedOnPadlock = true;

        const isSubPart = target.userData.isPadlockWheel || target.userData.isPadlockButton;
        const zoomLevel = isSubPart ? 2.0 : 0.5;
        const offset = isSubPart
            ? CAMERA_PRESETS.padlock.offset
            : new THREE.Vector3(0, 0, 0.8);

        ctx.zoomTo(worldPos, zoomLevel, null, offset);
        applyPresetAngles(ctx.controls, CAMERA_PRESETS.padlock);
    }
}
