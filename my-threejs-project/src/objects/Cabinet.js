import * as THREE from 'three';
import { createWheelTexture, createNoteTexture, createClueTexture } from '../utils/Textures.js';
import { Key } from './Key.js';

export class Cabinet {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.isUnlocked = false; // Corresponds to the bottom drawer lock
        this.wheels = [];
        this.currentCode = [0, 0, 0, 0];
        this.targetCode = [1, 2, 3, 4];
        this.isKeyInserted = false;
        this.isKeyTurned = false;

        // One drawer state per drawer (3 rows: top-left, top-right, middle, bottom)
        this.drawerCount = 4;
        this.drawerGroups = [];
        this.currentDrawerZ = Array(this.drawerCount).fill(0);
        this.targetDrawerZ = Array(this.drawerCount).fill(0);
        this.heavyFactor = 0.07;

        this.init();
    }

    init() {
        // --- Textures ---
        this.wheelSideTex = createWheelTexture();
        this.clueTex = createClueTexture();

        // ─────────────────────────────────────────────────────────────
        // Cabinet body  (W × H × D)
        //   W = 2   H = 3   D = 1.2
        // Row heights (from top):
        //   Row 0 (top)    → 1 unit  tall, split into two half-width drawers
        //   Row 1 (middle) → 1 unit  tall, full-width drawer
        //   Row 2 (bottom) → 1 unit  tall, full-width drawer
        // ─────────────────────────────────────────────────────────────
        const W = 2, H = 3, D = 1.2;

        // Hollow Body (composed of panels)
        this.box = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2b1d0e });
        const thickness = 0.04;

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

        // Internal Divider Shelf (splitting the vault space in two: 1/4 to 3/4)
        const shelf2 = new THREE.Mesh(new THREE.BoxGeometry(W - thickness * 2, thickness, D - thickness), bodyMat);
        shelf2.position.y = 0.75; // 3/4 height relative to the middle drawer range [0, 1]
        shelf2.position.z = thickness / 2;
        this.box.add(shelf2);

        this.box.userData = { isCabinetBody: true };
        this.group.add(this.box);

        // Decorative Pillars at Corners
        const pillarGeom = new THREE.CylinderGeometry(0.06, 0.06, H, 32);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0xaa8800, metalness: 0.8, roughness: 0.2 });
        const corners = [
            { x: W / 2, z: D / 2 },
            { x: -W / 2, z: D / 2 },
            { x: W / 2, z: -D / 2 },
            { x: -W / 2, z: -D / 2 }
        ];

        this.feet = [];
        const footGeom = new THREE.CylinderGeometry(0.1, 0.08, 0.2, 32);
        corners.forEach((pos, i) => {
            const pillar = new THREE.Mesh(pillarGeom, pillarMat);
            pillar.position.set(pos.x, 0, pos.z);
            this.group.add(pillar);

            const footGroup = new THREE.Group();

            // i === 2 is back-right corner
            if (i === 2) {
                // Special foot with a side hole
                // thetaLength < 2*PI leaves a gap in the side
                const specialGeom = new THREE.CylinderGeometry(0.1, 0.08, 0.2, 32, 1, false, 0, Math.PI * 1.7);
                const footMesh = new THREE.Mesh(specialGeom, pillarMat);
                footGroup.add(footMesh);
                footGroup.userData = { isFooting: true, isRotatable: true, index: i };

                // Smaller, less aggressive hitBox for foot to avoid blocking the hole
                const footHitBox = new THREE.Mesh(
                    new THREE.SphereGeometry(0.12, 16, 16),
                    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
                );
                footHitBox.userData = { isRotatable: true };
                footMesh.add(footHitBox);

                this.rotatableFoot = footMesh;

                // Hide the key inside this foot
                this.key = new Key();
                // Scale it down to fit inside the cylinder
                this.key.group.scale.set(0.6, 0.6, 0.6);
                this.key.group.userData.isZoomable = false;
                // Position it inside the footGroup (static while footMesh rotates)
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

        // Shared materials
        const drawerMat = new THREE.MeshStandardMaterial({ color: 0x1a0f05 });
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xaa8800, metalness: 0.9, roughness: 0.2 });
        const handleGeom = new THREE.TorusGeometry(0.1, 0.025, 16, 64);

        // ─── Row definitions ──────────────────────────────────────────
        const gap = 0.06;      // gap between drawers / around edges
        const dW = W * 0.92;   // full-width drawer width
        const dH = 1 - gap * 2; // single drawer height
        const dD = D - gap * 2; // drawer depth (fits inside body)

        const drawerDefs = [
            // COMBINED Top and Middle Row - Full Width, Double Height
            { x: 0, y: 0.5, w: dW, h: 2 - gap * 2, d: dD * 0.2, locked: true, name: "The Vault" },
            // Bottom row – full width
            { x: 0, y: -1.0, w: dW, h: dH, d: dD, locked: true, name: "Bottom" },
        ];

        drawerDefs.forEach((def, i) => {
            const dGroup = new THREE.Group();

            if (i === 0) {
                // SPECIAL: The Vault is a swinging door
                const pivot = new THREE.Group();
                pivot.position.set(-def.w / 2, 0, def.d / 2); // Hinge at left edge
                dGroup.add(pivot);
                dGroup.userData.doorPivot = pivot;

                const mesh = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.h, def.d), drawerMat);
                mesh.position.set(def.w / 2, 0, -def.d / 2);
                pivot.add(mesh);

                const handleHitBox = new THREE.Mesh(
                    new THREE.SphereGeometry(0.3, 16, 16),
                    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
                );
                handleHitBox.position.set(def.w * 0.85, 0, 0); 
                handleHitBox.userData = { drawerIndex: i };
                pivot.add(handleHitBox);

                const handle = new THREE.Mesh(handleGeom, handleMat.clone());
                handle.position.set(def.w * 0.85, 0, 0.01);
                handle.rotation.x = Math.PI / 2;
                handle.userData = { drawerIndex: i };
                pivot.add(handle);
            } else {
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.h, def.d), drawerMat);
                dGroup.add(mesh);

                const handleHitBox = new THREE.Mesh(
                    new THREE.SphereGeometry(0.3, 16, 16),
                    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
                );
                handleHitBox.position.set(0, 0, def.d / 2);
                handleHitBox.userData = { drawerIndex: i };
                dGroup.add(handleHitBox);

                const handle = new THREE.Mesh(handleGeom, handleMat.clone());
                handle.position.set(0, 0, def.d / 2 + 0.01);
                handle.rotation.x = Math.PI / 2;
                handle.userData = { drawerIndex: i };
                dGroup.add(handle);
            }

            // Calculate startZ so the front face (Z+) is flush with cabinet front
            const frontFaceZ = D / 2 + 0.02; // desired front face world pos relative to cabinet center
            const startZ = frontFaceZ - def.d / 2;
            
            dGroup.position.set(def.x, def.y, startZ);
            this.currentDrawerZ[i] = startZ;
            this.targetDrawerZ[i] = startZ;
            dGroup.userData.restZ = startZ;
            dGroup.userData.openedZ = D * 0.75 + startZ;
            dGroup.userData.isLocked = def.locked;

            this.group.add(dGroup);
            this.drawerGroups.push(dGroup);
        });

        // ─── Key Lock (on combined drawer index 0) ──────────────────
        const middleDrawer = this.drawerGroups[0];
        const middleDef = drawerDefs[0];
        const lockGroup = new THREE.Group();

        const lockPlateGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.01, 32);
        lockPlateGeom.rotateX(Math.PI / 2);
        const lockPlate = new THREE.Mesh(lockPlateGeom, handleMat);
        lockGroup.add(lockPlate);

        const keyholeGeom = new THREE.BoxGeometry(0.01, 0.03, 0.01);
        const keyhole = new THREE.Mesh(keyholeGeom, new THREE.MeshStandardMaterial({ color: 0x000000 }));
        keyhole.position.z = 0.006;
        lockGroup.add(keyhole);

        lockGroup.position.set(0.4 + middleDef.w / 2, 0.3, 0.01);
        lockGroup.userData = { isLock: true, drawerIndex: 0, isStaticPuzzlePart: true };
        middleDrawer.userData.doorPivot.add(lockGroup);
        this.keyLock = lockGroup;

        // --- Inserted Key (initially invisible) ---
        this.insertedKeyObj = new Key();
        this.insertedKeyObj.group.visible = true; // Visibility is managed by the pivot
        this.insertedKeyObj.group.scale.set(0.6, 0.6, 0.6);

        // Use a pivot for the turn (so we can use rotation.z for the turn regardless of key mesh axes)
        this.keyPivot = new THREE.Group();
        this.keyPivot.position.set(0, 0, 0.05);
        this.keyPivot.add(this.insertedKeyObj.group);

        // Orient the X-aligned key stem inside the pivot so it points along pivot Z
        this.insertedKeyObj.group.rotation.y = Math.PI / 2;

        this.keyPivot.userData = { isTurnableKey: true };
        this.keyPivot.visible = false; // The pivot carries the visibility for the key

        // Add a hitBox for turning the focus
        const keyHitBox = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 16, 16),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
        );
        keyHitBox.userData = { isTurnableKey: true };
        this.keyPivot.add(keyHitBox);

        lockGroup.add(this.keyPivot);



        // ─── Clue plane (back of cabinet) ─────────────────────────────
        this.cluePlane = new THREE.Mesh(
            new THREE.PlaneGeometry(1.4, 0.7),
            new THREE.MeshBasicMaterial({ map: this.clueTex, transparent: true, opacity: 0 })
        );
        this.cluePlane.position.set(0, 0, -(D / 2 + 0.01));
        this.cluePlane.rotation.y = Math.PI;
        this.group.add(this.cluePlane);

        // ─── Combination wheels (on bottom drawer front face) ─────────
        const wheelGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.14, 60);
        wheelGeom.rotateZ(Math.PI / 2);
        const sideMat = new THREE.MeshStandardMaterial({ map: this.wheelSideTex, roughness: 0.3 });
        const capMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const bottomDef = drawerDefs[1];
        const bottomDrawer = this.drawerGroups[1];

        for (let i = 0; i < 4; i++) {
            const wheel = new THREE.Mesh(wheelGeom, [sideMat, capMat, capMat]);
            wheel.position.set(-0.3 + i * 0.2, 0, bottomDef.d / 2 + 0.08);
            wheel.userData = { index: i, targetRot: 0 };

            // Invisible hitBox for wheel
            const wheelHitBox = new THREE.Mesh(
                new THREE.SphereGeometry(0.25, 16, 16),
                new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
            );
            wheelHitBox.userData = { index: i }; // Also carry the index
            wheel.add(wheelHitBox);

            bottomDrawer.add(wheel);
            this.wheels.push(wheel);
        }

        this.scene.add(this.group);
    }

    update(isEthereal, isHintMode, statusElement, ctx) {
        // Smooth wheel rotation
        this.wheels.forEach(w => {
            w.rotation.x = THREE.MathUtils.lerp(w.rotation.x, w.userData.targetRot, 0.15);
        });

        // Smooth key rotation if turned
        if (this.isKeyInserted && this.keyPivot) {
            const targetZ = this.isKeyTurned ? -Math.PI / 2 : 0; // 45 degrees
            this.keyPivot.rotation.z = THREE.MathUtils.lerp(
                this.keyPivot.rotation.z,
                targetZ,
                0.1
            );
        }

        // Smooth drawer sliding or door swinging
        this.drawerGroups.forEach((dGroup, i) => {
            this.currentDrawerZ[i] = THREE.MathUtils.lerp(
                this.currentDrawerZ[i],
                this.targetDrawerZ[i],
                this.heavyFactor
            );

            if (dGroup.userData.doorPivot) {
                // Swing open like a closet door
                const restZ = dGroup.userData.restZ;
                const openedZ = dGroup.userData.openedZ;
                const openFactor = (this.currentDrawerZ[i] - restZ) / (openedZ - restZ);
                dGroup.userData.doorPivot.rotation.y = -openFactor * Math.PI * 0.6;
            } else {
                dGroup.position.z = this.currentDrawerZ[i];
            }
        });

        const allOpen = this.currentDrawerZ.every(z => z > 0.4);
        if (allOpen && statusElement) {
            statusElement.innerText = 'CONGRATULATIONS';
        }

        // Highlight Mode
        const pulse = isHintMode ? (Math.sin(Date.now() * 0.005) * 0.5 + 0.5) * 0.4 : 0;

        // Gather all zoomable parts
        const zoomables = [
            ...this.wheels,
            ...ctx.getHandles(),
            ...ctx.getItems(),
            // Special foot is this.feet[2] if it exists
            ...(this.feet[2] ? [this.feet[2]] : [])
        ];

        zoomables.forEach(obj => {
            obj.traverse(child => {
                if (child.isMesh && child.material && child.material.emissive) {
                    child.material.emissive.setRGB(pulse, pulse * 0.8, 0); // Golden pulse
                }
            });
        });

        // Clue visibility
        this.cluePlane.material.opacity = THREE.MathUtils.lerp(
            this.cluePlane.material.opacity,
            isEthereal ? 1 : 0,
            0.1
        );
    }

    checkPuzzle() {
        if (this.currentCode.every((v, i) => v === this.targetCode[i])) {
            this.isUnlocked = true;
            // Also update the bottom drawer state in its userData
            this.drawerGroups[1].userData.isLocked = false;
            this.wheels.forEach(w => (w.visible = false));
            return true;
        }
        return false;
    }
}
