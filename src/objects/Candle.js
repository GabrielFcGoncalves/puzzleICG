import * as THREE from 'three';

export class Candle {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.init();
    }

    init() {
        const waxMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffee, 
            roughness: 0.6,
            emissive: 0x222211 
        });
        
        // --- Wax Body ---
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.2, 16), 
            waxMat
        );
        this.group.add(body);

        // --- Flame (small sphere/conic section) ---
        const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const flame = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 8, 8),
            flameMat
        );
        flame.position.y = 0.12;
        flame.scale.set(1, 1.8, 1); // Elongate to look like a flame
        this.group.add(flame);

        // --- Wick ---
        const wick = new THREE.Mesh(
            new THREE.CylinderGeometry(0.005, 0.005, 0.03, 8),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        wick.position.y = 0.1;
        this.group.add(wick);

        this.flame = flame; // Expose for flicker
        
        this.scene.add(this.group);
    }

    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }

    update() {
        // Subtle flame flicker
        const time = Date.now() * 0.005;
        const s = 1 + Math.sin(time * 3) * 0.1 + Math.random() * 0.05;
        this.flame.scale.y = 1.8 * s;
    }
}
