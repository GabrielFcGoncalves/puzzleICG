import * as THREE from 'three';

export class AnimationSystem {
    constructor(world) {
        this.world = world;
        this.stats = world.stats;
        this.store = world.store;
        this.renderer = world.renderer;
        this.mainScene = world.mainScene;
        this.inspectionScene = world.inspectionScene;
        this.controls = world.controls;
        this.camera = world.camera;

        this.animate = this.animate.bind(this);
    }

    start() {
        this.animate();
    }

    animate() {
        requestAnimationFrame(this.animate);
        this.stats.update();

        if (this.store.ui.isInspecting) {
            this.inspectionScene.update();
            this.inspectionScene.render(this.renderer);
        } else {
            this.updateShadows();
            this.updateTransitions();
            this.updateMainScene();
            this.updateBirdProxy();
            this.updateClamping();
            this.updatePuzzleBoxMovement();

            this.controls.update();
            this.renderer.render(this.mainScene.scene, this.camera);
        }
    }

    updateShadows() {
        if (this.store.ui.shadowNeedsRefresh) {
            this.mainScene.lights.desk.shadow.needsUpdate = true;
            this.mainScene.lights.lamp.shadow.needsUpdate = true;
            this.mainScene.lights.left.shadow.needsUpdate = true;

            const time = performance.now();
            if (time > 5000) {
                this.store.ui.shadowNeedsRefresh = false;
                console.log("SHADOW MAPS BAKED AND FROZEN");
            }
        }
    }

    updateTransitions() {
        if (this.store.camera.isTransitioning) {
            this.controls.target.lerp(this.store.camera.targetFocus, 0.1);
            this.camera.position.lerp(this.store.camera.cameraFocus, 0.1);

            if (this.camera.position.distanceTo(this.store.camera.cameraFocus) < 0.01 &&
                this.controls.target.distanceTo(this.store.camera.targetFocus) < 0.01) {
                this.store.camera.isTransitioning = false;
            }
        }
    }

    updateMainScene() {
        this.mainScene.update();
        this.mainScene.objects.cabinet.update(
            this.store.ui.isEthereal,
            this.store.ui.isHintMode,
            this.world.uiManager.statusElement,
            this.world
        );
        this.mainScene.objects.room.update(
            this.store.ui.isEthereal,
            this.store.puzzle.isBirdPuzzleSolved
        );
    }

    updateBirdProxy() {
        const birdProxy = this.mainScene.birdProxy;
        if (this.store.puzzle.showBirdInFocus && birdProxy && birdProxy.children.length > 0) {
            birdProxy.visible = true;
            birdProxy.position.set(-4, 1.5, 0); // user manual change
            birdProxy.scale.set(0.3, 0.3, 0.3);

            // --- Alignment Puzzle Logic ---
            if (!this.store.puzzle.isBirdPuzzleSolved) {
                // Normalize rotation angles to [0, 2PI] then check distance to [0, 0]
                const rotX = ((birdProxy.rotation.x % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
                const rotY = ((birdProxy.rotation.y % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);

                const threshold = 0.15; // Tolerance
                const isAligned = (Math.abs(rotX) < threshold || Math.abs(rotX - Math.PI * 2) < threshold) &&
                                  (Math.abs(rotY) < threshold || Math.abs(rotY - Math.PI * 2) < threshold);

                if (isAligned) {
                    if (!this.puzzleTimer) this.puzzleTimer = performance.now();
                    const duration = performance.now() - this.puzzleTimer;

                    if (duration > 2000) { // 2 Seconds
                        this.store.puzzle.isBirdPuzzleSolved = true;
                        this.world.uiManager.setStatus("ALIGNMENT CORRECT - A MECHANISM ACTIVATED");
                        console.log("Bird Puzzle Solved!");
                    }
                } else {
                    this.puzzleTimer = null;
                }
            }
        } else {
            birdProxy.visible = false;
        }

        // --- Handle Closet (Shelf) Transition ---
        if (this.store.puzzle.isBirdPuzzleSolved) {
            const shelf = this.mainScene.objects.room.shelf;
            if (shelf) {
                const targetX = -1.5; // -3.5 + 2.0 (User manual fix)
                if (Math.abs(shelf.position.x - targetX) > 0.01) {
                    shelf.position.x = THREE.MathUtils.lerp(shelf.position.x, targetX, 0.02);
                }
            }
        }

        // --- Handle Secret Square Transition ---
        if (this.store.puzzle.isSecretSquareTriggered) {
            const square = this.mainScene.objects.room.secretSquare;
            if (square) {
                const targetX = (this.mainScene.objects.room.size / 2) - 0.05; 
                const targetZ = 3.0; // 2.0 (base) + 1.0 (width)

                // Step 1: Push/Pull (-0.05 X offset)
                if (Math.abs(square.position.x - targetX) > 0.001) {
                    square.position.x = THREE.MathUtils.lerp(square.position.x, targetX, 0.05);
                } else {
                    // Step 2: Slide (move by width in Z)
                    if (Math.abs(square.position.z - targetZ) > 0.001) {
                        square.position.z = THREE.MathUtils.lerp(square.position.z, targetZ, 0.05);
                    }
                }
            }
        }
    }

    updateClamping() {
        if (!this.store.camera.camClampingDisabled) {
            const limitX = 4.8, limitZ = 4.8, limitYTop = 3.5, limitYBottom = -1.5;
            this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, -limitX, limitX);
            this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, -limitZ, limitZ);
            this.camera.position.y = THREE.MathUtils.clamp(this.camera.position.y, limitYBottom, limitYTop);
        }
    }

    updatePuzzleBoxMovement() {
        const pBox = this.mainScene.objects.pBox;
        if (this.store.puzzle.isMovingPuzzleBox && pBox) {
            const worldPos = new THREE.Vector3();
            pBox.group.getWorldPosition(worldPos);
            
            const camOffset = new THREE.Vector3(0, 1.5, 1.2).applyQuaternion(this.mainScene.objects.cabinet.group.quaternion);
            const targetCamPos = worldPos.clone().add(camOffset);
            
            this.camera.position.lerp(targetCamPos, 0.3);
            this.controls.target.lerp(worldPos, 0.3);
            
            pBox.group.position.lerp(this.store.puzzle.pBoxTargetPos, 0.05);
            
            if (pBox.group.position.distanceTo(this.store.puzzle.pBoxTargetPos) < 0.1) {
                this.store.puzzle.isMovingPuzzleBox = false;
                this.store.puzzle.isBoxOnPedestal = true;
                this.world.uiManager.setStatus("BOX PLACED ON PEDESTAL - READY FOR INSPECTION");
                
                this.store.zoomTo(this.store.puzzle.pBoxTargetPos, 2.5, null, new THREE.Vector3(0, 1.5, 0.8));
                
                this.controls.minAzimuthAngle = -Infinity;
                this.controls.maxAzimuthAngle = Infinity;
                this.controls.minPolarAngle = 0;
                this.controls.maxPolarAngle = Math.PI * 0.75;
            }
        }
    }
}
