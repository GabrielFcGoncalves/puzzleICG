import * as THREE from 'three';
import { DoubleClickHandler } from './DoubleClickHandler.js';
import { CAMERA_PRESETS, INTERACTION_RANGES } from './Constants.js';
import { applyPresetAngles } from './Utils.js';

export class StaticPuzzlePartHandler extends DoubleClickHandler {
    match(target) {
        return target.userData.isStaticPuzzlePart;
    }

    handle(target, worldPos, ctx) {
        const { camera, uiState, puzzle, cameraState } = ctx;

        cameraState.isZoomedOnFoot = false;

        if (target.userData.isPainting) {
            this._handlePainting(target, worldPos, ctx, uiState, puzzle);
            return;
        }
        if (target.userData.isStand) {
            this._handleStand(worldPos, ctx);
            return;
        }
        if (target.userData.isSecretSquare) {
            this._handleSecretSquare(camera, worldPos, ctx, puzzle);
            return;
        }
        if (target.userData.isMountedFlashlight) {
            ctx.zoomTo(worldPos, 0.5, null, new THREE.Vector3(0, 0.3, 0.5));
            applyPresetAngles(ctx.controls, CAMERA_PRESETS.free);
            return;
        }
        if (target.userData.isLock) {
            ctx.zoomTo(worldPos, 0.8, null, new THREE.Vector3(0, 0.2, 0.6));
            return;
        }

        // Default: generic zoom
        worldPos.add(new THREE.Vector3(0, 2, 0));
        ctx.zoomTo(worldPos, 4.0, null, new THREE.Vector3(0, 1.2, 1.2));
    }

    _handlePainting(target, worldPos, ctx, uiState, puzzle) {
        const hasBird = uiState.inventory.some(i =>
            i.name.toLowerCase().includes('bird')
        );

        if (hasBird) {
            puzzle.showBirdInFocus = true;
            console.log("ALIGNMENT TRIGGERED: Iron Bird found in inventory.");
        }

        const rotY = target.rotation.y;
        const isFacingXAxis =
            Math.abs(rotY - Math.PI / 2) < 0.1 ||
            Math.abs(rotY + Math.PI / 2) < 0.1;

        const offset = isFacingXAxis
            ? new THREE.Vector3(1, 0, 0)
            : new THREE.Vector3(0, 0, 1);

        ctx.zoomTo(worldPos, CAMERA_PRESETS.painting.zoomLevel, null, offset);
    }

    _handleStand(worldPos, ctx) {
        ctx.zoomTo(worldPos, 1.0, null, new THREE.Vector3(0, 0.4, 0.8));
        ctx.controls.minAzimuthAngle = -Infinity;
        ctx.controls.maxAzimuthAngle = Infinity;
    }

    _handleSecretSquare(camera, worldPos, ctx, puzzle) {
        if (this.isWithinRange(camera.position, worldPos, INTERACTION_RANGES.secretSquare)) {
            puzzle.isSecretSquareTriggered = true;
        } else {
            ctx.zoomTo(worldPos, 0.8, null, new THREE.Vector3(-0.6, 0, 0));
        }
    }
}
