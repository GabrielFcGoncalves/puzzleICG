import * as THREE from 'three';

export function handleMouseMove(event, ctx) {
    const { mouse, raycaster, camera, cabinet, interaction, puzzle, renderer, intersectionPoint, offset } = ctx;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    if (interaction.isRotatingFooting && interaction.rotatedFooting) {
        const deltaX = event.clientX - interaction.initialMouseX;
        interaction.rotatedFooting.rotation.y = interaction.initialRotationY + deltaX * 0.01;
    } else if (interaction.isTurningKey) {
        const deltaX = event.clientX - interaction.initialMouseX;
        if (deltaX > 50) {
            cabinet.isKeyTurned = true;
            cabinet.drawerGroups[0].userData.isLocked = false;
            cabinet.targetDrawerZ[0] = cabinet.drawerGroups[0].userData.restZ + 0.05;
            ctx.statusElement.innerText = "STATUS: MIDDLE DRAWER UNLOCKED";
        }
    } else if (interaction.isDragging && interaction.draggedDrawerIndex !== -1) {
        const dGroup = cabinet.drawerGroups[interaction.draggedDrawerIndex];
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), dGroup.position.y);
        if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
            const zMin = dGroup.userData.restZ;
            const zMax = dGroup.userData.openedZ;
            cabinet.targetDrawerZ[interaction.draggedDrawerIndex] = Math.max(zMin, Math.min(zMax, intersectionPoint.z - offset.z));
        }
    } else if (interaction.isDraggingBird && ctx.birdProxy) {
        const deltaX = event.clientX - interaction.initialMouseX;
        const deltaY = event.clientY - interaction.initialMouseY;
        ctx.birdProxy.rotation.y = interaction.initialRotationY + deltaX * 0.01;
        ctx.birdProxy.rotation.x = interaction.initialRotationX + deltaY * 0.01;
    } else {
        const wheelHover = raycaster.intersectObjects(cabinet.wheels, true);
        const handleHover = raycaster.intersectObjects(ctx.getHandles(), true);
        const itemHover = raycaster.intersectObjects(ctx.getItems() || [], true);
        const birdHover = (puzzle.showBirdInFocus && ctx.birdProxy) ? raycaster.intersectObject(ctx.birdProxy, true) : [];
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
        let canInteract = wheelHover.length > 0 || canInteractWithFoot || itemHover.length > 0 || birdHover.length > 0;

        renderer.domElement.style.cursor = (canInteract || canInteractWithHandle) ? 'pointer' : 'grab';
    }
}
