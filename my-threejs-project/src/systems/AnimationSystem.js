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

        if (this.store.state.isInspecting) {
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
        if (this.store.state.shadowNeedsRefresh) {
            this.mainScene.lights.desk.shadow.needsUpdate = true;
            this.mainScene.lights.lamp.shadow.needsUpdate = true;
            this.mainScene.lights.left.shadow.needsUpdate = true;

            const time = performance.now();
            if (time > 5000) {
                this.store.state.shadowNeedsRefresh = false;
                console.log("SHADOW MAPS BAKED AND FROZEN");
            }
        }
    }

    updateTransitions() {
        if (this.store.state.isTransitioning) {
            this.controls.target.lerp(this.store.state.targetFocus, 0.1);
            this.camera.position.lerp(this.store.state.cameraFocus, 0.1);

            if (this.camera.position.distanceTo(this.store.state.cameraFocus) < 0.01 &&
                this.controls.target.distanceTo(this.store.state.targetFocus) < 0.01) {
                this.store.state.isTransitioning = false;
            }
        }
    }

    updateMainScene() {
        this.mainScene.update();
        this.mainScene.objects.cabinet.update(
            this.store.state.isEthereal,
            this.store.state.isHintMode,
            this.world.uiManager.statusElement,
            this.world
        );
        this.mainScene.objects.room.update(this.store.state.isEthereal);
    }

    updateBirdProxy() {
        const birdProxy = this.mainScene.birdProxy;
        if (this.store.state.showBirdInFocus && birdProxy && birdProxy.children.length > 0) {
            birdProxy.visible = true;
            birdProxy.position.set(-4, 3, 0);
            birdProxy.scale.set(0.3, 0.3, 0.3);
        } else {
            birdProxy.visible = false;
        }
    }

    updateClamping() {
        if (!this.store.state.camClampingDisabled) {
            const limitX = 4.8, limitZ = 4.8, limitYTop = 3.5, limitYBottom = -1.5;
            this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, -limitX, limitX);
            this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, -limitZ, limitZ);
            this.camera.position.y = THREE.MathUtils.clamp(this.camera.position.y, limitYBottom, limitYTop);
        }
    }

    updatePuzzleBoxMovement() {
        const pBox = this.mainScene.objects.pBox;
        if (this.store.state.isMovingPuzzleBox && pBox) {
            const worldPos = new THREE.Vector3();
            pBox.group.getWorldPosition(worldPos);
            
            const camOffset = new THREE.Vector3(0, 1.5, 1.2).applyQuaternion(this.mainScene.objects.cabinet.group.quaternion);
            const targetCamPos = worldPos.clone().add(camOffset);
            
            this.camera.position.lerp(targetCamPos, 0.3);
            this.controls.target.lerp(worldPos, 0.3);
            
            pBox.group.position.lerp(this.store.state.pBoxTargetPos, 0.05);
            
            if (pBox.group.position.distanceTo(this.store.state.pBoxTargetPos) < 0.1) {
                this.store.state.isMovingPuzzleBox = false;
                this.store.state.isBoxOnPedestal = true;
                this.world.uiManager.setStatus("BOX PLACED ON PEDESTAL - READY FOR INSPECTION");
                
                this.store.zoomTo(this.store.state.pBoxTargetPos, 2.5, null, new THREE.Vector3(0, 1.5, 0.8));
                
                this.controls.minAzimuthAngle = -Infinity;
                this.controls.maxAzimuthAngle = Infinity;
                this.controls.minPolarAngle = 0;
                this.controls.maxPolarAngle = Math.PI * 0.75;
            }
        }
    }
}
