import { FlashlightSwitchHandler } from './mousedown/FlashlightSwitchHandler.js';
import { PadlockButtonHandler } from './mousedown/PadlockButtonHandler.js';
import { PadlockWheelHandler } from './mousedown/PadlockWheelHandler.js';
import { KeyTurningHandler } from './mousedown/KeyTurningHandler.js';
import { FootRotationHandler } from './mousedown/FootRotationHandler.js';
import { DrawerDragHandler } from './mousedown/DrawerDragHandler.js';
import { BirdRotationHandler } from './mousedown/BirdRotationHandler.js';
import { DoorDragHandler } from './mousedown/DoorDragHandler.js';
import { PuzzleBoxButtonHandler } from './mousedown/PuzzleBoxButtonHandler.js';
import { PuzzleBoxColorPartHandler } from './mousedown/PuzzleBoxColorPartHandler.js';
import { WeightPlateDragHandler } from './mousedown/WeightPlateDragHandler.js';
import { PuzzleBoxMirrorHandler } from './mousedown/PuzzleBoxMirrorHandler.js';
import { PuzzleBoxLeverHandler } from './mousedown/PuzzleBoxLeverHandler.js';

// ============================================================================
// HANDLER REGISTRY
// ============================================================================

/**
 * Handlers are tried in order. First match wins.
 * Most specific handlers first to prevent false matches.
 */
const MOUSEDOWN_HANDLERS = [
    new WeightPlateDragHandler(),
    new PuzzleBoxButtonHandler(),
    new PuzzleBoxLeverHandler(),
    new PuzzleBoxColorPartHandler(),
    new PuzzleBoxMirrorHandler(),
    new FlashlightSwitchHandler(),
    new PadlockButtonHandler(),
    new PadlockWheelHandler(),
    new KeyTurningHandler(),
    new FootRotationHandler(),
    new DrawerDragHandler(),
    new BirdRotationHandler(),
    new DoorDragHandler(),
];


// ============================================================================
// RAYCAST COLLECTION
// ============================================================================

/**
 * Collects all raycasts needed for handlers.
 * Runs once per mousedown, then all handlers use the cached results.
 */
function collectRaycastResults(ctx) {
    const { raycaster, cabinet, puzzle } = ctx;

    return {
        allHits: raycaster.intersectObjects(ctx.scene.children, true),
        wheelHits: raycaster.intersectObjects(cabinet.wheels.filter(Boolean), true),
        handleHits: raycaster.intersectObjects(ctx.getHandles().filter(Boolean), true),
        keyHits: raycaster.intersectObjects([cabinet.keyPivot].filter(Boolean), true),
        footHits: raycaster.intersectObjects((cabinet.feet || []).filter(Boolean), true),
        birdHits: puzzle.showBirdInFocus && ctx.birdProxy
            ? raycaster.intersectObject(ctx.birdProxy, true)
            : [],
    };
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export function handleMouseDown(event, ctx) {
    ctx.event = event;

    // Delegate to InspectionScene if active
    if (ctx.uiState.isInspecting) {
        if (ctx.inspectionScene.handleMouseDown(event)) {
            return;
        }
    }

    const { mouse, raycaster, camera } = ctx;

    // Set up raycast from mouse position
    mouse.x = (event.clientX / globalThis.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / globalThis.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // Collect all raycasts once
    const raycastResults = collectRaycastResults(ctx);

    // Try each handler in priority order. First match wins.
    for (const handler of MOUSEDOWN_HANDLERS) {
        if (handler.canHandle(ctx, raycastResults)) {
            handler.handle(ctx);
            return;
        }
    }
}
