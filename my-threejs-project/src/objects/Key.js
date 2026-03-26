import * as THREE from 'three';
import { Item } from './Item.js';

export class Key extends Item {
    constructor() {
        super('Old Key');
        this.init();
    }

    init() {
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xaa8800, metalness: 0.8, roughness: 0.2 });
        
        // Key Ring (Torus)
        const ringGeom = new THREE.TorusGeometry(0.04, 0.01, 8, 32);
        const ring = new THREE.Mesh(ringGeom, goldMat);
        this.group.add(ring);
        
        // Key Stem (Cylinder)
        const stemGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.12, 16);
        const stem = new THREE.Mesh(stemGeom, goldMat);
        stem.rotation.z = Math.PI / 2;
        stem.position.x = 0.07;
        this.group.add(stem);
        
        // Key Bit (Box)
        const bitGeom = new THREE.BoxGeometry(0.02, 0.03, 0.01);
        const bit = new THREE.Mesh(bitGeom, goldMat);
        bit.position.set(0.12, -0.01, 0);
        this.group.add(bit);
    }
}
