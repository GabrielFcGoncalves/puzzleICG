import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { store } from '../store/Store.js';

export class InspectionScene {
    constructor(renderer) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100);
        this.controls = new OrbitControls(this.camera, renderer.domElement);
        this.currentInspectedGroup = null;

        this.init();
    }

    init() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 3.5));
        const iLight = new THREE.DirectionalLight(0xffffff, 6);
        iLight.position.set(2, 5, 2);
        this.scene.add(iLight);

        const iFillLight = new THREE.DirectionalLight(0xffffff, 2.5);
        iFillLight.position.set(-2, -2, 2);
        this.scene.add(iFillLight);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.draggedPart = null;
        this.dragOffset = 0;
        this.clock = new THREE.Clock();
    }

    open(itemData) {
        console.log("Opening Inspection for:", itemData.name);
        if (this.currentInspectedGroup) this.scene.remove(this.currentInspectedGroup);

        this.currentInspectedItem = itemData.instance;
        this.currentInspectedGroup = itemData.instance.cloneGroup();
        this.currentInspectedGroup.position.set(0, 0, 0);
        this.currentInspectedGroup.rotation.set(0, 0, 0);

        // Ensure all materials are visible and not too transparent
        this.currentInspectedGroup.traverse(node => {
            if (node.isMesh) {
                if (node.userData.isHitBox) {
                    node.visible = false;
                    return;
                }
                node.material = node.material.clone();
                node.material.transparent = false;
                node.material.opacity = 1.0;
            }
        });

        // Compute bounding box after a short delay or force update to ensure meshes are ready
        this.currentInspectedGroup.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(this.currentInspectedGroup);
        
        if (box.isEmpty()) {
            console.warn("Item box is empty, possible loading issue for:", itemData.name);
            // Fallback: use a default distance
            this.camera.position.set(0, 0, 1);
        } else {
            const sphere = box.getBoundingSphere(new THREE.Sphere());
            const center = box.getCenter(new THREE.Vector3());
            this.currentInspectedGroup.position.sub(center);

            const fov = this.camera.fov * (Math.PI / 180);
            const dist = (sphere.radius || 0.5) / Math.sin(fov / 2);
            this.camera.position.set(0, 0, dist * 1.2);
        }

        this.controls.target.set(0, 0, 0);
        this.controls.update();

        this.scene.add(this.currentInspectedGroup);
        
        if (itemData.instance.animations) {
            this.mixer = new THREE.AnimationMixer(this.currentInspectedGroup);
            this.actions = {};
            itemData.instance.animations.forEach(clip => {
                this.actions[clip.name] = this.mixer.clipAction(clip);
            });
        } else {
            this.mixer = null;
            this.actions = {};
        }
    }

    handleMouseDown(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const hits = this.raycaster.intersectObjects(this.scene.children, true);
        if (hits.length > 0) {
            let obj = hits[0].object;
            console.log("Clicked Inspection Part:", obj.name, obj.userData);
            
            // Check if it's the gem
            let tempObj = obj;
            let isGem = false;
            while (tempObj && tempObj !== this.scene) {
                if (tempObj.userData.itemData && tempObj.userData.itemData.name === 'Gemstone') {
                    isGem = true;
                    // Find the gem's root group in the clone (direct child of chest)
                    let itemGrp = tempObj;
                    while (itemGrp && itemGrp.parent && itemGrp.parent !== this.currentInspectedGroup) {
                        itemGrp = itemGrp.parent;
                    }
                    // Remove the clone from inspection scene
                    if (itemGrp && itemGrp.parent) {
                        itemGrp.parent.remove(itemGrp);
                    }
                    // Call store to pick up the original and add to inventory
                    if (this.currentInspectedItem && this.currentInspectedItem.blueGem) {
                        store.pickupItem(this.currentInspectedItem.blueGem.group);
                        
                        // Remove chest from inventory after gem is taken
                        const chestIndex = store.ui.inventory.findIndex(i => i.instance === this.currentInspectedItem);
                        if (chestIndex !== -1) {
                            store.ui.inventory.splice(chestIndex, 1);
                            if (store.uiManager) {
                                store.uiManager.updateInventory(store.ui.inventory);
                            }
                        }
                    } else {
                        store.pickupItem(tempObj);
                    }
                    return true;
                }
                tempObj = tempObj.parent;
            }

            // If not gem, and specific part is clicked, play animations
            if (!isGem && obj.name === 'Small_Chest_Small_Chest_PBR_0003' && this.actions) {
                if (this.actions['OpenTopPart']) {
                    this.actions['OpenTopPart'].setLoop(THREE.LoopOnce);
                    this.actions['OpenTopPart'].clampWhenFinished = true;
                    this.actions['OpenTopPart'].play();
                }
                if (this.actions['OpenLock']) {
                    this.actions['OpenLock'].setLoop(THREE.LoopOnce);
                    this.actions['OpenLock'].clampWhenFinished = true;
                    this.actions['OpenLock'].play();
                }
                return true;
            }
        }
        return false;
    }

    handleMouseMove(event) {
        if (!this.draggedPart) return false;

        const deltaY = event.clientY - this.startY;
        // Map deltaY to rotation (dragging up rotates it out/up)
        const sensitivity = 0.01;
        
        if (this.draggedPart.userData.isTreasureLock) {
            let newRot = this.startRotationX + deltaY * sensitivity;
            
            // Clamp rotation
            const minRot = Math.min(this.draggedPart.userData.restRotationX, this.draggedPart.userData.openedRotationX);
            const maxRot = Math.max(this.draggedPart.userData.restRotationX, this.draggedPart.userData.openedRotationX);
            
            newRot = Math.max(minRot, Math.min(maxRot, newRot));
            this.draggedPart.rotation.x = newRot;

            // Check if opened enough to trigger state
            const progress = (newRot - this.draggedPart.userData.restRotationX) / (this.draggedPart.userData.openedRotationX - this.draggedPart.userData.restRotationX);
            this.draggedPart.userData.isOpen = progress > 0.8;
        }

        return true;
    }

    handleMouseUp() {
        if (this.draggedPart) {
            this.draggedPart = null;
            this.controls.enabled = true;
            return true;
        }
        return false;
    }

    update() {
        this.controls.update();
        const delta = this.clock.getDelta();
        if (this.mixer) {
            this.mixer.update(delta);
        }
    }

    render(renderer) {
        renderer.render(this.scene, this.camera);
    }
}
