import * as THREE from 'three';
import { MouseDownHandler } from './MouseDownHandler.js';

/**
 * Drawer dragging: drag handle to open/close drawer
 */
export class DrawerDragHandler extends MouseDownHandler {
    canHandle(ctx, raycastResults) {
        const { handleHits } = raycastResults;

        if (handleHits.length === 0) {
            return false;
        }

        const handleObj = handleHits[0].object;
        this.drawerIndex = handleObj.userData.drawerIndex;

        if (this.drawerIndex === undefined) {
            return false;
        }

        const drawer = ctx.cabinet.drawerGroups[this.drawerIndex];
        return drawer && !drawer.userData.isLocked;
    }

    handle(ctx) {
        const { interaction, cabinet, renderer, raycaster } = ctx;
        const drawer = cabinet.drawerGroups[this.drawerIndex];

        this.startDrag(interaction, ctx, 'Dragging', {
            draggedDrawerIndex: this.drawerIndex
        });
        renderer.domElement.classList.add('grabbing');

        // Calculate grab offset (where on the drawer did we click?)
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), drawer.position.y);
        const point = new THREE.Vector3();

        if (raycaster.ray.intersectPlane(plane, point)) {
            ctx.offset.copy(point).sub(drawer.position);
        }
    }
}
