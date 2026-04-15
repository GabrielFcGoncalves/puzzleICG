import * as THREE from 'three';
import { DoubleClickHandler } from './DoubleClickHandler.js';

export class FootingHandler extends DoubleClickHandler {
    match(target) {
        return target.userData.isRotatable || target.userData.isFooting;
    }

    handle(target, worldPos, ctx) {
        ctx.cameraState.isZoomedOnFoot = true;

        if (target.userData.isRotatable) {
            this.zoomWithPreset(ctx, worldPos, 'foot');
        } else {
            ctx.zoomTo(worldPos, 1.0, null, new THREE.Vector3(0, 0.5, 1));
        }
    }
}
