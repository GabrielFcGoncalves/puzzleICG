import * as THREE from 'three';
import { ModelLoader } from '../utils/ModelLoader.js';

export class Pen {
    constructor(scene, loadingManager) {
        this.scene = scene;
        this.loadingManager = loadingManager;
        this.modelLoader = new ModelLoader(this.loadingManager);
        this.group = new THREE.Group();
        this.group.userData = { isStaticPuzzlePart: true, isSmallTable: true };
        this.init();
    }

    async init() {
        const penPath = new URL('../models/old_pen/scene.gltf', import.meta.url).href;
        
        try {
            const gltf = await this.modelLoader.load(penPath);
            const penModel = gltf.scene;
            
            penModel.scale.set(0.023, 0.023, 0.023); 
            penModel.rotation.x = -Math.PI / 1.37;
            penModel.rotation.z = -Math.PI / 4;
            
            this.group.add(penModel);
        } catch (error) {
            console.error('Error loading pen model:', error);
        }

        this.scene.add(this.group);
    }

    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }

    setRotation(x, y, z) {
        this.group.rotation.set(x, y, z);
    }
}
