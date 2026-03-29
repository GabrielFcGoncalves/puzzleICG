import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class WallChandelier {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.init();
    }

    init() {
        const loader = new GLTFLoader();
        const lampPath = new URL('../../models/wall_lamp/scene.gltf', import.meta.url).href;
        
        loader.load(lampPath, (gltf) => {
            const lampModel = gltf.scene;
            
            // Adjust position and rotation to align with the wall properly
            lampModel.rotation.y = Math.PI; // Face the right way
            lampModel.scale.set(0.02, 0.02, 0.02); // Balanced scale
            
            lampModel.traverse(node => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            
            this.group.add(lampModel);
        });

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
