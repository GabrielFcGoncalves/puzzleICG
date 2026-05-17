import * as THREE from 'three';

// Enable global Three.js caching for all loaders (TextureLoader, GLTFLoader, etc.)
THREE.Cache.enabled = true;

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

import { createRenderer, handleResize as rendererResize } from '../systems/Renderer.js';
import { MainScene } from '../scenes/MainScene.js';
import { InspectionScene } from '../scenes/InspectionScene.js';
import { AnimationSystem } from '../systems/AnimationSystem.js';
import { store } from '../store/Store.js';
import { UIManager } from '../utils/UI.js';
import { InputSystem } from '../systems/InputSystem.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import * as CANNON from 'cannon-es';

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
        this.controls.target.set(0, 1.0, 0);
        this.controls.update();

        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);

        this.uiManager = new UIManager(this);
        
        // --- Physics System ---
        this.physicsSystem = new PhysicsSystem();
        this.addPhysicsGround();
        
        // --- Loading Management ---
        const loaderBar = document.getElementById('loader-bar');
        const loaderText = document.getElementById('loader-text');
        const loaderScreen = document.getElementById('loading-screen');
        
        this.loadingManager = new THREE.LoadingManager();
        this.mainScene = new MainScene(this.camera, this.loadingManager, this);

        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const p = (itemsLoaded / itemsTotal) * 100;
            if (loaderBar) loaderBar.style.width = `${p}%`;
            if (loaderText) loaderText.innerText = `${Math.round(p)}% - LOADING ${url.split('/').pop()}`;
        };
        this.loadingManager.onLoad = () => {
            // Trigger a final shadow refresh once everything is loaded
            this.mainScene.refreshShadows();
            
            setTimeout(() => {
                if (loaderScreen) loaderScreen.classList.add('loading-finished');
            }, 500);
        };

        // Initialize Animation System and other scenes
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
        this.store.ui.draggedInventoryIndex = index;
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

    // Proxy methods for store actions with arrow functions to maintain scope
    zoomTo = (...args) => { this.store.zoomTo(...args); }
    resetZoom = (...args) => { this.store.resetZoom(...args); }
    pickupItem = (...args) => { this.store.pickupItem(...args); }
    detachCamera = (...args) => { this.store.detachCamera(...args); }
    handleResize = (...args) => { rendererResize(...args); }

    // --- State slice accessors for listeners ---
    // Listeners destructure these from the context (ctx) object.
    get interaction() { return this.store.interaction; }
    get cameraState() { return this.store.camera; }
    get puzzle() { return this.store.puzzle; }
    get uiState() { return this.store.ui; }

    // Helper accessors for objects
    get cabinet() { return this.mainScene.objects.cabinet; }
    get scene() { return this.mainScene.scene; }
    get birdProxy() { return this.mainScene.birdProxy; }
    get puzzleBox() { return this.mainScene.objects.pBox; }
    get statusElement() { return this.uiManager.statusElement; }
    get overlayElement() { return this.uiManager.overlayElement; }

    getHandles() {
        const handles = [];
        this.cabinet.drawerGroups.forEach(dg => {
            dg.traverse(child => {
                if (child.userData.drawerIndex !== undefined && !child.userData.isStaticPuzzlePart) {
                    handles.push(child);
                }
            });
        });

        // Add door handle
        const door = this.mainScene?.objects?.door;
        if (door && door.doorHandle) {
            door.doorHandle.traverse(child => {
                if (child.userData.isDoorHandle) {
                    handles.push(child);
                }
            });
        }

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

    addPhysicsGround() {
        const groundBody = new CANNON.Body({
            mass: 0, // static
            shape: new CANNON.Plane(),
            type: CANNON.Body.STATIC
        });
        // Rotate to be horizontal
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        // Position at room floor level (MainScene says room is at -1.7 y)
        groundBody.position.set(0, -1.7, 0);
        this.physicsSystem.physicsWorld.addBody(groundBody);

        // Add static body for the cabinet
        // W=2, H=3, D=1.2. H is total height, cabinet is centered on its local origin usually.
        // Wait, CabinetBody.js shows box is at y = H/2 - 0.1? No, let's check CabinetBody.js.
        const cabinetBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Box(new CANNON.Vec3(1, 1.5, 0.6)), // Half-extents
            type: CANNON.Body.STATIC
        });
        // MainScene: cabinet at z=-3.5. Floor at -1.7. 
        // If H=3, bottom of body is at -1.5. Feet are at -1.6.
        // If feet at -1.6 touch floor at -1.7, local origin is at -0.1 world Y.
        cabinetBody.position.set(0, -0.1, -3.5);
        this.physicsSystem.physicsWorld.addBody(cabinetBody);
    }
}
