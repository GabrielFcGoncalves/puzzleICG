import { DoubleClickHandler } from './DoubleClickHandler.js';

export class DrawerHandleHandler extends DoubleClickHandler {
    match(target) {
        return target.userData.drawerIndex !== undefined &&
               !target.userData.isStaticPuzzlePart;
    }

    handle(target, worldPos, ctx) {
        ctx.cameraState.isZoomedOnFoot = false;
        this.zoomWithPreset(ctx, worldPos, 'drawer');
    }
}
