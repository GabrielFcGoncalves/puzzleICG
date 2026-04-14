import * as THREE from 'three';
import { ModelLoader } from '../utils/ModelLoader.js';
import { Item } from './Item.js';

export class BirdItem extends Item {
    constructor(loadingManager) {
        super('Iron Bird');
        this.loadingManager = loadingManager;
        this.modelLoader = new ModelLoader(this.loadingManager);
        this.group.userData.isSmallProp = true; // For shadow optimization
        this.group.userData.isZoomable = false; // Disable direct zoom focus
        this.preserveRotationInThumbnail = true;
        this.init();
    }

    async init() {
        const birdPath = new URL('../models/bird.glb', import.meta.url).href;

        try {
            const gltf = await this.modelLoader.load(birdPath, { 
                shadows: true, 
                roughness: 0.4, 
                metalness: 0.8 
            });
            const bird = gltf.scene;
            
            // Adjust scale if needed
            bird.scale.set(0.5, 0.5, 0.5);
            
            // --- Grounding fix: center X/Z, but put Y at the VERY BOTTOM ---
            const box = new THREE.Box3().setFromObject(bird);
            const center = box.getCenter(new THREE.Vector3());
            bird.position.x -= center.x;
            bird.position.z -= center.z;
            bird.position.y -= box.min.y; // Bird's "feet" now at group y=0
            

            this.group.add(bird);
            
            // Initial scrambled rotation (Hardcoded)
            this.group.rotation.x = 0.4;
            this.group.rotation.y = 1.2;
        } catch (error) {
            console.error('Error loading bird model:', error);
        }
    }
}
