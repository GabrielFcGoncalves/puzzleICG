import * as THREE from 'three';
import { ModelLoader } from '../../utils/ModelLoader.js';

export class WallChandelier {
    constructor(scene, loadingManager) {
        this.scene = scene;
        this.loadingManager = loadingManager;
        this.modelLoader = new ModelLoader(this.loadingManager);
        this.group = new THREE.Group();
        this.init();
    }

    async init() {
        const lampPath = new URL('../../models/wall_lamp/scene.gltf', import.meta.url).href;
        
        try {
            const gltf = await this.modelLoader.load(lampPath);
            const lampModel = gltf.scene;
            
            // Adjust position and rotation to align with the wall properly
            lampModel.rotation.y = Math.PI; // Face the right way
            lampModel.scale.set(0.02, 0.02, 0.02); // Balanced scale
            
            this.group.add(lampModel);
        } catch (error) {
            console.error('Error loading wall chandelier model:', error);
        }

        this.scene.add(this.group);
    }

    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }

    setRotation(y) {
        this.group.rotation.y = y;
    }

    update() {
        // No candles to update in the new electric/gas lamp model
    }
}
