import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Cabinet } from './objects/Cabinet.js';
import { Room } from './objects/Room.js';
import { PuzzleBox } from './objects/PuzzleBox.js';
import { Candle } from './objects/Candle.js';
import { WallChandelier } from './objects/WallChandelier.js';
import { createRenderer, handleResize } from './systems/Renderer.js';

import { handleDoubleClick } from './listeners/DoubleClick.js';
import { handleMouseDown } from './listeners/MouseDown.js';
import { handleMouseMove } from './listeners/MouseMove.js';
import { handleMouseUp } from './listeners/MouseUp.js';
import { handleKeyDown } from './listeners/KeyDown.js';
import { handleResize as handleWindowResize } from './listeners/Resize.js';
import { handleContextMenu } from './listeners/ContextMenu.js';
import { handleControlsStart } from './listeners/ControlsHandlers.js';

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

// --- Lights ---
const ambientLight = new THREE.AmbientLight(0x666699, 1.2); // Much brighter ambiance
scene.add(ambientLight);

// Powerful Spotlight on cabinet
const focalLight = new THREE.SpotLight(0xffea99, 250, 35, Math.PI / 4, 0.4, 0.5);
focalLight.position.set(2, 9, -1.5); // Adjusted for back wall position
focalLight.castShadow = true;
focalLight.shadow.mapSize.width = 2048;
focalLight.shadow.mapSize.height = 2048;
scene.add(focalLight);
focalLight.target.position.set(0, 0, -3.5);
scene.add(focalLight.target);

// Desk Area Light
const deskLight = new THREE.PointLight(0xffaa55, 60, 10);
deskLight.position.set(3.5, 0.5, 1.5); 
scene.add(deskLight);

// Oil Lamp above cabinet
const lampLight = new THREE.PointLight(0xff9900, 35, 10);
lampLight.position.set(0, 3, -3.5); // Directly above new cabinet position
lampLight.castShadow = true;
scene.add(lampLight);

// Bright Moonlight fill
const moonLight = new THREE.DirectionalLight(0x99aaff, 3.5);
moonLight.position.set(-6, 6, -6);
scene.add(moonLight);

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
deskLight.position.set(4, 1.8, 1); 
lampLight.position.set(0, 2.3, -4); 

// Additional light for the left side
const leftLight = new THREE.PointLight(0xffaa55, 40, 8);
leftLight.position.set(-4, 1.8, -1);
scene.add(leftLight);

// Flashlight (Warmer) remaining as is
const flashlight = new THREE.SpotLight(0xffd488, 30, 8, Math.PI / 6, 0.5, 2);
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
inspectionScene.add(new THREE.AmbientLight(0xffffff, 1.5));
const iLight = new THREE.DirectionalLight(0xffffff, 3);
iLight.position.set(2, 2, 2);
inspectionScene.add(iLight);
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

// Ensure all meshes cast and receive shadows for a dramatic theme
scene.traverse(node => {
    if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
    }
});

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
        controls.minAzimuthAngle = -Infinity;
        controls.maxAzimuthAngle = Infinity;
        controls.minPolarAngle = 0;
        controls.maxPolarAngle = Math.PI * 0.6;
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

        const hits = raycaster.intersectObjects(cabinet.group.children, true);
        if (hits.length > 0) {
            let targetGroup = hits[0].object;
            while (targetGroup && targetGroup.parent !== cabinet.group) {
                targetGroup = targetGroup.parent;
            }

            if (targetGroup) {
                const drawerIndex = cabinet.drawerGroups.indexOf(targetGroup);
                // Merged drawer is now index 0
                if (drawerIndex === 0 && itemData.name === 'Old Key' && !cabinet.isKeyInserted) {
                    cabinet.isKeyInserted = true;
                    cabinet.keyPivot.visible = true;
                    statusElement.innerText = "STATUS: KEY INSERTED - DRAG IT TO TURN";

                    // Remove from inventory
                    state.inventory.splice(state.draggedInventoryIndex, 1);
                    // Update UI slots
                    const slots = document.querySelectorAll('.slot');
                    slots.forEach(s => (s.innerHTML = '', s.title = ''));
                    state.inventory.forEach((id, idx) => {
                        slots[idx].innerHTML = `<img src="${id.thumbnail}" style="width: 100%; height: 100%; pointer-events: none; object-fit: contain;">`;
                        slots[idx].title = id.name;
                    });
                }
            }
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

    if (state.isInspecting) {
        inspectionControls.update();
        renderer.render(inspectionScene, inspectionCamera);
    } else {
        if (state.isTransitioning) {
            controls.target.lerp(state.targetFocus, 0.1);
            camera.position.lerp(state.cameraFocus, 0.1);

            if (camera.position.distanceTo(state.cameraFocus) < 0.01 &&
                controls.target.distanceTo(state.targetFocus) < 0.01) {
                state.isTransitioning = false;
            }
        }

        // Smooth Oil Lamp Flicker
        if (lampLight) {
            const time = Date.now() * 0.002;
            lampLight.intensity = 25 + Math.sin(time * 5) * 5 + Math.random() * 2;
        }

        // Camera Proximity Hiding (to "X-ray" through obstructions)
        const camPos = camera.position;
        const hideThreshold = 0.3;
        scene.traverse(node => {
            if (node.isMesh && node.userData) {
                // Don't hide the cabinet box or things inside it if we are looking at them
                if (node.userData.isCabinetBody || node.userData.drawerIndex !== undefined) return;
                
                const worldPos = new THREE.Vector3();
                node.getWorldPosition(worldPos);
                const dist = worldPos.distanceTo(camPos);
                
                if (dist < hideThreshold) {
                    node.visible = false;
                } else {
                    node.visible = true;
                }
            }
        });

        cabinet.update(state.isEthereal, state.isHintMode, statusElement, ctx);
        chanRight.update();
        chanLeft.update();
        chanBack.update();
        controls.update();

        // --- Clamp Camera Position to stay inside room bounds ---
        const limitX = 4.8, limitZ = 4.8, limitYTop = 3.5, limitYBottom = -1.5;
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -limitX, limitX);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, -limitZ, limitZ);
        camera.position.y = THREE.MathUtils.clamp(camera.position.y, limitYBottom, limitYTop);

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
