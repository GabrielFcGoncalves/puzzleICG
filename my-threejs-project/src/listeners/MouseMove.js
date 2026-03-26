import * as THREE from 'three';

export function handleMouseMove(event, ctx) {
    const { mouse, raycaster, camera, cabinet, state, renderer, intersectionPoint, offset } = ctx;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    if (state.isRotatingFooting && state.rotatedFooting) {
        const deltaX = event.clientX - state.initialMouseX;
        state.rotatedFooting.rotation.y = state.initialRotationY + deltaX * 0.01;
    } else if (state.isTurningKey) {
        const deltaX = event.clientX - state.initialMouseX;
        if (deltaX > 50) {
            cabinet.isKeyTurned = true;
            cabinet.drawerGroups[0].userData.isLocked = false;
            cabinet.targetDrawerZ[0] = cabinet.drawerGroups[0].userData.restZ + 0.05;
            ctx.statusElement.innerText = "STATUS: MIDDLE DRAWER UNLOCKED";
        }
    } else if (state.isDragging && state.draggedDrawerIndex !== -1) {
        const dGroup = cabinet.drawerGroups[state.draggedDrawerIndex];
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), dGroup.position.y);
        if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
            const zMin = dGroup.userData.restZ;
            const zMax = dGroup.userData.openedZ;
            cabinet.targetDrawerZ[state.draggedDrawerIndex] = Math.max(zMin, Math.min(zMax, intersectionPoint.z - offset.z));
        }
    } else {
        const wheelHover = raycaster.intersectObjects(cabinet.wheels, true);
        const handleHover = raycaster.intersectObjects(ctx.getHandles(), true);
        const itemHover = raycaster.intersectObjects(ctx.getItems() || [], true);
        const footHover = raycaster.intersectObjects(cabinet.feet || [], true);

        let canInteractWithFoot = false;
        if (footHover.length > 0) {
            const obj = footHover[0].object;
            if (obj.userData.isRotatable || (obj.parent && obj.parent.userData && obj.parent.userData.isRotatable)) {
                canInteractWithFoot = true;
            }
        }

        let canInteractWithHandle = false;
        if (handleHover.length > 0) {
            const h = handleHover[0].object;
            const drawerIndex = h.userData.drawerIndex;
            const dGroup = cabinet.drawerGroups[drawerIndex];
            if (!dGroup.userData.isLocked) {
                canInteractWithHandle = true;
            }
        }
        let canInteract = wheelHover.length > 0 || canInteractWithFoot || itemHover.length > 0;

        renderer.domElement.style.cursor = (canInteract || canInteractWithHandle) ? 'pointer' : 'grab';
    }
}
