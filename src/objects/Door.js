import * as THREE from 'three';
import { ModelLoader } from '../utils/ModelLoader.js';

export class Door {
    constructor(scene, loadingManager) {
        this.scene = scene;
        this.loadingManager = loadingManager;
        this.modelLoader = new ModelLoader(this.loadingManager);
        this.group = new THREE.Group();
        this.init();
    }

    async init() {
        const path = new URL('../models/door/scene.gltf', import.meta.url).href;
        try {
            const gltf = await this.modelLoader.load(path);
            this.model = gltf.scene;

            const secondDoor = this.model.getObjectByName('01_1');
            if (secondDoor) {
                secondDoor.parent.remove(secondDoor);
            }

            this.model.traverse(node => {
                if (node.isMesh) {
                    node.userData.isStaticPuzzlePart = true;
                    node.userData.isDoor = true;
                }
                
                if (node.name === 'door') {
                    this.doorMesh = node;
                }
                if (node.name === 'handel') {
                    this.doorHandle = node;
                    // Ensure the handle is interactive and tagged for dragging
                    node.traverse(c => {
                        if (c.isMesh) {
                            c.userData.isDoorHandle = true;
                        }
                    });
                }
            });
            
            // Adjust scale
            let scale = 0.015;
            this.model.scale.set(scale, scale, scale); 
            
            this.group.add(this.model);
            this.scene.add(this.group);
        } catch (error) {
            console.error('Error loading door model:', error);
        }
    }

    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }

    setRotation(x, y, z) {
        this.group.rotation.set(x, y, z);
    }
}
