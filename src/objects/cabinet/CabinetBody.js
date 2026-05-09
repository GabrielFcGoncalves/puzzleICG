import * as THREE from 'three';
import { Key } from '../Key.js';

export class CabinetBody {
    constructor(cabinet) {
        this.cabinet = cabinet;
        this.group = new THREE.Group();
        this.feet = [];
        this.rotatableFoot = null;
        this.fingerMark = null;
        this.key = null;
        this.box = new THREE.Group();

        this.init();
    }

    init() {
        const { W, H, D, thickness, bodyMat, handleMat, pillarMat, pillarGeom, footGeom } = this.cabinet.config;

        // --- Hollow Body ---
        // Back panel
        const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, thickness), bodyMat);
        back.position.z = -D / 2 + thickness / 2;
        this.box.add(back);

        // Sides
        const sideGeom = new THREE.BoxGeometry(thickness, H, D);
        const left = new THREE.Mesh(sideGeom, bodyMat);
        left.position.x = -W / 2 + thickness / 2;
        const right = new THREE.Mesh(sideGeom, bodyMat);
        right.position.x = W / 2 - thickness / 2;
        this.box.add(left, right);

        // Top/Bottom
        const capGeom = new THREE.BoxGeometry(W, thickness, D);
        const top = new THREE.Mesh(capGeom, bodyMat);
        top.position.y = H / 2 - thickness / 2;
        const bottom = new THREE.Mesh(capGeom, bodyMat);
        bottom.position.y = -H / 2 + thickness / 2;
        this.box.add(top, bottom);

        // Internal Shelf (separating middle and bottom drawers)
        const shelf1 = new THREE.Mesh(new THREE.BoxGeometry(W - thickness * 2, thickness, D - thickness), bodyMat);
        shelf1.position.y = -0.5;
        shelf1.position.z = thickness / 2;
        this.box.add(shelf1);

        // Internal Divider Shelf (splitting the vault space in two)
        const shelf2 = new THREE.Mesh(new THREE.BoxGeometry(W - thickness * 2, thickness, D - thickness), bodyMat);
        shelf2.position.y = 0.75;
        shelf2.position.z = thickness / 2;
        this.box.add(shelf2);

        this.box.userData = { isCabinetBody: true };
        this.group.add(this.box);

        // --- Decorative Pillars & Feet ---
        const corners = [
            { x: W / 2, z: D / 2 },
            { x: -W / 2, z: D / 2 },
            { x: W / 2, z: -D / 2 },
            { x: -W / 2, z: -D / 2 }
        ];

        corners.forEach((pos, i) => {
            const pillar = new THREE.Mesh(pillarGeom, pillarMat);
            pillar.position.set(pos.x, 0, pos.z);
            this.group.add(pillar);

            const footGroup = new THREE.Group();

            if (i === 2) {
                // Special foot with a side hole
                const specialGeom = new THREE.CylinderGeometry(0.1, 0.08, 0.2, 32, 1, false, 0, Math.PI * 1.7);
                const footMesh = new THREE.Mesh(specialGeom, pillarMat);
                footGroup.add(footMesh);
                footGroup.userData = { isFooting: true, isRotatable: true, index: i };

                const footHitBox = new THREE.Mesh(
                    new THREE.SphereGeometry(0.12, 16, 16),
                    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
                );
                footHitBox.userData = { isRotatable: true };
                footMesh.add(footHitBox);
                this.rotatableFoot = footMesh;

                // Ethereal Fingerprint Mark
                const fingerMat = new THREE.MeshBasicMaterial({
                    map: this.cabinet.fingerprintTex,
                    transparent: true,
                    opacity: 0.9,
                    blending: THREE.AdditiveBlending,
                    side: THREE.FrontSide
                });
                this.fingerMark = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), fingerMat);
                this.fingerMark.position.set(0.12, 0, 0); 
                this.fingerMark.rotation.y = Math.PI / 2;
                this.rotatableFoot.add(this.fingerMark);

                // Hidden Key
                this.key = new Key();
                this.key.group.scale.set(0.6, 0.6, 0.6);
                this.key.group.userData.isZoomable = false;
                this.key.setPosition(0, 0, 0);
                this.key.setRotation(0, 0, 0);
                footGroup.add(this.key.group);
            } else {
                const footMesh = new THREE.Mesh(footGeom, pillarMat);
                footGroup.add(footMesh);
            }

            footGroup.position.set(pos.x, -H / 2 - 0.1, pos.z);
            this.group.add(footGroup);
            this.feet.push(footGroup);
        });

        // --- Frame Latch (Hasp Plate) ---
        const frameLatch = new THREE.Group();
        
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.01), handleMat);
        plate.position.set(0, -0.7, D / 2 + 0.02); // Hanging down over the drawer
        frameLatch.add(plate);

        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.02), new THREE.MeshBasicMaterial({ color: 0x000000 }));
        slot.position.set(0, -0.75, D / 2 + 0.02);
        frameLatch.add(slot);

        this.box.add(frameLatch);
        this.frameLatch = frameLatch;
    }

    update(isEthereal, isUnlocked) {
        if (this.fingerMark) this.fingerMark.visible = isEthereal;
        if (this.frameLatch) this.frameLatch.visible = !isUnlocked;
    }
}
