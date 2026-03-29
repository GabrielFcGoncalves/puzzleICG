import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

import { createRenderer, handleResize as rendererResize } from '../systems/Renderer.js';
import { MainScene } from '../scenes/MainScene.js';
import { InspectionScene } from '../scenes/InspectionScene.js';
import { AnimationSystem } from '../systems/AnimationSystem.js';
import { store } from '../store/Store.js';
import { UIManager } from '../utils/UI.js';
import { InputSystem } from '../systems/InputSystem.js';

/**
 * World class acts as the central hub for the application.
 * It initializes all core components and orchestrates the game loop.
 */
export class World {
    constructor() {
        this.store = store;
        this.renderer = createRenderer();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(3, 2, 4);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enablePan = false;
        this.controls.maxPolarAngle = Math.PI * 0.6;

        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);

        this.uiManager = new UIManager(this);
        
        // Initialize Scene and Animation System
        this.mainScene = new MainScene(this.camera);
        this.inspectionScene = new InspectionScene(this.renderer);
        this.animationSystem = new AnimationSystem(this);

        // Share references with Store
        this.store.init(
            this.camera,
            this.mainScene.scene,
            this.renderer,
            this.controls,
            this.mainScene.objects.cabinet,
            this.uiManager
        );

        // Shared raycaster for input
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.intersectionPoint = new THREE.Vector3();
        this.offset = new THREE.Vector3();

        // Initialize Input System last
        this.inputSystem = new InputSystem(this);

        this.init();
    }

    init() {
        this.animationSystem.start();
    }

    startDraggingInventory(index, imgHTML, x, y) {
        this.store.state.draggedInventoryIndex = index;
        this.uiManager.showDragOverlay(imgHTML, x, y);
        this.uiManager.slots[index].style.opacity = '0.3';
    }

    openInspection(itemData) {
        this.inspectionScene.open(itemData);
        this.store.openInspection(itemData);
    }

    closeInspection() {
        this.store.closeInspection();
    }

    // Proxy methods for store/state actions with arrow functions to maintain scope
    zoomTo = (...args) => { this.store.zoomTo(...args); }
    resetZoom = (...args) => { this.store.resetZoom(...args); }
    pickupItem = (...args) => { this.store.pickupItem(...args); }
    detachCamera = (...args) => { this.store.detachCamera(...args); }
    handleResize = (...args) => { rendererResize(...args); }

    // Helper functions for listeners to access objects
    get cabinet() { return this.mainScene.objects.cabinet; }
    get scene() { return this.mainScene.scene; }
    get birdProxy() { return this.mainScene.birdProxy; }
    get puzzleBox() { return this.mainScene.objects.pBox; }
    get state() { return this.store.state; }
    get statusElement() { return this.uiManager.statusElement; }

    getHandles() {
        const handles = [];
        this.cabinet.drawerGroups.forEach(dg => {
            dg.traverse(child => {
                if (child.userData.drawerIndex !== undefined && !child.userData.isStaticPuzzlePart) {
                    handles.push(child);
                }
            });
        });
        return handles;
    }

    getStaticPuzzleParts() {
        const parts = [];
        this.scene.traverse(child => {
            if (child.userData.isStaticPuzzlePart) parts.push(child);
        });
        return parts;
    }

    getItems() {
        const items = [];
        this.scene.traverse(child => {
            if (child.userData.isItem) items.push(child);
        });
        return items;
    }
}
