import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { Cabinet } from './objects/Cabinet.js';
import { Room } from './objects/Room.js';
import { PuzzleBox } from './objects/PuzzleBox.js';
import { Candle } from './objects/Candle.js';
import { WallChandelier } from './objects/WallChandelier.js';
import { Stand } from './objects/Stand.js';
import { Flashlight } from './objects/Flashlight.js';
import { createRenderer, handleResize } from './systems/Renderer.js';

import { handleDoubleClick } from './listeners/DoubleClick.js';
import { handleMouseDown } from './listeners/MouseDown.js';
import { handleMouseMove } from './listeners/MouseMove.js';
import { handleMouseUp } from './listeners/MouseUp.js';
import { handleKeyDown } from './listeners/KeyDown.js';
import { handleResize as handleWindowResize } from './listeners/Resize.js';
import { handleContextMenu } from './listeners/ContextMenu.js';
import { handleControlsStart } from './listeners/ControlsHandlers.js';
import { VisibilityTool } from './utils/VisibilityTool.js';

// --- Scene and Camera ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 2, 4);

// --- Renderer ---
const renderer = createRenderer();

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.maxPolarAngle = Math.PI * 0.6; // Prevents camera from going below the floor horizon

// --- Performance Stats ---
const stats = new Stats();
document.body.appendChild(stats.dom);

// --- Lights ---
const ambientLight = new THREE.AmbientLight(0x666699, 1.2); // Much brighter ambiance
scene.add(ambientLight);

// Desk Area Light (Main Spotlight)
const deskLight = new THREE.SpotLight(0xa1874f, 100, 15, Math.PI/6, 0.5, 1);
deskLight.position.set(0, 4.5, 3.2); 
deskLight.target.position.set(0, -1, -1.5); 
scene.add(deskLight.target);
deskLight.castShadow = true;
deskLight.shadow.autoUpdate = false; 
deskLight.shadow.bias = -0.0001;
deskLight.shadow.normalBias = 0.02;
deskLight.shadow.mapSize.width = 512;
deskLight.shadow.mapSize.height = 512;
scene.add(deskLight);

// Oil Lamp above cabinet
const lampLight = new THREE.PointLight(0xff9900, 35, 10);
lampLight.position.set(0, 2.3, -4); 
lampLight.castShadow = true;
lampLight.shadow.autoUpdate = false; // Static shadow map
lampLight.shadow.bias = -0.0001;
lampLight.shadow.normalBias = 0.02;
lampLight.shadow.mapSize.width = 512;
lampLight.shadow.mapSize.height = 512;
scene.add(lampLight);

// --- Wall mounted Chandeliers ---
const chanRight = new WallChandelier(scene);
chanRight.setPosition(4.9, 1.5, 1);
chanRight.setRotation(-Math.PI / 2);

const chanLeft = new WallChandelier(scene);
chanLeft.setPosition(-4.9, 1.5, -1);
chanLeft.setRotation(Math.PI / 2);

const chanBack = new WallChandelier(scene);
chanBack.setPosition(0, 2, -4.9);

// Move the existing lights to match the new chandeliers
// deskLight is positioned at (0, 4.5, -1.5)
lampLight.position.set(0, 2.3, -4); 

// Additional light for the left side
const leftLight = new THREE.PointLight(0xffaa55, 40, 8);
leftLight.position.set(-4, 1.8, -1);
leftLight.castShadow = true;
leftLight.shadow.autoUpdate = false; // Static shadow map
leftLight.shadow.bias = -0.0001;
leftLight.shadow.normalBias = 0.02;
leftLight.shadow.mapSize.width = 512;
leftLight.shadow.mapSize.height = 512;
scene.add(leftLight);

// Flashlight (Warmer) remaining as is
const flashlight = new THREE.SpotLight(0xffd488, 30, 8, Math.PI / 6, 0.5, 2);
flashlight.castShadow = true; // Use shadows for camera light
flashlight.shadow.mapSize.width = 512;
flashlight.shadow.mapSize.height = 512;
flashlight.shadow.bias = -0.0001;
flashlight.shadow.normalBias = 0.02;
camera.add(flashlight);
flashlight.position.set(0, 0, 0);
const fTarget = new THREE.Object3D(); 
fTarget.position.set(0, 0, -1);
camera.add(fTarget);
flashlight.target = fTarget;

scene.add(camera);

// --- Inspection Scene ---
const inspectionScene = new THREE.Scene();
inspectionScene.background = new THREE.Color(0x000000);
const inspectionCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100);
const inspectionControls = new OrbitControls(inspectionCamera, renderer.domElement);
inspectionScene.add(new THREE.AmbientLight(0xffffff, 3.5)); // Much stronger ambient
const iLight = new THREE.DirectionalLight(0xffffff, 6); // Strong key light
iLight.position.set(2, 5, 2);
inspectionScene.add(iLight);

const iFillLight = new THREE.DirectionalLight(0xffffff, 2.5); // Soft fill light
iFillLight.position.set(-2, -2, 2);
inspectionScene.add(iFillLight);

let currentInspectedGroup = null;

// --- Axis Helper Scene (Compass) ---
const axisScene = new THREE.Scene();
const axisCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 10);
axisCamera.position.set(0, 0, 3);
const axesHelper = new THREE.AxesHelper(1);
axisScene.add(axesHelper);

const inspectionOverlay = document.getElementById('inspection-overlay');
const closeInspectionBtn = document.getElementById('close-inspection');



if (closeInspectionBtn) {
    closeInspectionBtn.onclick = () => {
        ctx.closeInspection();
    };
}


// --- Environment ---
const room = new Room(scene);

// --- Cabinet ---
const cabinet = new Cabinet(scene);
cabinet.group.position.z = -3.5; // Moved to the back wall

// --- Puzzle Box ---
const pBox = new PuzzleBox(scene);
cabinet.drawerGroups[0].add(pBox.group);
pBox.setPosition(0, -0.9, -0.4); // Centered inside the vault space
pBox.group.scale.set(1.2, 1.2, 1.2); // Slightly bigger for better visibility

// --- Pedestal Workspace ---
const stand = new Stand(scene);
stand.setPosition(-1.1, 0.07, 0); // Further left
stand.group.scale.set(1.5, 1.5, 1.5);

const flashlightObj = new Flashlight();
flashlightObj.group.rotation.y = Math.PI / 2;
flashlightObj.group.scale.set(1.1, 1.1, 1.1);
flashlightObj.setPosition(0.3, 0.4, -0.4); // On the top shelf inside the vault
cabinet.drawerGroups[0].add(flashlightObj.group);

// --- Utils ---
const enableShadows = (obj) => {
    obj.traverse(node => {
        if (node.isMesh) {
            // Ignore invisible interaction spheres (hitboxes)
            if (node.material && (node.material.opacity === undefined || node.material.opacity > 0)) {
                
                // --- Selective Shadow Logic ---
                const parent = node.parent;
                const isRoomPart = node.userData.isRoomPart || (parent && parent.userData.isRoomPart);
                const isSmallProp = node.userData.isSmallProp || (parent && parent.userData.isSmallProp);
                const isFurniture = node.userData.isFurniture || (parent && parent.userData.isFurniture);

                if (isRoomPart) {
                    node.castShadow = false;
                    node.receiveShadow = true;
                } else if (isSmallProp) {
                    node.castShadow = true;
                    node.receiveShadow = false;
                } else {
                    // Default for furniture, cabinet, etc.
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            } else {
                 node.castShadow = false;
                 node.receiveShadow = false;
            }
        }
    });
};

// --- Additional Tools ---
const vTool = new VisibilityTool(scene);

// Initial scene-wide shadow enable
enableShadows(scene);

// --- State Management ---
const state = {
    isEthereal: false,
    isDragging: false,
    isRotatingFooting: false,
    draggedDrawerIndex: -1,
    rotatedFooting: null,
    isTransitioning: false,
    targetFocus: new THREE.Vector3(0, 0, 0),
    cameraFocus: new THREE.Vector3(3, 2, 4),
    inventory: [],
    draggedInventoryIndex: -1,
    isHintMode: false,
    isInspecting: false,
    isZoomedOnFoot: false,
    isTurningKey: false,
    isMovingPuzzleBox: false,
    isBoxOnPedestal: false,
    camClampingDisabled: false,
    shadowNeedsRefresh: true,
    pBoxTargetPos: new THREE.Vector3(0, 0, 0),
};

const intersectionPoint = new THREE.Vector3();
const offset = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const statusElement = document.getElementById('status');
const cameraPosElement = document.getElementById('camera-pos');
const overlayElement = document.getElementById('ethereal-overlay');
const dragOverlay = document.getElementById('drag-overlay');

// --- Context for Listeners ---
const ctx = {
    state,
    camera,
    scene,
    renderer,
    controls,
    cabinet,
    raycaster,
    mouse,
    intersectionPoint,
    offset,
    statusElement,
    overlayElement,
    inspectionOverlay,
    openInspection: (itemData) => {
        if (currentInspectedGroup) inspectionScene.remove(currentInspectedGroup);

        currentInspectedGroup = itemData.instance.cloneGroup();
        currentInspectedGroup.position.set(0, 0, 0);
        currentInspectedGroup.rotation.set(0, 0, 0);

        // Scale it to be visible
        const box = new THREE.Box3().setFromObject(currentInspectedGroup);
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const center = box.getCenter(new THREE.Vector3());
        currentInspectedGroup.position.sub(center);

        const fov = inspectionCamera.fov * (Math.PI / 180);
        const dist = sphere.radius / Math.sin(fov / 2);
        inspectionCamera.position.set(0, 0, dist * 1.1);
        inspectionControls.target.set(0, 0, 0);

        inspectionScene.add(currentInspectedGroup);
        state.isInspecting = true;
        inspectionOverlay.style.display = 'block';
    },
    closeInspection: () => {
        state.isInspecting = false;
        inspectionOverlay.style.display = 'none';
    },
    handleResize,
    getHandles: () => {
        const handles = [];
        cabinet.drawerGroups.forEach(dg => {
            dg.traverse(child => {
                if (child.userData.drawerIndex !== undefined && !child.userData.isStaticPuzzlePart) {
                    handles.push(child);
                }
            });
        });
        return handles;
    },
    getStaticPuzzleParts: () => {
        const parts = [];
        scene.traverse(child => {
            if (child.userData.isStaticPuzzlePart) parts.push(child);
        });
        return parts;
    },
    getItems: () => {
        const items = [];
        scene.traverse(child => {
            if (child.userData.isItem) items.push(child);
        });
        return items;
    },
    zoomTo: (targetPos, zoomLevel = 1.5, lookAtPos = null, camOffset = new THREE.Vector3(0, 0.8, 1)) => {
        state.isTransitioning = true;
        state.targetFocus.copy(lookAtPos || targetPos);
        
        // Transform offset by cabinet orientation to keep it "relative"
        const transformedOffset = camOffset.clone().applyQuaternion(cabinet.group.quaternion);
        const dir = transformedOffset.normalize();
        state.cameraFocus.copy(targetPos).add(dir.multiplyScalar(zoomLevel));
    },
    resetZoom: () => {
        state.isTransitioning = true;
        state.targetFocus.set(0, 0, 0);
        state.cameraFocus.set(3, 2, 4);
        state.isZoomedOnFoot = false;
        state.camClampingDisabled = false;
        controls.enablePan = false;
        controls.minAzimuthAngle = -Infinity;
        controls.maxAzimuthAngle = Infinity;
        controls.minPolarAngle = 0;
        controls.maxPolarAngle = Math.PI * 0.6;
        controls.maxDistance = 20;
    },
    pickupItem: async (itemGroup) => {
        const item = itemGroup.userData.itemInstance;
        const name = item.name || 'Unknown Item';
        const thumbnail = await item.getThumbnail();

        state.inventory.push({ name, thumbnail, instance: item });

        // Remove from 3D scene
        if (itemGroup.parent) {
            itemGroup.parent.remove(itemGroup);
        }

        // Update Sidebar
        const slots = document.querySelectorAll('.slot');
        state.inventory.forEach((itemData, index) => {
            if (slots[index]) {
                const imgHTML = `<img src="${itemData.thumbnail}" style="width: 100%; height: 100%; pointer-events: none; object-fit: contain;">`;
                slots[index].innerHTML = imgHTML;
                slots[index].title = itemData.name;

                // Allow dragging or clicking
                let downTime = 0;
                slots[index].onmousedown = (e) => {
                    e.preventDefault();
                    downTime = Date.now();
                    state.draggedInventoryIndex = index;
                    dragOverlay.innerHTML = imgHTML;
                    dragOverlay.style.display = 'block';
                    dragOverlay.style.left = `${e.clientX - 180}px`;
                    dragOverlay.style.top = `${e.clientY - 100}px`;
                    slots[index].style.opacity = '0.3';
                };
                slots[index].onclick = (e) => {
                    const duration = Date.now() - downTime;
                    // If short click, open inspection
                    if (duration < 200) {
                        ctx.openInspection(itemData);
                    }
                };
            }
        });

        // Reset zoom
        ctx.resetZoom();
        ctx.statusElement.innerText = `STATUS: PICKED UP ${name.toUpperCase()}`;
    },
    detachCamera: () => {
        state.isTransitioning = false;
        state.camClampingDisabled = true;
        controls.enablePan = true;
        controls.screenSpacePanning = true;
        controls.minAzimuthAngle = -Infinity;
        controls.maxAzimuthAngle = Infinity;
        controls.minPolarAngle = 0;
        controls.maxPolarAngle = Math.PI;
        // Also increase max distance for freedom
        controls.maxDistance = 100;
        
        ctx.statusElement.innerText = "STATUS: CAMERA DETACHED - FREE FLY MODE";
    }
};

ctx.puzzleBox = pBox;

// --- Register Listeners ---
window.addEventListener('dblclick', (e) => handleDoubleClick(e, ctx));
window.addEventListener('mousedown', (e) => handleMouseDown(e, ctx));
window.addEventListener('mousemove', (e) => handleMouseMove(e, ctx));
window.addEventListener('mouseup', (e) => handleMouseUp(e, ctx));
window.addEventListener('keydown', (e) => handleKeyDown(e, ctx));

// Global MouseEvents for Inventory Dragging
window.addEventListener('mousemove', (e) => {
    if (state.draggedInventoryIndex !== -1) {
        dragOverlay.style.left = `${e.clientX - 180}px`;
        dragOverlay.style.top = `${e.clientY - 100}px`;
    }
});

window.addEventListener('mouseup', (e) => {
    if (state.draggedInventoryIndex !== -1) {
        const slots = document.querySelectorAll('.slot');
        if (slots[state.draggedInventoryIndex]) {
            slots[state.draggedInventoryIndex].style.opacity = '1';
        }

        const itemData = state.inventory[state.draggedInventoryIndex];

        // Raycast for drop target
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const hits = raycaster.intersectObjects(scene.children, true);
        if (hits.length > 0) {
            let hitObj = hits[0].object;

            // Check for Cabinet Drop (Key)
            let cabinetSearch = hitObj;
            let targetCabinetDrawer = null;
            while (cabinetSearch) {
                if (cabinet.drawerGroups.includes(cabinetSearch)) {
                    targetCabinetDrawer = cabinetSearch;
                    break;
                }
                cabinetSearch = cabinetSearch.parent;
            }

            if (targetCabinetDrawer) {
                const drawerIndex = cabinet.drawerGroups.indexOf(targetCabinetDrawer);
                if (drawerIndex === 0 && itemData.name === 'Old Key' && !cabinet.isKeyInserted) {
                    cabinet.isKeyInserted = true;
                    cabinet.keyPivot.visible = true;
                    statusElement.innerText = "STATUS: KEY INSERTED - DRAG IT TO TURN";
                    state.inventory.splice(state.draggedInventoryIndex, 1);
                }
            }

            // Check for Stand Drop (Flashlight)
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
                const f = new Flashlight();
                f.setPosition(-1.1, 0.55, 0); 
                f.group.scale.set(1.2, 1.2, 1.2);
                f.group.rotation.y = Math.PI;
                f.group.rotation.z = Math.PI/14;
                
                // --- Permanently Mount ---
                // Once placed, it's no longer an item that can be picked up
                f.group.userData.isItem = false;
                f.group.userData.isPickupable = false;
                f.group.userData.isStaticPuzzlePart = true;
                f.group.userData.isMountedFlashlight = true;
                f.group.userData.itemInstance = f; // Keep reference for toggle()
                
                scene.add(f.group);
                enableShadows(f.group); // Ensure its light and meshes interact with shadows correctly
                
                statusElement.innerText = "STATUS: FLASHLIGHT MOUNTED ON STAND";
                state.inventory.splice(state.draggedInventoryIndex, 1);
            }

            // Update UI slots
            const slots = document.querySelectorAll('.slot');
            slots.forEach(s => (s.innerHTML = '', s.title = ''));
            state.inventory.forEach((id, idx) => {
                const imgHTML = `<img src="${id.thumbnail}" style="width: 100%; height: 100%; pointer-events: none; object-fit: contain;">`;
                slots[idx].innerHTML = imgHTML;
                slots[idx].title = id.name;
            });
        }

        state.draggedInventoryIndex = -1;
        dragOverlay.style.display = 'none';
        dragOverlay.innerHTML = '';
    }
});
window.addEventListener('resize', (e) => handleWindowResize(e, ctx));
window.addEventListener('contextmenu', (e) => handleContextMenu(e, ctx));
controls.addEventListener('start', () => handleControlsStart(ctx));

// --- Main Loop ---
function animate() {
    requestAnimationFrame(animate);
    stats.update();

    if (state.isInspecting) {
        inspectionControls.update();
        renderer.render(inspectionScene, inspectionCamera);
    } else {
        // --- Single Shadow Pass Optimization ---
        if (state.shadowNeedsRefresh) {
            // Trigger a single update for all point lights
            deskLight.shadow.needsUpdate = true;
            lampLight.shadow.needsUpdate = true;
            leftLight.shadow.needsUpdate = true;
            
            // Check if models are likely fully loaded before stopping the refresh
            // We'll keep refreshing for the first few seconds of state
            const time = performance.now();
            if (time > 5000) { 
                state.shadowNeedsRefresh = false;
                console.log("SHADOW MAPS BAKED AND FROZEN");
            }
        }

        if (state.isTransitioning) {
            controls.target.lerp(state.targetFocus, 0.1);
            camera.position.lerp(state.cameraFocus, 0.1);

            if (camera.position.distanceTo(state.cameraFocus) < 0.01 &&
                controls.target.distanceTo(state.targetFocus) < 0.01) {
                state.isTransitioning = false;
            }
        }

        cabinet.update(state.isEthereal, state.isHintMode, statusElement, ctx);
        room.update(state.isEthereal);
        chanRight.update();
        chanLeft.update();
        chanBack.update();
        controls.update();

        // --- Clamp Camera Position to stay inside room bounds (if not detached) ---
        if (!state.camClampingDisabled) {
            const limitX = 4.8, limitZ = 4.8, limitYTop = 3.5, limitYBottom = -1.5;
            camera.position.x = THREE.MathUtils.clamp(camera.position.x, -limitX, limitX);
            camera.position.z = THREE.MathUtils.clamp(camera.position.z, -limitZ, limitZ);
            camera.position.y = THREE.MathUtils.clamp(camera.position.y, limitYBottom, limitYTop);
        }

        if (state.isMovingPuzzleBox && pBox) {
            const worldPos = new THREE.Vector3();
            pBox.group.getWorldPosition(worldPos);
            
            // Camera follows the box smoothly
            const camOffset = new THREE.Vector3(0, 1.5, 1.2).applyQuaternion(cabinet.group.quaternion);
            const targetCamPos = worldPos.clone().add(camOffset);
            
            camera.position.lerp(targetCamPos, 0.3);
            controls.target.lerp(worldPos, 0.3);
            
            // Move the box itself
            pBox.group.position.lerp(state.pBoxTargetPos, 0.05);
            
            if (pBox.group.position.distanceTo(state.pBoxTargetPos) < 0.1) {
                state.isMovingPuzzleBox = false;
                state.isBoxOnPedestal = true;
                ctx.statusElement.innerText = "STATUS: BOX PLACED ON PEDESTAL - READY FOR INSPECTION";
                
                // Automatically transition to final inspection zoom
                ctx.zoomTo(state.pBoxTargetPos, 2.5, null, new THREE.Vector3(0, 1.5, 0.8));
                
                // Reset rotation limits for full 360 inspection
                controls.minAzimuthAngle = -Infinity;
                controls.maxAzimuthAngle = Infinity;
                controls.minPolarAngle = 0;
                controls.maxPolarAngle = Math.PI * 0.75; // Allow looking slightly under
            }
        }

        renderer.render(scene, camera);
        
        // --- Render Axis Helper Compass ---
        const axisSize = 120;
        const axisX = window.innerWidth - axisSize - 10;
        const axisY = 10;
        
        renderer.autoClear = false;
        renderer.clearDepth();
        
        renderer.setScissorTest(true);
        renderer.setScissor(axisX, axisY, axisSize, axisSize);
        renderer.setViewport(axisX, axisY, axisSize, axisSize);
        
        axisCamera.quaternion.copy(camera.quaternion);
        renderer.render(axisScene, axisCamera);
        
        // Restore main viewport
        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        renderer.autoClear = true;

        if (cameraPosElement) {
            cameraPosElement.innerText = `Camera: ${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}`;
        }
    }
}
animate();
