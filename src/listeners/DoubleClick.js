import { findClickableTarget, getWorldPosition } from './handlers/Utils.js';
import { PuzzleBoxHandler } from './handlers/PuzzleBoxHandler.js';
import { ItemHandler } from './handlers/ItemHandler.js';
import { StaticPuzzlePartHandler } from './handlers/StaticPuzzlePartHandler.js';
import { PadlockHandler } from './handlers/PadlockHandler.js';
import { DrawerHandleHandler } from './handlers/DrawerHandleHandler.js';
import { FootingHandler } from './handlers/FootingHandler.js';
import { CabinetBodyHandler } from './handlers/CabinetBodyHandler.js';

const HANDLERS = [
    new PuzzleBoxHandler(),
    new ItemHandler(),
    new StaticPuzzlePartHandler(),
    new PadlockHandler(),
    new DrawerHandleHandler(),
    new FootingHandler(),
    new CabinetBodyHandler(),
];

export function handleDoubleClick(event, ctx) {
    const { mouse, raycaster, camera, scene, cameraState, puzzle } = ctx;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    puzzle.showBirdInFocus = false;
    cameraState.isZoomedOnPadlock = false;

    const allHits = raycaster.intersectObjects(scene.children, true);
    if (allHits.length === 0) {
        ctx.resetZoom();
        return;
    }

    const interactiveHit = findClickableTarget(allHits);
    if (!interactiveHit) {
        ctx.resetZoom();
        return;
    }

    const target = interactiveHit.entity;
    const worldPos = getWorldPosition(target);

    for (const handler of HANDLERS) {
        if (handler.match(target)) {
            handler.handle(target, worldPos, ctx);
            return;
        }
    }

    ctx.resetZoom();
}
