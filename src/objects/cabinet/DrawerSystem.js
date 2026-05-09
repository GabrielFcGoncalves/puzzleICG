import * as THREE from 'three';

export class DrawerSystem {
    constructor(cabinet) {
        this.cabinet = cabinet;
        this.drawerGroups = [];
        this.drawerDefs = [];
        this.init();
    }

    init() {
        const { W, H, D, handleMat, handleGeom, drawerMat } = this.cabinet.config;
        const gap = 0.06;
        const dW = W * 0.92;
        const dH = 1 - gap * 2;
        const dD = D - gap * 2;

        this.drawerDefs = [
            { x: 0, y: 0.5, w: dW, h: 2 - gap * 2, d: dD * 0.2, locked: true, name: "The Vault" },
            { x: 0, y: -1.0, w: dW, h: dH, d: dD, locked: true, name: "Bottom" },
        ];

        this.drawerDefs.forEach((def, i) => {
            const dGroup = new THREE.Group();

            if (i === 0) {
                // The Vault Door
                const pivot = new THREE.Group();
                pivot.position.set(-def.w / 2, 0, def.d / 2);
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
                // Hollow Regular Drawer Construction
                const t = this.cabinet.config.thickness;
                
                // Front Panel
                const front = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.h, t), drawerMat);
                front.position.set(0, 0, def.d / 2 - t / 2);
                dGroup.add(front);

                // Back Panel
                const back = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.h - t, t), drawerMat);
                back.position.set(0, t / 2, -def.d / 2 + t / 2);
                dGroup.add(back);

                // Side Panels
                const sideGeom = new THREE.BoxGeometry(t, def.h - t, def.d - t * 2);
                const left = new THREE.Mesh(sideGeom, drawerMat);
                left.position.set(-def.w / 2 + t / 2, t / 2, 0);
                dGroup.add(left);

                const right = new THREE.Mesh(sideGeom, drawerMat);
                right.position.set(def.w / 2 - t / 2, t / 2, 0);
                dGroup.add(right);

                // Bottom Panel
                const bottom = new THREE.Mesh(new THREE.BoxGeometry(def.w, t, def.d), drawerMat);
                bottom.position.set(0, -def.h / 2 + t / 2, 0);
                bottom.userData = { drawerIndex: i, isDrawerInside: true };
                dGroup.add(bottom);

                // Add flags to side panels as well for better coverage
                back.userData = { drawerIndex: i, isDrawerInside: true };
                left.userData = { drawerIndex: i, isDrawerInside: true };
                right.userData = { drawerIndex: i, isDrawerInside: true };

                const handleHitBox = new THREE.Mesh(
                    new THREE.BoxGeometry(def.w, def.h, 0.1),
                    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
                );
                handleHitBox.position.set(0, 0, def.d / 2);
                handleHitBox.userData = { drawerIndex: i };
                dGroup.add(handleHitBox);

                if (i === 1) {
                    // Drawer Latch (Torus Staple)
                    const staple = new THREE.Mesh(
                        new THREE.TorusGeometry(0.08, 0.02, 16, 32),
                        handleMat
                    );
                    staple.position.set(0, 0.25, def.d / 2 + 0.01);
                    staple.rotation.y = Math.PI / 2; // Hole along X-axis
                    dGroup.add(staple);
                }
            }

            const frontFaceZ = D / 2 + 0.02;
            const startZ = frontFaceZ - def.d / 2;
            
            dGroup.position.set(def.x, def.y, startZ);
            this.cabinet.currentDrawerZ[i] = startZ;
            this.cabinet.targetDrawerZ[i] = startZ;
            dGroup.userData.restZ = startZ;
            dGroup.userData.openedZ = D * 0.75 + startZ;
            dGroup.userData.isLocked = def.locked;

            this.cabinet.group.add(dGroup);
            this.drawerGroups.push(dGroup);
        });
    }

    update(ctx) {
        this.drawerGroups.forEach((dGroup, i) => {
            if (i === 0 && this.cabinet.currentDrawerZ[i] > dGroup.userData.restZ + 0.01) {
                ctx.mainScene.loadVaultItems();
            }

            this.cabinet.currentDrawerZ[i] = THREE.MathUtils.lerp(
                this.cabinet.currentDrawerZ[i],
                this.cabinet.targetDrawerZ[i],
                this.cabinet.heavyFactor
            );

            if (dGroup.userData.doorPivot) {
                const restZ = dGroup.userData.restZ;
                const openedZ = dGroup.userData.openedZ;
                const openFactor = (this.cabinet.currentDrawerZ[i] - restZ) / (openedZ - restZ);
                dGroup.userData.doorPivot.rotation.y = -openFactor * Math.PI * 0.6;
            } else {
                dGroup.position.z = this.cabinet.currentDrawerZ[i];
            }
        });
    }
}
