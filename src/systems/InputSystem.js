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
        }
    }

    handleGlobalMouseUp(e) {
        if (this.store.ui.draggedInventoryIndex === -1) return;

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
            let hitObj = hits[0].object;
            this.processDrop(hitObj, itemData);
        }

        this.store.ui.draggedInventoryIndex = -1;
        this.world.uiManager.hideDragOverlay();
    }

    processDrop(hitObj, itemData) {
        // Cabinet Drop Logic (Key)
        let cabinetSearch = hitObj;
        let targetCabinetDrawer = null;
        while (cabinetSearch) {
            if (this.world.cabinet.drawerGroups.includes(cabinetSearch)) {
                targetCabinetDrawer = cabinetSearch;
                break;
            }
            cabinetSearch = cabinetSearch.parent;
        }

        if (targetCabinetDrawer) {
            const drawerIndex = this.world.cabinet.drawerGroups.indexOf(targetCabinetDrawer);
            if (drawerIndex === 0 && itemData.name === 'Old Key' && !this.world.cabinet.isKeyInserted) {
                this.world.cabinet.isKeyInserted = true;
                this.world.cabinet.keyPivot.visible = true;
                this.world.uiManager.setStatus("KEY INSERTED - DRAG IT TO TURN");
                this.store.ui.inventory.splice(this.store.ui.draggedInventoryIndex, 1);
            }
        }

        // Stand Drop Logic (Flashlight)
        let standSearch = hitObj;
        let targetStand = null;
        while (standSearch) {
            if (standSearch.userData.isStand) {
                targetStand = standSearch;
                break;
            }
            standSearch = standSearch.parent;
        }

        if (targetStand && itemData.name === 'Old Flashlight') {
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
}
