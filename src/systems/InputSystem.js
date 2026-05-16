import * as THREE from 'three';
import { handleDoubleClick } from '../listeners/DoubleClick.js';
import { handleMouseDown } from '../listeners/MouseDown.js';
import { handleMouseMove } from '../listeners/MouseMove.js';
import { handleMouseUp } from '../listeners/MouseUp.js';
import { handleKeyDown } from '../listeners/KeyDown.js';
import { handleResize } from '../listeners/Resize.js';
import { handleContextMenu } from '../listeners/ContextMenu.js';
import { handleControlsStart } from '../listeners/ControlsHandlers.js';
import { Flashlight } from '../objects/Flashlight.js';
import { MetalWeight } from '../objects/MetalWeight.js';

export class InputSystem {
    constructor(world) {
        this.world = world;
        this.store = world.store;
        this.camera = world.camera;
        this.scene = world.scene;
        this.renderer = world.renderer;
        this.controls = world.controls;
        this.raycaster = world.raycaster;
        this.mouse = world.mouse;

        this.init();
    }

    init() {
        // Scene Click Listeners
        globalThis.addEventListener('dblclick', (e) => handleDoubleClick(e, this.world));
        globalThis.addEventListener('mousedown', (e) => handleMouseDown(e, this.world));
        globalThis.addEventListener('mousemove', (e) => handleMouseMove(e, this.world));
        globalThis.addEventListener('mouseup', (e) => handleMouseUp(e, this.world));
        globalThis.addEventListener('keydown', (e) => handleKeyDown(e, this.world));

        // Inventory Drag/Drop Listeners
        globalThis.addEventListener('mousemove', (e) => this.handleGlobalMouseMove(e));
        globalThis.addEventListener('mouseup', (e) => this.handleGlobalMouseUp(e));

        // Config other listeners
        globalThis.addEventListener('resize', (e) => handleResize(e, this.world));
        globalThis.addEventListener('contextmenu', (e) => handleContextMenu(e, this.world));
        this.controls.addEventListener('start', () => handleControlsStart(this.world));
    }

    handleGlobalMouseMove(e) {
        if (this.store.ui.draggedInventoryIndex !== -1) {
            this.world.uiManager.updateDragOverlay(e.clientX, e.clientY);

            // Raycast for preview
            this.mouse.x = (e.clientX / globalThis.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / globalThis.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);

            const hits = this.raycaster.intersectObjects(this.scene.children, true);
            if (hits.length > 0) {
                const target = this.findInteractionTarget(hits[0].object);
                this.store.interaction.hoveredSlot = target;
                
                const itemData = this.store.ui.inventory[this.store.ui.draggedInventoryIndex];
                if (target && target.userData.isScalePlate && itemData && itemData.name.includes('Weight')) {
                    this.updatePreview(target, itemData.instance);
                } else {
                    this.removePreview();
                }
            } else {
                this.store.interaction.hoveredSlot = null;
                this.removePreview();
            }
        } else if (this.store.interaction.isDraggingWeight) {
            // World dragging from plate!
            this.mouse.x = (e.clientX / globalThis.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / globalThis.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);

            const hits = this.raycaster.intersectObjects(this.scene.children, true);
            if (hits.length > 0) {
                const target = this.findInteractionTarget(hits[0].object);
                this.store.interaction.hoveredSlot = target;
                
                const weightInstance = this.store.interaction.draggedWeight;
                if (target && target.userData.isScalePlate && weightInstance) {
                    this.updatePreview(target, weightInstance);
                } else {
                    this.removePreview();
                }
            } else {
                this.store.interaction.hoveredSlot = null;
                this.removePreview();
            }
        }
    }

    findInteractionTarget(hitObj) {
        let search = hitObj;
        while (search) {
            if (search.userData.isLock || search.userData.isStand || search.userData.isPainting || search.userData.isScalePlate) {
                return search;
            }
            search = search.parent;
        }
        return null;
    }

    handleGlobalMouseUp(e) {
        if (this.store.ui.draggedInventoryIndex !== -1) {
            const slots = this.world.uiManager.slots;
            if (slots[this.store.ui.draggedInventoryIndex]) {
                slots[this.store.ui.draggedInventoryIndex].style.opacity = '1';
            }

            const itemData = this.store.ui.inventory[this.store.ui.draggedInventoryIndex];

            // Raycast for drop target
            this.mouse.x = (e.clientX / globalThis.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / globalThis.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);

            const hits = this.raycaster.intersectObjects(this.scene.children, true);
            if (hits.length > 0) {
                const target = this.findInteractionTarget(hits[0].object);
                this.processDrop(target, itemData);
            }

            this.store.interaction.hoveredSlot = null;
            this.store.ui.draggedInventoryIndex = -1;
            this.world.uiManager.hideDragOverlay();
            this.removePreview();
        } else if (this.store.interaction.isDraggingWeight) {
            // World dragging drop!
            this.mouse.x = (e.clientX / globalThis.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / globalThis.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);

            const hits = this.raycaster.intersectObjects(this.scene.children, true);
            const target = hits.length > 0 ? this.findInteractionTarget(hits[0].object) : null;
            
            const weightInstance = this.store.interaction.draggedWeight;
            const weightGroup = this.store.interaction.draggedWeightGroup;
            
            if (target && target.userData.isScalePlate && weightInstance) {
                const plateId = target.userData.plateId;
                console.log("DRAG DROP: Target detected:", target.name, "PlateId:", plateId);
                const puzzleBox = target.userData.puzzleBoxInstance;
                const oldPlateId = weightGroup.userData.onPlateId;
                const oldPuzzleBox = weightGroup.userData.puzzleBox;
                
                if (oldPuzzleBox && oldPlateId) {
                    oldPuzzleBox.removeWeightFromPlate(oldPlateId, weightInstance);
                }
                
                puzzleBox.addWeightToPlate(plateId, weightInstance);
                weightGroup.visible = true; // Restore visibility
                this.world.uiManager.setStatus(`Moved weight to Plate ${plateId}`);
            } else {
                // Return to old plate if dropped in invalid spot
                if (weightGroup) {
                    weightGroup.visible = true;
                }
            }
            
            this.store.interaction.isDraggingWeight = false;
            this.store.interaction.draggedWeight = null;
            this.store.interaction.draggedWeightGroup = null;
            this.store.interaction.hoveredSlot = null;
            this.removePreview();
            this.controls.enabled = true; // Re-enable controls
            this.renderer.domElement.classList.remove('grabbing');
        }
    }

    processDrop(target, itemData) {
        if (!target) return;

        // Scale Plate Drop Logic
        if (target.userData.isScalePlate && itemData.name.includes('Weight')) {
            const plateId = target.userData.plateId;
            console.log("INVENTORY DROP: Target detected:", target.name, "PlateId:", plateId);
            const itemInstance = itemData.instance;
            
            target.userData.puzzleBoxInstance.addWeightToPlate(plateId, itemInstance);
            
            this.world.uiManager.setStatus(`ADDED ${itemInstance.weightType}g TO PLATE ${plateId}`);
            this.store.ui.inventory.splice(this.store.ui.draggedInventoryIndex, 1);
            this.world.uiManager.updateInventory(this.store.ui.inventory);
            return;
        }

        // Cabinet Drop Logic (Key)
        if (target.userData.isLock && itemData.name === 'Old Key' && !this.world.cabinet.isKeyInserted) {
            this.world.cabinet.isKeyInserted = true;
            this.world.cabinet.keyPivot.visible = true;
            this.world.uiManager.setStatus("KEY INSERTED - DRAG IT TO TURN");
            this.store.ui.inventory.splice(this.store.ui.draggedInventoryIndex, 1);
        }

        // Stand Drop Logic (Flashlight)
        if (target.userData.isStand && itemData.name === 'Old Flashlight') {
            const f = new Flashlight(this.world.loadingManager);
            f.setPosition(-1.1, 1.15, 0); 
            f.group.scale.set(1.2, 1.2, 1.2);
            f.group.rotation.y = -Math.PI/2;
            f.group.rotation.z = Math.PI/14;
            
            f.group.userData.isItem = false;
            f.group.userData.isPickupable = false;
            f.group.userData.isStaticPuzzlePart = true;
            f.group.userData.isMountedFlashlight = true;
            f.group.userData.itemInstance = f;
            
            this.scene.add(f.group);
            this.world.mainScene.enableShadows(f.group);
            
            this.world.uiManager.setStatus("FLASHLIGHT MOUNTED ON STAND");
            this.store.ui.inventory.splice(this.store.ui.draggedInventoryIndex, 1);
        }

        // Update UI slots
        this.world.uiManager.updateInventory(this.store.ui.inventory);
    }

    updatePreview(target, weightInstance) {
        if (!this.previewMesh) {
            // Instead of cloning to avoid circular reference errors in userData, create a fresh instance!
            const previewWeight = new MetalWeight(weightInstance.weightType);
            this.previewMesh = previewWeight.group;
            
            this.previewMesh.traverse(n => {
                if (n.isMesh) {
                    n.material = n.material.clone();
                    n.material.transparent = true;
                    n.material.opacity = 0.5;
                    n.castShadow = false;
                    n.receiveShadow = false;
                }
            });
            const puzzleBox = target.userData.puzzleBoxInstance;
            if (puzzleBox) {
                puzzleBox.group.add(this.previewMesh);
            } else {
                this.scene.add(this.previewMesh);
            }
        }
        
        const puzzleBox = target.userData.puzzleBoxInstance;
        const plateId = target.userData.plateId;
        
        if (puzzleBox && plateId) {
            const worldPos = new THREE.Vector3();
            
            // Use bounding box center to get the true visual center of the plate!
            const box = new THREE.Box3().setFromObject(target);
            box.getCenter(worldPos);
            
            const localPos = puzzleBox.group.worldToLocal(worldPos.clone());
            
            const numWeights = puzzleBox.plateVisuals[plateId].length;
            const fixedOffsets = [
                {x: 0, z: 0},
                {x: 0.05, z: 0.05},
                {x: -0.05, z: -0.05},
                {x: -0.05, z: 0.05},
                {x: 0.05, z: -0.05}
            ];
            const offset = fixedOffsets[numWeights % fixedOffsets.length];
            
            this.previewMesh.position.set(localPos.x + offset.x, localPos.y + 0.005, localPos.z + offset.z);
            this.previewMesh.scale.setScalar(0.4 / 1.75); 
        } 
    }

    removePreview() {
        if (this.previewMesh) {
            if (this.previewMesh.parent) {
                this.previewMesh.parent.remove(this.previewMesh);
            }
            this.previewMesh.traverse(n => {
                if (n.isMesh) n.material.dispose();
            });
            this.previewMesh = null;
        }
    }
}
