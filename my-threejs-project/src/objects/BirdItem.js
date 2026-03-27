import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Item } from './Item.js';

export class BirdItem extends Item {
    constructor() {
        super('Iron Bird');
        this.group.userData.isSmallProp = true; // For shadow optimization
        this.init();
    }

    init() {
        const loader = new GLTFLoader();
        const birdPath = new URL('../models/bird.glb', import.meta.url).href;

        loader.load(birdPath, (gltf) => {
            const bird = gltf.scene;
            
            // Adjust scale if needed
            bird.scale.set(0.5, 0.5, 0.5);
            
            // --- Center the Pivot ---
            const box = new THREE.Box3().setFromObject(bird);
            const center = box.getCenter(new THREE.Vector3());
            bird.position.sub(center); // Subtracting the offset to center the geometry
            
            bird.traverse(node => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    
                    // Specific material tweaks if it's too bright/dark
                    if (node.material) {
                        node.material.roughness = 0.4;
                        node.material.metalness = 0.8;
                    }
                }
            });

            this.group.add(bird);
        }, undefined, (error) => {
            console.error('Error loading bird model:', error);
        });
    }
}
