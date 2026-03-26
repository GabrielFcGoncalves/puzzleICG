import * as THREE from 'three';

export class Stand {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.userData = { isStand: true, isStaticPuzzlePart: true };
        this.init();
    }

    init() {
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x333333, 
            metalness: 0.8, 
            roughness: 0.2 
        });

        // --- Circular Base ---
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.25, 0.04, 32),
            material
        );
        this.group.add(base);

        // --- Supporting Arm ---
        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.25, 0.04),
            material
        );
        arm.position.y = 0.125;
        this.group.add(arm);

        // --- Wide U-shaped Holder ---
        const holder = new THREE.Mesh(
            new THREE.TorusGeometry(0.1, 0.02, 16, 32, Math.PI), 
            material
        );
        holder.rotation.x = -Math.PI;
        holder.position.y = 0.375;
        holder.rotation.y = Math.PI / 2;
        this.group.add(holder);

        // --- Improved Interaction HitBox ---
        // Large invisible sphere to make mounting from inventory easier
        const hitBox = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 16, 16),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
        );
        hitBox.position.y = 0.25;
        hitBox.userData = { isStand: true }; // Helps the raycaster logic identify it
        this.group.add(hitBox);

        this.scene.add(this.group);
    }

    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }
}
