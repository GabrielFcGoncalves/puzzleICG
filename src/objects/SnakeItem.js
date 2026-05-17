import * as THREE from 'three';
import { ModelLoader } from '../utils/ModelLoader.js';
import { Item } from './Item.js';

export class SnakeItem extends Item {
    constructor(loadingManager) {
        super('Snake Statue');
        this.loadingManager = loadingManager;
        this.modelLoader = new ModelLoader(this.loadingManager);
        this.group.userData.isSmallProp = true; // For shadow optimization
        this.group.userData.isZoomable = false; // Disable direct zoom focus
        this.preserveRotationInThumbnail = true;
        this.init();
    }

    async init() {
        const snakePath = new URL('../models/snake_statue/scene.gltf', import.meta.url).href;

        try {
            const gltf = await this.modelLoader.load(snakePath, { 
                shadows: true
            });
            const snake = gltf.scene;
            
            // Adjust scale as set by user
            snake.scale.set(0.05, 0.05, 0.05);
            
            // Grounding fix: center X/Z, but put Y at the VERY BOTTOM
            const box = new THREE.Box3().setFromObject(snake);
            const center = box.getCenter(new THREE.Vector3());
            snake.position.x -= center.x;
            snake.position.z -= center.z;
            snake.position.y -= box.min.y; // Snake's bottom now at group y=0
            
            this.group.add(snake);
            
        } catch (error) {
            console.error('Error loading snake model:', error);
        }
    }
}
