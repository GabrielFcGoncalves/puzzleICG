import * as THREE from 'three';
import { MouseMoveHandler } from './MouseMoveHandler.js';

/**
 * Drawer dragging: slide drawer along Z axis following mouse
 */
export class DrawerDragMoveHandler extends MouseMoveHandler {
    canHandle(ctx) {
        return ctx.interaction.isDragging && ctx.interaction.draggedDrawerIndex !== -1;
    }

    handle(ctx) {
        const { interaction, cabinet, raycaster, intersectionPoint, offset } = ctx;
        const dGroup = cabinet.drawerGroups[interaction.draggedDrawerIndex];
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), dGroup.position.y);

        if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
            const zMin = dGroup.userData.restZ;
            const zMax = dGroup.userData.openedZ;
            cabinet.targetDrawerZ[interaction.draggedDrawerIndex] =
                Math.max(zMin, Math.min(zMax, intersectionPoint.z - offset.z));
        }
    }
}
