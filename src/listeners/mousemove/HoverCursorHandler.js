import { MouseMoveHandler } from './MouseMoveHandler.js';

/**
 * Idle hover: update cursor style based on what the mouse is over.
 * This is the fallback handler when no drag is active.
 */
export class HoverCursorHandler extends MouseMoveHandler {
    canHandle() {
        return true;
    }

    handle(ctx) {
        const { raycaster, cabinet, puzzle, renderer } = ctx;

        const wheelHover = raycaster.intersectObjects(cabinet.wheels, true);
        const handleHover = raycaster.intersectObjects(ctx.getHandles(), true);
        const itemHover = raycaster.intersectObjects(ctx.getItems() || [], true);
        const footHover = raycaster.intersectObjects(cabinet.feet || [], true);
        const birdHover = (puzzle.showBirdInFocus && ctx.birdProxy)
            ? raycaster.intersectObject(ctx.birdProxy, true)
            : [];

        const canInteractWithFoot = this.checkFootInteraction(footHover);
        const canInteractWithHandle = this.checkHandleInteraction(handleHover, cabinet);
        const canInteract = wheelHover.length > 0 ||
                            canInteractWithFoot ||
                            itemHover.length > 0 ||
                            birdHover.length > 0;

        renderer.domElement.style.cursor =
            (canInteract || canInteractWithHandle) ? 'pointer' : 'grab';
    }

    checkFootInteraction(footHover) {
        if (footHover.length === 0) return false;
        const obj = footHover[0].object;
        return obj.userData.isRotatable ||
               (obj.parent?.userData?.isRotatable);
    }

    checkHandleInteraction(handleHover, cabinet) {
        if (handleHover.length === 0) return false;
        const h = handleHover[0].object;
        
        // Handle door handle
        if (h.userData.isDoorHandle) return true;
        
        const drawerIndex = h.userData.drawerIndex;
        if (drawerIndex === undefined) return false;
        
        const dGroup = cabinet.drawerGroups[drawerIndex];
        return dGroup && !dGroup.userData.isLocked;
    }
}
