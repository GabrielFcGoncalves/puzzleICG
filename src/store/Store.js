import * as THREE from 'three';
import { InteractionState } from './InteractionState.js';
import { CameraState } from './CameraState.js';
import { PuzzleState } from './PuzzleState.js';
import { UIState } from './UIState.js';


export class GameStore {
    constructor() {
        this.interaction = new InteractionState();
        this.camera = new CameraState();
        this.puzzle = new PuzzleState();
        this.ui = new UIState();
        this.placedGems = 0;

        // References to objects that will be set during initialization
        this.cameraRef = null;
        this.scene = null;
        this.renderer = null;
        this.controls = null;
        this.cabinet = null;
        this.uiManager = null;
    }

    init(camera, scene, renderer, controls, cabinet, uiManager) {
        this.cameraRef = camera;
        this.scene = scene;
        this.renderer = renderer;
        this.controls = controls;
        this.cabinet = cabinet;
        this.uiManager = uiManager;
    }

    pickupItem = async (itemGroup) => {
        const item = itemGroup.userData.itemInstance;
        const name = item.name || 'Unknown Item';
        console.log(`Picked up: ${name}`);
        const thumbnail = await item.getThumbnail();

        this.ui.inventory.push({ name, thumbnail, instance: item });

        // Remove from the scene
        if (item.group && item.group.parent) {
            item.group.parent.remove(item.group);
        } else if (itemGroup.parent) {
            itemGroup.parent.remove(itemGroup);
        }

        // Update UI
        if (this.uiManager) {
            this.uiManager.updateInventory(this.ui.inventory);
            this.uiManager.setStatus(`Picked up: ${name.toUpperCase()}`);
        }
    }

    zoomTo(targetPos, zoomLevel = 1.5, lookAtPos = null, camOffset = new THREE.Vector3(0, 0.8, 1)) {
        this.camera.isTransitioning = true;
        this.camera.targetFocus.copy(lookAtPos || targetPos);

        const transformedOffset = camOffset.clone().applyQuaternion(this.cabinet.group.quaternion);
        const dir = transformedOffset.normalize();
        this.camera.cameraFocus.copy(targetPos).add(dir.multiplyScalar(zoomLevel));
    }

    resetZoom() {
        this.camera.isTransitioning = true;
        this.camera.targetFocus.set(0, 0, 0);
        this.camera.cameraFocus.set(3, 2, 3.5);
        this.camera.isZoomedOnFoot = false;
        this.camera.isZoomedOnPadlock = false;
        this.camera.camClampingDisabled = false;
        this.puzzle.showBirdInFocus = false;

        if (this.controls) {
            this.controls.enablePan = false;
            this.controls.minAzimuthAngle = -Infinity;
            this.controls.maxAzimuthAngle = Infinity;
            this.controls.minPolarAngle = 0;
            this.controls.maxPolarAngle = Math.PI * 0.6;
            this.controls.maxDistance = 20;
        }
    }

    openInspection(itemData) {
        this.ui.isInspecting = true;
        if (this.uiManager) this.uiManager.showInspection();
    }

    closeInspection() {
        this.ui.isInspecting = false;
        if (this.uiManager) this.uiManager.hideInspection();
    }

    detachCamera() {
        this.camera.isTransitioning = false;
        this.camera.camClampingDisabled = true;
        if (this.controls) {
            this.controls.enablePan = true;
            this.controls.screenSpacePanning = true;
            this.controls.minAzimuthAngle = -Infinity;
            this.controls.maxAzimuthAngle = Infinity;
            this.controls.minPolarAngle = 0;
            this.controls.maxPolarAngle = Math.PI;
            this.controls.maxDistance = 100;
        }

        if (this.uiManager) this.uiManager.setStatus("Camera Detached - Free Fly Mode");
    }
}

export const store = new GameStore();
