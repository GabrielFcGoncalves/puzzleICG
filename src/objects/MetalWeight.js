import * as THREE from 'three';
import { Item } from './Item.js';

/**
 * Class to procedurally generate metal weights of different sizes.
 * Similar to physical calibration weights.
 */
export class MetalWeight extends Item {
    constructor(weightType = 100) {
        super(`${weightType}g Weight`);
        this.weightType = weightType;
        this.createMesh();
    }

    createMesh() {
        // Base scale factors based on weight type (grams)
        let scale = 0.2;

        const points = [];
        
        // Define the profile of the weight (r, y)
        // 1. Bottom center
        points.push(new THREE.Vector2(0, 0));
        
        // 2. Bottom lip
        points.push(new THREE.Vector2(0.6 * scale, 0));
        points.push(new THREE.Vector2(0.6 * scale, 0.05 * scale));
        points.push(new THREE.Vector2(0.5 * scale, 0.05 * scale));
        
        // 3. Main cylinder body
        points.push(new THREE.Vector2(0.5 * scale, 1.0 * scale));
        
        // 4. Shoulder
        points.push(new THREE.Vector2(0.4 * scale, 1.05 * scale));
        
        // 5. Neck
        points.push(new THREE.Vector2(0.2 * scale, 1.1 * scale));
        points.push(new THREE.Vector2(0.2 * scale, 1.25 * scale));
        
        // 6. Top Knob
        points.push(new THREE.Vector2(0.35 * scale, 1.3 * scale));
        points.push(new THREE.Vector2(0.35 * scale, 1.45 * scale));
        points.push(new THREE.Vector2(0.25 * scale, 1.5 * scale)); // Rounded edge
        
        // 7. Top center
        points.push(new THREE.Vector2(0, 1.5 * scale));

        // Use LatheGeometry to create the 3D shape by revolving the profile
        const geometry = new THREE.LatheGeometry(points, 32);
        
        // Highly reflective chrome-like material
        const material = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 1.0,
            roughness: 0.05,
            envMapIntensity: 1.0 // Assumes scene has an environment map for reflections
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Tag the object for interaction
        mesh.userData = { 
            isItem: true, 
            isPickupable: true,
            itemName: this.name,
            weight: this.weightType
        };

        this.group.userData.weight = this.weightType;

        this.group.add(mesh);
    }
}
