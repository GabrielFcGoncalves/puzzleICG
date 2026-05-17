import * as THREE from 'three';
import { createAmbientLight } from './lights/AmbientLight.js';
import { createDeskLight } from './lights/DeskLight.js';
import { createLampLight } from './lights/LampLight.js';
import { createLeftLight } from './lights/LeftLight.js';
import { createCameraFlashlight } from './lights/CameraFlashlight.js';
import { createDoorLight } from './lights/DoorLight.js';
import { WallChandelier } from './lights/WallChandelier.js';
import { Room } from '../objects/room/Room.js';
import { Cabinet } from '../objects/cabinet/Cabinet.js';
import { Stand } from '../objects/Stand.js';
import { PuzzleBox } from '../objects/PuzzleBox.js';
import { Flashlight } from '../objects/Flashlight.js';
import { Door } from '../objects/Door.js';
import { Paper } from '../objects/Paper.js';
import { TableLamp } from '../objects/TableLamp.js';
import { Pen } from '../objects/Pen.js';
import { MetalPlatting } from '../objects/MetalPlatting.js';
import { ModelLoader } from '../utils/ModelLoader.js';
import { MetalWeight } from '../objects/MetalWeight.js';
import { SnakeItem } from '../objects/SnakeItem.js';
import { GemItem } from '../objects/GemItem.js';

export class MainScene {
    constructor(camera, loadingManager, world) {
        this.scene = new THREE.Scene();
        this.camera = camera;
        this.loadingManager = loadingManager || new THREE.LoadingManager();
        this.world = world;
        this.modelLoader = new ModelLoader(this.loadingManager);
        this.objects = {};
        this.lights = {};
        this.birdProxy = new THREE.Group();

        this.init();
    }

    init() {
        this.scene.add(this.camera);

        // --- Lights ---
        this.lights.ambient = createAmbientLight();
        this.scene.add(this.lights.ambient);

        this.lights.desk = createDeskLight(this.scene);
        this.scene.add(this.lights.desk);

        this.lights.lamp = createLampLight();
        this.scene.add(this.lights.lamp);

        this.lights.left = createLeftLight();
        this.scene.add(this.lights.left);

        this.lights.cameraFlashlight = createCameraFlashlight(this.camera);

        // --- Wall Chandeliers ---

        this.lights.chanLeft = new WallChandelier(this.scene, this.loadingManager);
        this.lights.chanLeft.setPosition(-4.9, 1.5, -1);
        this.lights.chanLeft.setRotation(Math.PI / 2);

        this.lights.chanBack = new WallChandelier(this.scene, this.loadingManager);
        this.lights.chanBack.setPosition(0, 2, -4.9);

        this.lights.door = createDoorLight();
        this.scene.add(this.lights.door);

        // --- Table Lamp ---
        this.objects.tableLamp = new TableLamp(this.scene, this.loadingManager);
        this.objects.tableLamp.setPosition(4.22, -0.4, 0.7); 

        // --- Pen ---
        this.objects.pen = new Pen(this.scene, this.loadingManager);
        this.objects.pen.setPosition(4.1, -0.38, 1.2); 

        // --- Objects ---
        // --- Objects (Deferred Loading) ---
        this.objects.room = new Room(this.scene, this.loadingManager);
        
        this.objects.cabinet = new Cabinet(this.scene, this.loadingManager, this.world);
        this.objects.cabinet.group.position.z = -3.5;
        this.objects.cabinet.group.updateMatrix();
        this.objects.cabinet.group.matrixAutoUpdate = false;
        // The cabinet box (body) is also static
        this.objects.cabinet.box.updateMatrix();
        this.objects.cabinet.box.matrixAutoUpdate = false;

        this.objects.stand = new Stand(this.scene, this.loadingManager);
        this.objects.stand.setPosition(-1.1, 0.07, 0);
        this.objects.stand.group.scale.set(1.5, 1.5, 1.5);
        this.objects.stand.group.updateMatrix();
        this.objects.stand.group.matrixAutoUpdate = false;

        // --- Door ---
        this.objects.door = new Door(this.scene, this.loadingManager);
        this.objects.door.setPosition(0, -1.7, 5.05); 
        this.objects.door.setRotation(0, Math.PI, 0);
        this.objects.door.group.updateMatrix();
        this.objects.door.group.matrixAutoUpdate = false;
        
        // --- Paper Note ---
        this.objects.paper = new Paper("47---", "Mysterious Note");
        // Mahogany table is at x=4.22, y=-1.7 (base), z=1. Estimated top height is ~0.75m from floor.
        // Floor is at -1.7, so -1.7 + 0.75 = -0.95
        this.objects.paper.setPosition(4.22, -0.4, 1.0); 
        this.objects.paper.setRotation(-Math.PI / 2, 0, -Math.PI / 2); 
        this.scene.add(this.objects.paper.group);

        // --- Metal Platting Above Door ---
        this.objects.metalPlatting = new MetalPlatting(this.scene, this.loadingManager);
        this.objects.metalPlatting.setPosition(0, 2.2, 4.97); 
        this.objects.metalPlatting.setRotation(0, Math.PI, 0);

        // --- Puzzle Box (preloaded, starts inside the bottom drawer) ---
        this.objects.pBox = new PuzzleBox(this.scene, this.loadingManager);
        this.objects.cabinet.drawerGroups[0].add(this.objects.pBox.group);
        this.objects.pBox.setPosition(1.2, -2.3, -2.31);
        this.objects.pBox.group.scale.set(1.75, 1.75, 1.75);

        // --- Flashlight (preloaded, next to the puzzle box) ---
        this.objects.flashlightObj = new Flashlight(this.loadingManager);
        this.objects.flashlightObj.group.rotation.y = Math.PI / 2;
        this.objects.flashlightObj.group.scale.set(1.1, 1.1, 1.1);
        this.objects.flashlightObj.setPosition(0.3, 0.4, -0.4);
        this.objects.cabinet.drawerGroups[0].add(this.objects.flashlightObj.group);

        // --- Snake Statue (starts inside the bottom drawer) ---
        this.objects.snakeItem = new SnakeItem(this.loadingManager);
        this.objects.snakeItem.setPosition(0, -0.26, 0); // Raised to match new bottom
        this.objects.cabinet.drawerGroups[1].add(this.objects.snakeItem.group);

        // --- Metal Weights ---
        // 1. Two on the small table (moved more to the right/forward by Z)
        const weight1 = new MetalWeight(100);
        weight1.setPosition(4.1, -0.4, 1.9);
        this.scene.add(weight1.group);

        const weight2 = new MetalWeight(50);
        weight2.setPosition(4.3, -0.4, 2.1);
        this.scene.add(weight2.group);

        // 2. One on the puzzle box scale (added as child so it moves with it)
        const weight3 = new MetalWeight(200);
        weight3.setPosition(-0.55, 0.74, 1.08); // On top of the box
        weight3.group.scale.setScalar(1 / 1.75); // Counteract parent scale
        this.objects.pBox.group.add(weight3.group);

        // 3. One behind the statue
        const weight4 = new MetalWeight(500);
        weight4.setPosition(-4.6, -1.4, -5.2);
        this.scene.add(weight4.group);

        // 4. One below the pedestal in the middle of the room
        const weight5 = new MetalWeight(20);
        weight5.setPosition(0.8, -1.7, 0.5); // Near the base of the center table
        this.scene.add(weight5.group);

        // --- Red Gem ---
        this.objects.redGem = new GemItem(this.loadingManager);
        this.objects.redGem.setPosition(0.4, -0.33, -0.1);
        this.objects.cabinet.drawerGroups[1].add(this.objects.redGem.group);

        // --- Green Gem ---
        this.objects.greenGem = new GemItem(this.loadingManager, 0x00ff00);
        this.objects.greenGem.setPosition(-0.74, 0.8, 0.9); // Bottom middle of puzzle box
        this.objects.greenGem.group.scale.setScalar(1 / 1.75); // Counteract parent scale
        this.objects.pBox.group.add(this.objects.greenGem.group);

        // --- Bird Proxy (Deferred) ---
        this.scene.add(this.birdProxy);

        // --- Hint Arrow ---
        const arrowDir = new THREE.Vector3(0, 0, -1);
        const arrowOrigin = new THREE.Vector3(0, -1.69, -2.5);
        this.objects.hintArrow = new THREE.ArrowHelper(arrowDir, arrowOrigin, 0.5, 0x00ff00, 0.15, 0.1);
        this.scene.add(this.objects.hintArrow);

        this.enableShadows(this.scene);
    }

    /**
     * Lazy loads items inside the Vault (Drawer 0) - objects now preloaded, just enable shadows
     */
    loadVaultItems() {
        if (this._vaultShadowsEnabled) return;
        this._vaultShadowsEnabled = true;
        this.enableShadows(this.objects.cabinet.drawerGroups[0]);
    }

    /**
     * Lazy loads items inside the Secret Square compartment
     */
    async loadSecretItems() {
        if (this.objects.ironBird) return;

        console.log("LAZY LOADING SECRET ITEMS...");
        
        const { BirdItem } = await import('../objects/BirdItem.js');
        this.objects.ironBird = new BirdItem(this.loadingManager);
        this.objects.ironBird.setPosition(5.8, 1.1, 1.9); 
        this.objects.ironBird.group.rotation.y = Math.PI / 2; 
        this.scene.add(this.objects.ironBird.group);

        this.enableShadows(this.objects.ironBird.group);
    }

    async loadBirdProxy() {
        const path = new URL('../models/bird.glb', import.meta.url).href;
        try {
            const gltf = await this.modelLoader.load(path, {
                cloneMaterials: true,
                transparent: true,
                opacity: 0.8
            });
            const bird = gltf.scene;
            bird.scale.set(1.3, 1.3, 1.3);
            bird.rotation.y = Math.PI / 2;
            
            const box = new THREE.Box3().setFromObject(bird);
            const center = new THREE.Vector3();
            box.getCenter(center);
            center.add(new THREE.Vector3(0, 0.5, 0));
            bird.position.sub(center);
            
            this.birdProxy.add(bird);
            this.birdProxy.visible = false;

            // Trigger complete shadow refresh after bird proxy is loaded
            this.refreshShadows();

            // Initial scrambled rotation (Hardcoded)
            this.birdProxy.rotation.x = 0.4;
            this.birdProxy.rotation.y = 1.2;
        } catch (error) {
            console.error('Error loading bird proxy:', error);
        }
    }

    /**
     * Re-calculates shadows for all meshes and triggers a one-time update 
     * for lights with static shadow maps (autoUpdate = false).
     */
    refreshShadows() {
        this.enableShadows(this.scene);
        
        // Trigger one-time update for "baked" lights
        Object.values(this.lights).forEach(light => {
            if (light?.shadow) {
                light.shadow.needsUpdate = true;
            }
        });

    }



    enableShadows(obj) {
        obj.traverse(node => {
            if (node.isMesh) {
                if (node.userData.noShadow) {
                    node.castShadow = false;
                    node.receiveShadow = false;
                    return;
                }
                 if (node.material && (node.material.opacity === undefined || node.material.opacity > 0)) {
                    const isRoomPart = node.userData.isRoomPart || node.parent?.userData.isRoomPart;
                    const isSmallProp = node.userData.isSmallProp || node.parent?.userData.isSmallProp;

                    if (isRoomPart) {
                        node.castShadow = false;
                        node.receiveShadow = true;
                    } else if (isSmallProp) {
                        node.castShadow = true;
                        node.receiveShadow = false;
                    } else {
                        node.castShadow = true;
                        node.receiveShadow = true;
                    }
                } else {
                     node.castShadow = false;
                     node.receiveShadow = false;
                }
            }
        });
    }

    update(delta) {
        this.lights.chanLeft.update();
        this.lights.chanBack.update();
        if (this.objects.pBox) {
            this.objects.pBox.update(delta);
        }
        
        if (this.objects.hintArrow) {
            this.objects.hintArrow.visible = this.world.uiState.isEthereal;
        }
    }

}
