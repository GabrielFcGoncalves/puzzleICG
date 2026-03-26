import * as THREE from 'three';

export function handleDoubleClick(event, ctx) {
    const { mouse, raycaster, camera, cabinet, zoomTo, resetZoom, controls, state, scene } = ctx;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

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
                search.userData.isCabinetBody) {
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
    let target = interactiveHit.entity;

    // 1. Check for Puzzle Box (Movement then Zoom)
    if (target.userData.isPuzzleBox) {
        if (state.isBoxOnPedestal) {
            // ALREADY ON PEDESTAL -> ZOOM IN
            const worldPos = new THREE.Vector3();
            target.getWorldPosition(worldPos);
            zoomTo(worldPos, 2, null, new THREE.Vector3(0, 1.5, 0.8));
            
            // Allow full rotation on pedestal
            controls.minAzimuthAngle = -Infinity;
            controls.maxAzimuthAngle = Infinity;
            controls.minPolarAngle = 0;
            controls.maxPolarAngle = Math.PI * 0.75;
            return;
        }

        if (state.isMovingPuzzleBox) return;
        ctx.statusElement.innerText = "STATUS: MOVING BOX TO PEDESTAL";
        const targetPos = new THREE.Vector3(0, 0.15, 0);
        scene.attach(ctx.puzzleBox.group);
        state.isMovingPuzzleBox = true;
        state.isTransitioning = false;
        state.pBoxTargetPos.copy(targetPos);
        return;
    }

    // 2. Check for Items (Pickup)
    if (target.userData.isItem) {
        if (target.userData.itemName === 'Old Key' && !state.isZoomedOnFoot) return;
        const worldPos = new THREE.Vector3();
        target.getWorldPosition(worldPos);
        if (worldPos.distanceTo(controls.target) < 0.5) {
             ctx.pickupItem(target);
        } else {
             state.isZoomedOnFoot = false;
             zoomTo(worldPos, 1.0);
        }
        return;
    }

    // 3. Check for Static Puzzle Parts (Zoom)
    if (target.userData.isStaticPuzzlePart) {
        state.isZoomedOnFoot = false;
        const worldPos = new THREE.Vector3();
        target.getWorldPosition(worldPos);

        if (target.userData.isStand) {
            // Handle-style close-up, but with free rotation
            zoomTo(worldPos, 1.5, null, new THREE.Vector3(0, 0.4, 0.8));
            controls.minAzimuthAngle = -Infinity;
            controls.maxAzimuthAngle = Infinity;
            return;
        }

        if (target.userData.isMountedFlashlight) {
            // Very close zoom on the mounted flashlight
            zoomTo(worldPos, 0.8, null, new THREE.Vector3(0, 0.3, 0.5));
            controls.minAzimuthAngle = -Infinity;
            controls.maxAzimuthAngle = Infinity;
            return;
        }

        if (target.userData.isLock) {
            zoomTo(worldPos, 0.8, null, new THREE.Vector3(0, 0.2, 0.6));
        } else {
            worldPos.add(new THREE.Vector3(0, 2, 0));
            zoomTo(worldPos, 4.0, null, new THREE.Vector3(0, 1.2, 1.2));
        }
        return;
    }

    // 4. Check for Wheels (Combination)
    if (target.userData.index !== undefined && (target.parent === cabinet.drawerGroups[1] || (target.parent && target.parent.parent === cabinet.drawerGroups[1]))) {
         state.isZoomedOnFoot = false;
         const worldPos = new THREE.Vector3();
         target.getWorldPosition(worldPos);
         zoomTo(worldPos, 1.2, null, new THREE.Vector3(0, 0.4, 0.6));
         controls.minAzimuthAngle = -Math.PI / 6;
         controls.maxAzimuthAngle = Math.PI / 6;
         controls.minPolarAngle = Math.PI * 0.4;
         controls.maxPolarAngle = Math.PI * 0.65;
         return;
    }

    // 5. Check for Handles
    if (target.userData.drawerIndex !== undefined && !target.userData.isStaticPuzzlePart) {
        state.isZoomedOnFoot = false;
        const worldPos = new THREE.Vector3();
        target.getWorldPosition(worldPos);
        zoomTo(worldPos, 1.5, null, new THREE.Vector3(0, 0.4, 0.8));
        controls.minAzimuthAngle = -Math.PI / 4;
        controls.maxAzimuthAngle = Math.PI / 4;
        return;
    }

    // 6. Check for Footing
    if (target.userData.isRotatable || target.userData.isFooting) {
        const worldPos = new THREE.Vector3();
        target.getWorldPosition(worldPos);
        state.isZoomedOnFoot = true;
        
        // Check if it's specifically the rotatable one or just any foot
        if (target.userData.isRotatable) {
            zoomTo(worldPos, 1.0, null, new THREE.Vector3(10, 10, 3));
            controls.minAzimuthAngle = -Math.PI;
            controls.maxAzimuthAngle = Math.PI;
            controls.minPolarAngle = Math.PI * 0.4;
            controls.maxPolarAngle = Math.PI * 0.75;
        } else {
            zoomTo(worldPos, 1.0, null, new THREE.Vector3(0, 0.5, 1));
        }
        return;
    }

    // 7. Cabinet Body or other things
    if (target.userData.isCabinetBody) {
        state.isZoomedOnFoot = false;
        const worldPos = new THREE.Vector3();
        cabinet.group.getWorldPosition(worldPos);
        zoomTo(worldPos, 4.0, null, new THREE.Vector3(0, 0.5, 1.2));
        return;
    }

    resetZoom();
}
