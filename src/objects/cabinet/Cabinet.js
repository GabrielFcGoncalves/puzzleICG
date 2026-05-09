import * as THREE from 'three';
import { createWheelTexture, createClueTexture, createFingerprintTexture } from '../../utils/Textures.js';
import { CabinetBody } from './CabinetBody.js';
import { DrawerSystem } from './DrawerSystem.js';
import { LockSystem } from './LockSystem.js';

export class Cabinet {
    constructor(scene, loadingManager, world) {
        this.scene = scene;
        this.loadingManager = loadingManager || new THREE.LoadingManager();
        this.world = world;
        this.group = new THREE.Group();
        this.isUnlocked = false; 
        this.currentCode = [7, 7, 7, 7, 7];
        this.targetCode = [4, 7, 1, 8, 5];
        this.isKeyInserted = false;
        this.isKeyTurned = false;

        this.drawerCount = 4;
        this.currentDrawerZ = Array(this.drawerCount).fill(0);
        this.targetDrawerZ = Array(this.drawerCount).fill(0);
        this.heavyFactor = 0.07;

        this.init();
    }

    get box() { return (this.body && this.body.box) ? this.body.box : new THREE.Group(); }
    get wheels() { return (this.lockSystem && this.lockSystem.padlock) ? this.lockSystem.padlock.wheels : []; }
    get drawerGroups() { return (this.drawerSystem && this.drawerSystem.drawerGroups) ? this.drawerSystem.drawerGroups : []; }
    get padlock() { return (this.lockSystem && this.lockSystem.padlock) ? this.lockSystem.padlock : null; }
    get keyLock() { return (this.lockSystem && this.lockSystem.keyLock) ? this.lockSystem.keyLock : null; }
    get keyPivot() { return (this.lockSystem && this.lockSystem.keyPivot) ? this.lockSystem.keyPivot : null; }
    get rotatableFoot() { return (this.body && this.body.rotatableFoot) ? this.body.rotatableFoot : null; }
    get key() { return (this.body && this.body.key) ? this.body.key : null; }
    get feet() { return (this.body && this.body.feet) ? this.body.feet : []; }

    init() {
        // --- Shared Config ---
        const W = 2, H = 3, D = 1.2;
        const thickness = 0.04;
        this.config = {
            W, H, D, thickness,
            bodyMat: new THREE.MeshStandardMaterial({ color: 0x2b1d0e }),
            handleMat: new THREE.MeshStandardMaterial({ color: 0xaa8800, metalness: 0.9, roughness: 0.2 }),
            pillarMat: new THREE.MeshStandardMaterial({ color: 0xaa8800, metalness: 0.8, roughness: 0.2 }),
            drawerMat: new THREE.MeshStandardMaterial({ color: 0x1a0f05 }),
            handleGeom: new THREE.TorusGeometry(0.1, 0.025, 16, 64),
            pillarGeom: new THREE.CylinderGeometry(0.06, 0.06, H, 32),
            footGeom: new THREE.CylinderGeometry(0.1, 0.08, 0.2, 32)
        };

        // --- Textures ---
        this.wheelSideTex = createWheelTexture();
        this.clueTex = createClueTexture();
        this.fingerprintTex = createFingerprintTexture();

        // --- Sub-Systems ---
        this.body = new CabinetBody(this);
        this.group.add(this.body.group);

        this.drawerSystem = new DrawerSystem(this);
        // drawerSystem adds its groups directly to this.group

        this.lockSystem = new LockSystem(this);

        // --- Clue plane (back of cabinet) ---
        this.cluePlane = new THREE.Mesh(
            new THREE.PlaneGeometry(1.4, 0.7),
            new THREE.MeshBasicMaterial({ map: this.clueTex, transparent: true, opacity: 0 })
        );
        this.cluePlane.position.set(0, 0, -(D / 2 + 0.01));
        this.cluePlane.rotation.y = Math.PI;
        this.group.add(this.cluePlane);

        this.scene.add(this.group);
    }

    update(isEthereal, isHintMode, statusElement, ctx) {
        this.lockSystem.update(ctx);
        this.drawerSystem.update(ctx);
        this.body.update(isEthereal, this.isUnlocked);

        const allOpen = this.currentDrawerZ.every(z => z > 0.4);
        if (allOpen && statusElement) {
            statusElement.innerText = 'CONGRATULATIONS';
        }

        // Highlight Mode
        const pulse = isHintMode ? (Math.sin(Date.now() * 0.005) * 0.5 + 0.5) * 0.4 : 0;
        const zoomables = [
            ...this.wheels,
            ...(this.lockSystem?.padlock?.group ? [this.lockSystem.padlock.group] : []),
            ...ctx.getHandles(),
            ...ctx.getItems(),
            ...(this.body?.feet[2] ? [this.body.feet[2]] : [])
        ];

        zoomables.forEach(obj => {
            obj.traverse(child => {
                if (child.isMesh && child.material && child.material.emissive) {
                    child.material.emissive.setRGB(pulse, pulse * 0.8, 0); 
                }
            });
        });

        this.cluePlane.material.opacity = THREE.MathUtils.lerp(this.cluePlane.material.opacity, isEthereal ? 1 : 0, 0.1);
    }

    checkPuzzle(world) {
        if (this.isUnlocked) return false;
        if (this.currentCode.every((v, i) => v === this.targetCode[i])) {
            this.isUnlocked = 'pending'; // Prevent multiple triggers
            this.onUnlock(world);
            return true;
        }
        return false;
    }

    async onUnlock(world) {
        // 1. Zoom out slightly to see the fall
        if (this.padlock) {
            const worldPos = new THREE.Vector3();
            this.padlock.group.getWorldPosition(worldPos);
            world.store.zoomTo(worldPos, 2.5); // Zoom out more for a wider view
        }

        // 2. Wait for camera to move
        await new Promise(resolve => setTimeout(resolve, 800));

        // 3. Trigger the actual unlock/animation
        this.isUnlocked = true;
        this.drawerSystem.drawerGroups[1].userData.isLocked = false;

        // 4. Wait for the fall to finish and zoom to cabinet
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const cabinetPos = new THREE.Vector3();
        this.group.getWorldPosition(cabinetPos);
        // Look at the middle of the cabinet (H/2)
        const lookAt = cabinetPos.clone().add(new THREE.Vector3(0, this.config.H / 10, 0));
        
        world.store.zoomTo(cabinetPos, 4.0, lookAt, new THREE.Vector3(0, 0.5, 1.4));
    }
}
