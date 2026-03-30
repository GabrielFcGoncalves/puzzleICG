import * as THREE from 'three';
import { ModelLoader } from '../utils/ModelLoader.js';

/**
 * Handles the visual model, bone animation, and hitboxes for the combination padlock.
 */
export class Padlock {
    constructor(parentDrawer, loadingManager) {
        this.parent = parentDrawer;
        this.loadingManager = loadingManager;
        this.modelLoader = new ModelLoader(this.loadingManager);
        this.group = new THREE.Group();
        this.wheels = [];
        this.model = null;
        this.button = null;
        this.shackle = null;
        this.isLoaded = false;
        this.group.userData.isPadlock = true;
        
        this.init();
    }

    async init() {
        const padlockPath = new URL('../models/padlock/scene.gltf', import.meta.url).href;

        try {
            const gltf = await this.modelLoader.load(padlockPath, {
                materialCallback: (node) => {
                    if (node.name.startsWith('Round') && node.material) {
                        node.material.roughness = 1;
                        node.material.metalness = 0;
                    }
                }
            });
            this.model = gltf.scene;
            this.group.add(this.model);
            this.group.scale.set(0.3, 0.3, 0.3);
            this.group.rotation.y = Math.PI;

            const wheelsFound = [];

            this.model.traverse((child) => {
                if (child.isBone) {
                    wheelsFound.push(child);
                }
                if (child.name === 'Button_5') {
                    this.button = child;
                    child.userData.isPadlockButton = true;
                    child.userData.restPos = child.position.x;
                    child.userData.pressedPos = child.position.x + 0.05; // Slightly pressed to the right
                }

                if (child.name === 'MetalPipe_6') {
                    this.shackle = child;
                    child.userData.restPos = child.position.y;
                    child.userData.openedPos = child.position.y + 0.5;
                }
            });

            // Sort bones to match index 0-3
            wheelsFound.sort((a, b) => a.name.localeCompare(b.name));
            this.wheels = wheelsFound;

            this.wheels.forEach((bone, index) => {
                bone.userData.index = index;
                bone.userData.targetRot = 0;
                bone.userData.isPadlockWheel = true;

                // Add a hitBox for interaction (since Bones aren't intersected directly)
                const hitBox = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 0.5, 0.5),
                    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
                );
                hitBox.userData = { index: index, isPadlockWheel: true };
                bone.add(hitBox);
            });

            this.model.scale.set(0.4, 0.4, 0.4);
            this.model.rotation.y = Math.PI; // Face the player
            
            this.isLoaded = true;
        } catch (error) {
            console.error('Failed to load Padlock model:', error);
        }

        this.parent.add(this.group);
    }

    update(isUnlocked) {
        if (!this.isLoaded) return;
        
        if (isUnlocked && this.shackle && this.group.visible) {
            this.shackle.position.y = THREE.MathUtils.lerp(this.shackle.position.y, this.shackle.userData.openedPos, 0.05);
            if (this.shackle.position.y > this.shackle.userData.openedPos - 0.02 && !this._hideRequested) {
                this._hideRequested = true;
                setTimeout(() => this.setVisible(false), 1000);
            }
        }
        // Smoothly animate wheel rotation
        this.wheels.forEach((w) => {
            w.rotation.x = THREE.MathUtils.lerp(w.rotation.x, w.userData.targetRot, 0.15);
        });

        if (this.button && this.button.userData.isPressed) {
            this.button.position.x = THREE.MathUtils.lerp(this.button.position.x, this.button.userData.pressedPos, 0.2);
            if (Math.abs(this.button.position.x - this.button.userData.pressedPos) < 0.01) {
                this.button.userData.isPressed = false;
            }
        } else if (this.button && this.button.userData.restPos !== undefined) {
            this.button.position.x = THREE.MathUtils.lerp(this.button.position.x, this.button.userData.restPos, 0.1);
        }
    }

    setVisible(visible) {
        this.group.visible = visible;
    }
}
