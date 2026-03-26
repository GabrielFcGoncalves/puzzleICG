import * as THREE from 'three';
import { Candle } from './Candle.js';

export class WallChandelier {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.candles = [];
        this.init();
    }

    init() {
        const metalMat = new THREE.MeshStandardMaterial({ 
            color: 0xaa8800, 
            metalness: 0.9, 
            roughness: 0.2 
        });

        // --- Wall Mount (Back plate) ---
        const mount = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16),
            metalMat
        );
        mount.rotation.x = Math.PI / 2;
        this.group.add(mount);

        // --- Arm ---
        const armGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
        const arm = new THREE.Mesh(armGeom, metalMat);
        arm.rotation.x = -Math.PI / 4;
        arm.position.set(0, 0.05, 0.1);
        this.group.add(arm);

        // --- Holder / Base ---
        const holder = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.06, 0.04, 16),
            metalMat
        );
        holder.position.set(0, 0.15, 0.2);
        this.group.add(holder);

        // --- Candle ---
        const candle = new Candle(this.group); // Added to this group
        candle.setPosition(0, 0.25, 0.2);
        candle.group.scale.set(1.5, 1.5, 1.5);
        this.candles.push(candle);

        this.scene.add(this.group);
    }

    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }

    setRotation(y) {
        this.group.rotation.y = y;
    }

    update() {
        this.candles.forEach(c => c.update());
    }
}
