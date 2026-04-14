import * as THREE from 'three';

export function handleDoubleClick(event, ctx) {
    const { mouse, raycaster, camera, cabinet, zoomTo, resetZoom, controls, state, scene } = ctx;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    state.showBirdInFocus = false; // Reset by default
    state.isZoomedOnPadlock = false; // Reset by default

    // Raycast against everything in the scene to handle occlusion correctly
    const allHits = raycaster.intersectObjects(scene.children, true);
    if (allHits.length === 0) {
        resetZoom();
        return;
    }

    // --- Search for first "interaction candidate" while respecting occlusion ---
    // Specifically, if we hit an Item that is NOT blocked by an OPAQUE mesh, we want it.
    let interactiveHit = null;
    for (let i = 0; i < allHits.length; i++) {
        const hit = allHits[i];
        let obj = hit.object;
        
        // Find if this is part of something interactive
        let search = obj;
        while (search) {
            if (search.userData.isItem || 
                search.userData.isPuzzleBox || 
                search.userData.isStaticPuzzlePart || 
                search.userData.drawerIndex !== undefined || 
                search.userData.isRotatable || 
                search.userData.isFooting ||
                search.userData.isFlashlightSwitch ||
                search.userData.isCabinetBody ||
                search.userData.isPadlock ||
                search.userData.isPadlockWheel ||
                search.userData.isPadlockButton) {
                interactiveHit = { hit, entity: search };
                break;
            }
            search = search.parent;
        }
        
        if (interactiveHit) {
            // Priority: If we find an ITEM, we probably want to pick it up if it's visible. 
            // In a game like this, picking up an item through a transparent gap is common.
            // If the hit object is OPAQUE and NOT an item / interactive, we stop looking.
            if (!obj.material || obj.material.opacity >= 1) {
                // If it's a solid wall or panel and NOT the entity we want, it blocks further searching.
                break;
            }
            
            // If we found a candidate (like the Key) even if it's behind a transparent hitbox, we can prefer it.
            if (interactiveHit.entity.userData.isItem) {
                break; // Found our item, use it.
            }
        }
        
        // If we hit an OPAQUE object that isn't helping us find an interaction, stop.
        if (obj.material && obj.material.opacity >= 1 && !interactiveHit) {
            break;
        }
    }

    if (!interactiveHit) {
        resetZoom();
        return;
    }

    const firstHit = interactiveHit.hit.object;
    const target = interactiveHit.entity;

    const worldPos = new THREE.Vector3();
    target.getWorldPosition(worldPos);

    const handlers = [
        // 1. Puzzle Box
        {
            match: t => t.userData.isPuzzleBox,
            handle: (t, pos) => {
                if (state.isBoxOnPedestal) {
                    zoomTo(pos, 2, null, new THREE.Vector3(0, 1.5, 0.8));
                    controls.minAzimuthAngle = -Infinity;
                    controls.maxAzimuthAngle = Infinity;
                    controls.minPolarAngle = 0;
                    controls.maxPolarAngle = Math.PI * 0.75;
                } else {
                    if (state.isMovingPuzzleBox) return;
                    ctx.statusElement.innerText = "STATUS: MOVING BOX TO PEDESTAL";
                    scene.attach(ctx.puzzleBox.group);
                    state.isMovingPuzzleBox = true;
                    state.isTransitioning = false;
                    state.pBoxTargetPos.copy(new THREE.Vector3(0, 0.15, 0));
                }
            }
        },
        // 2. Items
        {
            match: t => t.userData.isItem,
            handle: (t, pos) => {
                if (t.userData.itemName === 'Old Key' && !state.isZoomedOnFoot) return;
                
                if (pos.distanceTo(controls.target) < 1.1) {
                     ctx.pickupItem(t);
                } else if (t.userData.isZoomable !== false) {
                     state.isZoomedOnFoot = false;
                     zoomTo(pos, 1.0);
                }
            }
        },
        // 3. Static Puzzle Parts
        {
            match: t => t.userData.isStaticPuzzlePart,
            handle: (t, pos) => {
                state.isZoomedOnFoot = false;
                
                if (t.userData.isPainting) {
                    const rotY = t.rotation.y;
                    let camOffset = Math.abs(rotY - Math.PI / 2) < 0.1 || Math.abs(rotY + Math.PI / 2) < 0.1 
                        ? new THREE.Vector3(1, 0, 0) 
                        : new THREE.Vector3(0, 0, 1);
                    
                    if (state.inventory.some(i => i.name.toLowerCase().includes('bird'))) {
                        state.showBirdInFocus = true;
                        console.log("ALIGNMENT TRIGGERED: Iron Bird found in inventory.");
                    }
                    zoomTo(pos, 2.4, null, camOffset);
                } else if (t.userData.isStand) {
                    zoomTo(pos, 1.0, null, new THREE.Vector3(0, 0.4, 0.8));
                    controls.minAzimuthAngle = -Infinity;
                    controls.maxAzimuthAngle = Infinity;
                } else if (t.userData.isSecretSquare) {
                    if (camera.position.distanceTo(pos) < 1.5) {
                        state.isSecretSquareTriggered = true; 
                    } else {
                        zoomTo(pos, 0.8, null, new THREE.Vector3(-0.6, 0, 0)); 
                    }
                } else if (t.userData.isMountedFlashlight) {
                    zoomTo(pos, 0.5, null, new THREE.Vector3(0, 0.3, 0.5));
                    controls.minAzimuthAngle = -Infinity;
                    controls.maxAzimuthAngle = Infinity;
                } else if (t.userData.isLock) {
                    zoomTo(pos, 0.8, null, new THREE.Vector3(0, 0.2, 0.6));
                } else {
                    pos.add(new THREE.Vector3(0, 2, 0));
                    zoomTo(pos, 4.0, null, new THREE.Vector3(0, 1.2, 1.2));
                }
            }
        },
        // 4. Wheels
        {
            match: t => t.userData.index !== undefined && (t.parent === cabinet.drawerGroups[1] || (t.parent && t.parent.parent === cabinet.drawerGroups[1])),
            handle: (t, pos) => {
                 state.isZoomedOnFoot = false;
                 zoomTo(pos, 1.2, null, new THREE.Vector3(0, 0.4, 0.6));
                 controls.minAzimuthAngle = -Math.PI / 6;
                 controls.maxAzimuthAngle = Math.PI / 6;
                 controls.minPolarAngle = Math.PI * 0.4;
                 controls.maxPolarAngle = Math.PI * 0.65;
            }
        },
        // 5. Handles
        {
            match: t => t.userData.drawerIndex !== undefined && !t.userData.isStaticPuzzlePart,
            handle: (t, pos) => {
                state.isZoomedOnFoot = false;
                zoomTo(pos, 1.5, null, new THREE.Vector3(0, 0.4, 0.8));
                controls.minAzimuthAngle = -Math.PI / 4;
                controls.maxAzimuthAngle = Math.PI / 4;
            }
        },
        // 6. Footing
        {
            match: t => t.userData.isRotatable || t.userData.isFooting,
            handle: (t, pos) => {
                state.isZoomedOnFoot = true;
                if (t.userData.isRotatable) {
                    zoomTo(pos, 1.0, null, new THREE.Vector3(10, 10, 3));
                    controls.minAzimuthAngle = -Math.PI;
                    controls.maxAzimuthAngle = Math.PI;
                    controls.minPolarAngle = Math.PI * 0.4;
                    controls.maxPolarAngle = Math.PI * 0.75;
                } else {
                    zoomTo(pos, 1.0, null, new THREE.Vector3(0, 0.5, 1));
                }
            }
        },
        // 7. Padlock
        {
            match: t => t.userData.isPadlock || t.userData.isPadlockWheel || t.userData.isPadlockButton,
            handle: (t, pos) => {
                state.isZoomedOnFoot = false;
                state.isZoomedOnPadlock = true;
                
                if (t.userData.isPadlockWheel || t.userData.isPadlockButton) {
                    zoomTo(pos, 2.0, null, new THREE.Vector3(0, 0.4, 0.6));
                } else {
                    zoomTo(pos, 0.5, null, new THREE.Vector3(0, 0, 0.8));
                }

                controls.minAzimuthAngle = -Math.PI / 6;
                controls.maxAzimuthAngle = Math.PI / 6;
                controls.minPolarAngle = Math.PI * 0.4;
                controls.maxPolarAngle = Math.PI * 0.75;
            }
        },
        // 8. Cabinet Body
        {
            match: t => t.userData.isCabinetBody,
            handle: (t, pos) => {
                state.isZoomedOnFoot = false;
                const cabPos = new THREE.Vector3();
                cabinet.group.getWorldPosition(cabPos);
                zoomTo(cabPos, 4.0, null, new THREE.Vector3(0, 0.5, 1.2));
            }
        }
    ];

    for (const handler of handlers) {
        if (handler.match(target)) {
            handler.handle(target, worldPos);
            return;
        }
    }

    resetZoom();
}
