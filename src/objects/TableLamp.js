import * as THREE from 'three';
import { ModelLoader } from '../utils/ModelLoader.js';

export class TableLamp {
    constructor(scene, loadingManager) {
        this.scene = scene;
        this.loadingManager = loadingManager;
        this.modelLoader = new ModelLoader(this.loadingManager);
        this.group = new THREE.Group();
        this.group.userData = { isStaticPuzzlePart: true, isSmallTable: true };
        this.init();
    }

    async init() {
        const lampPath = new URL('../models/lamp/scene.gltf', import.meta.url).href;
        
        try {
            const gltf = await this.modelLoader.load(lampPath);
            const lampModel = gltf.scene;
            
            // Adjust position and scale
            let scale = 8.5;
            lampModel.scale.set(scale, scale, scale); 
            
            this.group.add(lampModel);
            
            // Add a simpler point light inside the lamp (no shadows)
            this.light = new THREE.PointLight(0xffaa44, 10, 4);
            this.light.position.set(0, 0.8, 0); 
            this.light.castShadow = false;
            this.group.add(this.light);

        } catch (error) {
            console.error('Error loading table lamp model:', error);
        }

        this.scene.add(this.group);
    }

    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }

    setRotation(y) {
        this.group.rotation.y = y;
    }
}
