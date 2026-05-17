import { FootRotationMoveHandler } from './mousemove/FootRotationMoveHandler.js';
import { KeyTurningMoveHandler } from './mousemove/KeyTurningMoveHandler.js';
import { DrawerDragMoveHandler } from './mousemove/DrawerDragMoveHandler.js';
import { BirdRotationMoveHandler } from './mousemove/BirdRotationMoveHandler.js';
import { HoverCursorHandler } from './mousemove/HoverCursorHandler.js';
import { DoorDragMoveHandler } from './mousemove/DoorDragMoveHandler.js';
import { MirrorRotationMoveHandler } from './mousemove/MirrorRotationMoveHandler.js';

// ============================================================================
// HANDLER REGISTRY
// ============================================================================

/**
 * Drag handlers are tried first (mutually exclusive, only one active at a time).
 * HoverCursorHandler is the fallback when no drag is active.
 */
const DRAG_HANDLERS = [
    new FootRotationMoveHandler(),
    new KeyTurningMoveHandler(),
    new DrawerDragMoveHandler(),
    new BirdRotationMoveHandler(),
    new DoorDragMoveHandler(),
    new MirrorRotationMoveHandler(),
];

const HOVER_HANDLER = new HoverCursorHandler();

// ============================================================================
// MAIN EXPORT
// ============================================================================

export function handleMouseMove(event, ctx) {
    ctx.event = event;

    // Delegate to InspectionScene if active
    if (ctx.uiState.isInspecting) {
        if (ctx.inspectionScene.handleMouseMove(event)) {
            return;
        }
    }

    const { mouse, raycaster, camera } = ctx;

    // Update raycast from mouse position
    mouse.x = (event.clientX / globalThis.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / globalThis.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // Try active drag handlers first. First match wins.
    for (const handler of DRAG_HANDLERS) {
        if (handler.canHandle(ctx)) {
            handler.handle(ctx);
            return;
        }
    }

    // No drag active: update hover cursor
    HOVER_HANDLER.handle(ctx);
}
