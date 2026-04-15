import { DoubleClickHandler } from './DoubleClickHandler.js';
import { getWorldPosition } from './Utils.js';

export class CabinetBodyHandler extends DoubleClickHandler {
    match(target) {
        return target.userData.isCabinetBody;
    }

    handle(target, worldPos, ctx) {
        ctx.cameraState.isZoomedOnFoot = false;
        const cabPos = getWorldPosition(ctx.cabinet.group);
        this.zoomWithPreset(ctx, cabPos, 'cabinet');
    }
}
