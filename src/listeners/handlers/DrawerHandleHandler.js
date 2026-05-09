import * as THREE from 'three';
import { DoubleClickHandler } from './DoubleClickHandler.js';
import { CAMERA_PRESETS } from './Constants.js';
import { applyPresetAngles } from './Utils.js';

export class DrawerHandleHandler extends DoubleClickHandler {
    match(target) {
        return target.userData.drawerIndex !== undefined &&
               !target.userData.isStaticPuzzlePart;
    }

    handle(target, worldPos, ctx) {
        ctx.cameraState.isZoomedOnFoot = false;
        
        let preset = 'drawer';
        let targetPos = worldPos;
        let lookAtPos = null;

        if (target.userData.isDrawerInside) {
            preset = 'drawerInside';
            // Hardcode to drawer center
            const dGroup = ctx.cabinet.drawerGroups[target.userData.drawerIndex];
            targetPos = new THREE.Vector3();
            dGroup.getWorldPosition(targetPos);
            lookAtPos = targetPos.clone();
        } else if (target.userData.drawerIndex === 1) {
            preset = 'bottomDrawer';
        }
        
        const presetData = CAMERA_PRESETS[preset];
        ctx.zoomTo(targetPos, presetData.zoomLevel, lookAtPos, presetData.offset);
        applyPresetAngles(ctx.controls, presetData);
    }
}
