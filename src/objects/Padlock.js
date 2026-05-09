import * as THREE from 'three';
import { ModelLoader } from '../utils/ModelLoader.js';
import * as CANNON from 'cannon-es';

/**
 * Handles the visual model, bone animation, and hitboxes for the combination padlock.
 */
export class Padlock {
    constructor(parentDrawer, loadingManager, world, cabinet) {
        this.parent = parentDrawer;
        this.loadingManager = loadingManager;
        this.world = world;
        this.cabinet = cabinet;
        this.modelLoader = new ModelLoader(this.loadingManager);
        this.group = new THREE.Group();
        this.wheels = [];
        this.model = null;
        this.button = null;
        this.shackle = null;
        this.isLoaded = false;
        this.group.userData.isPadlock = true;
        
        this.physicsBody = null;
        this.anchorBody = null;
        this.constraint = null;
        this._isFalling = false;
        this.mixer = null;
        this.openAction = null;

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

            const wheelsFound = [];

            this.model.traverse((child) => {
                if (child.isBone && child.name.startsWith('Round')) {
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

                if (child.isMesh) {
                    child.castShadow = false;
                    child.receiveShadow = false;
                    child.userData.noShadow = true;
                    
                    if (child.name.toLowerCase().includes('shadow')) {
                        child.visible = false;
                    }
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

            // Add hitBox to side button
            if (this.button) {
                const buttonHitBox = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 0.5, 0.5),
                    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
                );
                // We set the flag on the hitbox so the raycaster finds it
                buttonHitBox.userData = { isPadlockButton: true, isButtonMesh: true };
                this.button.add(buttonHitBox);
            }

            this.model.scale.set(0.4, 0.4, 0.4);
            this.model.rotation.y = 0; // Rotated 180 degrees from Math.PI
            
            // --- Animations ---
            this.mixer = new THREE.AnimationMixer(this.model);
            const openClip = gltf.animations.find(a => a.name === 'Open');
            if (openClip) {
                this.openAction = this.mixer.clipAction(openClip);
                this.openAction.setLoop(THREE.LoopOnce);
                this.openAction.clampWhenFinished = true;
                this.openAction.timeScale = 4.0; // Speed it up (it was very slow)
            }

            this.isLoaded = true;
        } catch (error) {
            console.error('Failed to load Padlock model:', error);
        }

        this.parent.add(this.group);

        // --- Physics Implementation ---
        if (this.world && this.world.physicsSystem) {
            const worldPos = new THREE.Vector3();
            this.group.getWorldPosition(worldPos);

            // Create Padlock Body
            this.physicsBody = new CANNON.Body({
                mass: 0.5,
                shape: new CANNON.Box(new CANNON.Vec3(0.05, 0.1, 0.03)),
                linearDamping: 0.1,
                angularDamping: 0.1
            });
            this.physicsBody.position.copy(worldPos);
            this.world.physicsSystem.addBody(this.group, this.physicsBody);

            // Attach to world scene so physics sync works in world space
            this.world.scene.attach(this.group);

            // Create Anchor
            this.anchorBody = new CANNON.Body({ mass: 0, type: CANNON.Body.STATIC });
            const anchorPos = worldPos.clone().add(new THREE.Vector3(0, 0.12, 0));
            this.anchorBody.position.copy(anchorPos);
            this.world.physicsSystem.physicsWorld.addBody(this.anchorBody);

            // Constraint
            this.constraint = new CANNON.PointToPointConstraint(
                this.physicsBody,
                new CANNON.Vec3(0, 0.12, 0),
                this.anchorBody,
                new CANNON.Vec3(0, 0, 0)
            );
            this.world.physicsSystem.addConstraint(this.constraint);
        }
    }

    update(isUnlocked, delta) {
        if (!this.isLoaded) return;

        // Update Mixer
        if (this.mixer) this.mixer.update(delta);

        // Update Physics Anchor to follow drawer movement (if not falling)
        // Update Physics Anchor to follow drawer movement (if not falling)
        if (this.anchorBody && !this._isFalling) {
            // Find the front panel to get accurate Z position
            const frontPanel = this.parent.children[0];
            const t = this.cabinet.config.thickness;
            const zPos = frontPanel.position.z + t / 2 + 0.02;
            
            const localAnchor = new THREE.Vector3(0, 0.07, zPos);
            this.parent.localToWorld(localAnchor);
            this.anchorBody.position.copy(localAnchor);
        }
        
        if (isUnlocked && this.group.visible) {
            // 1. Play animation
            if (this.openAction && !this.openAction.isRunning() && this.openAction.time === 0) {
                this.openAction.play();
            }
            
            if (this.openAction) {
                const duration = this.openAction.getClip().duration;
                const currentTime = this.openAction.time;
                const threshold = duration * 0.8;
                
                const isDone = currentTime > threshold;

                if (isDone && !this._isFalling && this.world && this.world.physicsSystem && this.constraint) {
                    this._isFalling = true;
                    this.world.physicsSystem.physicsWorld.removeConstraint(this.constraint);
                    
                    // Add a bigger nudge (pop up and forward)
                    this.physicsBody.velocity.set(0, 2.5, 2.0); 
                    this.physicsBody.angularVelocity.set(
                        Math.random() * 10 - 5,
                        Math.random() * 10 - 5,
                        Math.random() * 10 - 5
                    );
                }
            } else {
                // Fallback if no animation clip found
                if (!this._isFalling && this.world && this.world.physicsSystem && this.constraint) {
                    this._isFalling = true;
                    this.world.physicsSystem.physicsWorld.removeConstraint(this.constraint);
                    this.physicsBody.velocity.set(0, 1, 1);
                }
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
