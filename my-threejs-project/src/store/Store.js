import * as THREE from 'three';

/**
 * Store class manages the game state and logic related to picking up items, zooming, and transitions.
 */
export class GameStore {
    constructor() {
        this.state = {
            isEthereal: false,
            isDragging: false,
            isRotatingFooting: false,
            draggedDrawerIndex: -1,
            rotatedFooting: null,
            isTransitioning: false,
            targetFocus: new THREE.Vector3(0, 0, 0),
            cameraFocus: new THREE.Vector3(3, 2, 4),
            inventory: [],
            draggedInventoryIndex: -1,
            isHintMode: false,
            isInspecting: false,
            isZoomedOnFoot: false,
            isTurningKey: false,
            isMovingPuzzleBox: false,
            isBoxOnPedestal: false,
            camClampingDisabled: false,
            shadowNeedsRefresh: true,
            pBoxTargetPos: new THREE.Vector3(0, 0, 0),
            showBirdInFocus: false,
            fHelper: null,
            isDraggingBird: false,
            isBirdPuzzleSolved: false,
            isSecretSquareTriggered: false,
            isZoomedOnPadlock: false,
        };
        
        // References to objects that will be set during initialization
        this.camera = null;
        this.scene = null;
        this.renderer = null;
        this.controls = null;
        this.cabinet = null;
        this.uiManager = null;
    }

    init(camera, scene, renderer, controls, cabinet, uiManager) {
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;
        this.controls = controls;
        this.cabinet = cabinet;
        this.uiManager = uiManager;
    }

    pickupItem = async (itemGroup) => {
        const item = itemGroup.userData.itemInstance;
        const name = item.name || 'Unknown Item';
        const thumbnail = await item.getThumbnail();

        this.state.inventory.push({ name, thumbnail, instance: item });

        // Remove from the scene
        if (itemGroup.parent) {
            itemGroup.parent.remove(itemGroup);
        }

        // Update UI
        if (this.uiManager) {
            this.uiManager.updateInventory(this.state.inventory);
            this.uiManager.setStatus(`Picked up: ${name.toUpperCase()}`);
        }

        this.resetZoom();
    }

    zoomTo(targetPos, zoomLevel = 1.5, lookAtPos = null, camOffset = new THREE.Vector3(0, 0.8, 1)) {
        this.state.isTransitioning = true;
        this.state.targetFocus.copy(lookAtPos || targetPos);
        
        const transformedOffset = camOffset.clone().applyQuaternion(this.cabinet.group.quaternion);
        const dir = transformedOffset.normalize();
        this.state.cameraFocus.copy(targetPos).add(dir.multiplyScalar(zoomLevel));
    }

    resetZoom() {
        this.state.isTransitioning = true;
        this.state.targetFocus.set(0, 0, 0);
        this.state.cameraFocus.set(3, 2, 4);
        this.state.isZoomedOnFoot = false;
        this.state.isZoomedOnPadlock = false;
        this.state.camClampingDisabled = false;
        this.state.showBirdInFocus = false;

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
        // ... handled by InspectionScene logic, but it'll need state update
        this.state.isInspecting = true;
        if (this.uiManager) this.uiManager.showInspection();
    }

    closeInspection() {
        this.state.isInspecting = false;
        if (this.uiManager) this.uiManager.hideInspection();
    }

    detachCamera() {
        this.state.isTransitioning = false;
        this.state.camClampingDisabled = true;
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
