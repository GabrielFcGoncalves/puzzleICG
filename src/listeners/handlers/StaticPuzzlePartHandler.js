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
            const lookAt = worldPos.clone().add(new THREE.Vector3(0, 0.2, 0));
            ctx.zoomTo(worldPos, 0.5, lookAt, new THREE.Vector3(0, 0.3, 0.5));
            applyPresetAngles(ctx.controls, CAMERA_PRESETS.free);
            return;
        }
        if (target.userData.isDoor) {
            this._handleDoor(worldPos, ctx);
            return;
        }
        if (target.userData.isLock) {
            ctx.zoomTo(worldPos, 0.8, null, new THREE.Vector3(0, 0.2, 0.6));
            return;
        }
        if (target.userData.isMetalPlatting) {
            ctx.zoomTo(worldPos, 0.5, worldPos, new THREE.Vector3(0, 0.2, 0.6));
            return;
        }
        if (target.userData.isPaper) {
            // High-precision zoom for reading paper
            const lookAt = worldPos.clone();
            ctx.zoomTo(worldPos, 0.7, lookAt, new THREE.Vector3(-1, 1, 0));
            return;
        }
        if (target.userData.isSmallTable) {
            // Zoom to the table surface
            const surfacePos = worldPos.clone().add(new THREE.Vector3(0, 1.3, 0)); 
            ctx.zoomTo(surfacePos, 1.2, surfacePos, new THREE.Vector3(-1.2, 0.8, 0));
            return;
        }
        if (target.userData.isWallHole || target.userData.isWallHoleInterior) {
            // Zoom into the recess behind the angel statue — camera moves in front of hole
            const holeCenter = new THREE.Vector3(-4.2, -0.2, -4.65);
            ctx.zoomTo(holeCenter, 1.2, holeCenter, new THREE.Vector3(0, 0, 1.5));

            ctx.controls.minAzimuthAngle = -Math.PI / 6;
            ctx.controls.maxAzimuthAngle =  Math.PI / 6;
            ctx.controls.minPolarAngle = Math.PI * 0.35;
            ctx.controls.maxPolarAngle = Math.PI * 0.65;
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
        const lookAt = worldPos.clone().add(new THREE.Vector3(0, 1, 0));
        ctx.zoomTo(worldPos, 2, lookAt, new THREE.Vector3(1, 2, 2));
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

    _handleDoor(worldPos, ctx) {
        const targetPos = new THREE.Vector3().copy(worldPos);
        targetPos.y = 0; 
        targetPos.x += 0.8; // Shift focus to the left
        ctx.zoomTo(targetPos, CAMERA_PRESETS.door.zoomLevel, null, CAMERA_PRESETS.door.offset);
        applyPresetAngles(ctx.controls, CAMERA_PRESETS.door);
    }
}
