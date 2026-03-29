import * as THREE from 'three';

export function handleMouseDown(event, ctx) {
    const { mouse, raycaster, camera, scene, cabinet, state, controls, renderer, intersectionPoint, offset } = ctx;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // --- Specialized Single-Click Interactions (Flashlight Switch) ---
    const allHits = raycaster.intersectObjects(scene.children, true);
    for (let i = 0; i < allHits.length; i++) {
        const hitObj = allHits[i].object;
        let search = hitObj;
        while (search) {
            if (search.userData.isFlashlightSwitch) {
                // Only allow clicking the switch if the flashlight is mounted on the stand
                let groupSearch = search;
                let isMounted = false;
                while (groupSearch) {
                    if (groupSearch.userData.isMountedFlashlight) {
                        isMounted = true;
                        break;
                    }
                    groupSearch = groupSearch.parent;
                }

                if (isMounted) {
                    let instSearch = search;
                    while (instSearch && !instSearch.userData.itemInstance) {
                        instSearch = instSearch.parent;
                    }
                    if (instSearch && instSearch.userData.itemInstance && instSearch.userData.itemInstance.toggle) {
                        instSearch.userData.itemInstance.toggle();
                        return; // Toggle found, stop processing MouseDown
                    }
                }
            }
            search = search.parent;
        }
    }

    const wheelHits = raycaster.intersectObjects(cabinet.wheels, true);
    const handleHits = raycaster.intersectObjects(ctx.getHandles(), true);
    const keyHits = raycaster.intersectObjects([cabinet.keyPivot], true);

    if (keyHits.length > 0 && cabinet.isKeyInserted && !cabinet.isKeyTurned) {
        state.isTurningKey = true;
        state.initialMouseX = event.clientX;
        controls.enabled = false;
        return;
    }


    if (wheelHits.length > 0) {
        const h = wheelHits[0].object;
        const index = h.userData.index !== undefined ? h.userData.index : h.parent.userData.index;
        cabinet.currentCode[index] = (cabinet.currentCode[index] + 1) % 10;
        cabinet.wheels[index].userData.targetRot += (Math.PI * 2) / 10;
        if (cabinet.checkPuzzle()) {
            ctx.statusElement.innerText = "STATUS: UNLOCKED (Grab handle)";
        }
        controls.enabled = false;
        return;
    }



    const footHits = raycaster.intersectObjects(cabinet.feet || [], true);
    if (footHits.length > 0) {
        const obj = footHits[0].object;
        if (obj.userData.isRotatable || (obj.parent && obj.parent.userData && obj.parent.userData.isRotatable)) {
            state.isRotatingFooting = true;
            state.rotatedFooting = cabinet.rotatableFoot;
            state.initialMouseX = event.clientX;
            state.initialRotationY = state.rotatedFooting.rotation.y;
            controls.enabled = false;
            return;
        }
    }
    if (handleHits.length > 0) {
        const h = handleHits[0].object;
        const drawerIndex = h.userData.drawerIndex;
        const dGroup = cabinet.drawerGroups[drawerIndex];

        if (!dGroup.userData.isLocked) {
            state.draggedDrawerIndex = drawerIndex;
            state.isDragging = true;
            controls.enabled = false;
            renderer.domElement.classList.add('grabbing');

            const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), dGroup.position.y);
            raycaster.ray.intersectPlane(groundPlane, intersectionPoint);
            offset.copy(intersectionPoint).sub(dGroup.position);
        }
    }

    if (state.showBirdInFocus && ctx.birdProxy) {
        const birdHits = raycaster.intersectObject(ctx.birdProxy, true);
        if (birdHits.length > 0) {
            state.isDraggingBird = true;
            state.initialMouseX = event.clientX;
            state.initialMouseY = event.clientY;
            state.initialRotationY = ctx.birdProxy.rotation.y;
            state.initialRotationX = ctx.birdProxy.rotation.x;
            controls.enabled = false;
            return;
        }
    }
}
