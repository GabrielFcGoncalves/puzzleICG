import * as THREE from 'three';
import { createAmbientLight } from './lights/AmbientLight.js';
import { createDeskLight } from './lights/DeskLight.js';
import { createLampLight } from './lights/LampLight.js';
import { createLeftLight } from './lights/LeftLight.js';
import { createCameraFlashlight } from './lights/CameraFlashlight.js';
import { WallChandelier } from './lights/WallChandelier.js';
import { Room } from '../objects/Room.js';
import { Cabinet } from '../objects/Cabinet.js';
import { Stand } from '../objects/Stand.js';
import { PuzzleBox } from '../objects/PuzzleBox.js';
import { Flashlight } from '../objects/Flashlight.js';
import { ModelLoader } from '../utils/ModelLoader.js';

export class MainScene {
    constructor(camera, loadingManager) {
        this.scene = new THREE.Scene();
        this.camera = camera;
        this.loadingManager = loadingManager || new THREE.LoadingManager();
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
        this.lights.chanRight = new WallChandelier(this.scene, this.loadingManager);
        this.lights.chanRight.setPosition(4.9, 1.5, 1);
        this.lights.chanRight.setRotation(-Math.PI / 2);

        this.lights.chanLeft = new WallChandelier(this.scene, this.loadingManager);
        this.lights.chanLeft.setPosition(-4.9, 1.5, -1);
        this.lights.chanLeft.setRotation(Math.PI / 2);

        this.lights.chanBack = new WallChandelier(this.scene, this.loadingManager);
        this.lights.chanBack.setPosition(0, 2, -4.9);

        // --- Objects ---
        this.objects.room = new Room(this.scene, this.loadingManager);
        
        this.objects.cabinet = new Cabinet(this.scene, this.loadingManager);
        this.objects.cabinet.group.position.z = -3.5;

        this.objects.pBox = new PuzzleBox(this.scene, this.loadingManager);
        this.objects.cabinet.drawerGroups[0].add(this.objects.pBox.group);
        this.objects.pBox.setPosition(0, -0.9, -0.4);
        this.objects.pBox.group.scale.set(1.2, 1.2, 1.2);

        this.objects.stand = new Stand(this.scene, this.loadingManager);
        this.objects.stand.setPosition(-1.1, 0.07, 0);
        this.objects.stand.group.scale.set(1.5, 1.5, 1.5);

        this.objects.flashlightObj = new Flashlight(this.loadingManager);
        this.objects.flashlightObj.group.rotation.y = Math.PI / 2;
        this.objects.flashlightObj.group.scale.set(1.1, 1.1, 1.1);
        this.objects.flashlightObj.setPosition(0.3, 0.4, -0.4);
        this.objects.cabinet.drawerGroups[0].add(this.objects.flashlightObj.group);

        // --- Bird Proxy ---
        this.scene.add(this.birdProxy);
        this.loadBirdProxy();

        this.enableShadows(this.scene);
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
            
            // Initial scrambled rotation (Hardcoded)
            this.birdProxy.rotation.x = 0.4;
            this.birdProxy.rotation.y = 1.2;
        } catch (error) {
            console.error('Error loading bird proxy:', error);
        }
    }

    enableShadows(obj) {
        obj.traverse(node => {
            if (node.isMesh) {
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

    update() {
        this.lights.chanRight.update();
        this.lights.chanLeft.update();
        this.lights.chanBack.update();
    }
}
