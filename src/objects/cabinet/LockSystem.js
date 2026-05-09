import * as THREE from 'three';
import { Key } from '../Key.js';
import { Padlock } from '../Padlock.js';

export class LockSystem {
    constructor(cabinet) {
        this.cabinet = cabinet;
        this.keyLock = null;
        this.keyPivot = null;
        this.insertedKeyObj = null;
        this.padlock = null;

        this.init();
    }

    init() {
        if (!this.cabinet.drawerSystem || !this.cabinet.drawerSystem.drawerGroups.length) return;

        const { handleMat } = this.cabinet.config;
        const vaultDrawer = this.cabinet.drawerSystem.drawerGroups[0];
        const vaultDef = this.cabinet.drawerSystem.drawerDefs[0];
        
        if (!vaultDrawer || !vaultDef) return;

        // --- Vault Key Lock ---
        const lockGroup = new THREE.Group();
        const lockPlateGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.01, 32);
        lockPlateGeom.rotateX(Math.PI / 2);
        const lockPlate = new THREE.Mesh(lockPlateGeom, handleMat);
        lockGroup.add(lockPlate);

        const keyholeGeom = new THREE.BoxGeometry(0.01, 0.03, 0.01);
        const keyhole = new THREE.Mesh(keyholeGeom, new THREE.MeshStandardMaterial({ color: 0x000000 }));
        keyhole.position.z = 0.006;
        lockGroup.add(keyhole);

        lockGroup.position.set(0.4 + vaultDef.w / 2, 0.3, 0.01);
        lockGroup.userData = { isLock: true, drawerIndex: 0, isStaticPuzzlePart: true };
        vaultDrawer.userData.doorPivot.add(lockGroup);
        this.keyLock = lockGroup;

        // --- Inserted Key ---
        this.insertedKeyObj = new Key();
        this.insertedKeyObj.group.scale.set(0.6, 0.6, 0.6);
        this.keyPivot = new THREE.Group();
        this.keyPivot.position.set(0, 0, 0.05);
        this.keyPivot.add(this.insertedKeyObj.group);
        this.insertedKeyObj.group.rotation.y = Math.PI / 2;
        this.keyPivot.userData = { isTurnableKey: true };
        this.keyPivot.visible = false;

        const keyHitBox = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 16, 16),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
        );
        keyHitBox.userData = { isTurnableKey: true };
        this.keyPivot.add(keyHitBox);
        lockGroup.add(this.keyPivot);

        // --- Padlock ---
        const bottomDrawer = this.cabinet.drawerSystem.drawerGroups[1];
        const bottomDef = this.cabinet.drawerSystem.drawerDefs[1];
        this.padlock = new Padlock(bottomDrawer, this.cabinet.loadingManager, this.cabinet.world, this.cabinet);
        this.padlock.group.position.set(0, -0.05, bottomDef.d / 2 + 0.02);
        this.padlock.group.rotation.set(0, Math.PI / 2, 0); // Hole along X-axis

        // Physics Anchor
        if (this.cabinet.world && this.cabinet.world.physicsSystem) {
            import('cannon-es').then(CANNON => {
                const worldPos = new THREE.Vector3();
                worldPos.set(0, -1.05, -3.5 + this.cabinet.config.D / 2 + 0.02);
                this.stapleBody = new CANNON.Body({ mass: 0, type: CANNON.Body.STATIC });
                this.stapleBody.position.copy(worldPos);
                this.cabinet.world.physicsSystem.physicsWorld.addBody(this.stapleBody);
            });
        }
    }

    update(ctx) {
        this.padlock.update(this.cabinet.isUnlocked, ctx.delta || 0.016);

        if (this.keyPivot) {
            const isHovered = ctx.interaction.hoveredSlot === this.keyLock;
            const isDraggingKey = ctx.uiState.draggedInventoryIndex !== -1 && 
                                ctx.uiState.inventory[ctx.uiState.draggedInventoryIndex].name === 'Old Key';
            
            const showPreview = isHovered && isDraggingKey && !this.cabinet.isKeyInserted;
            this.keyPivot.visible = this.cabinet.isKeyInserted || showPreview;
            
            this.insertedKeyObj.group.traverse(node => {
                if (node.isMesh) {
                    node.material.transparent = true;
                    node.material.opacity = showPreview ? 0.4 : 1.0;
                }
            });

            const targetZ = this.cabinet.isKeyTurned ? -Math.PI / 2 : 0;
            this.keyPivot.rotation.z = THREE.MathUtils.lerp(this.keyPivot.rotation.z, targetZ, 0.1);
        }
    }
}
