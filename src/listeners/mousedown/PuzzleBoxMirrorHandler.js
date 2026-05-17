import { MouseDownHandler } from './MouseDownHandler.js';
import { findAncestorWithFlag } from './Utils.js';
import * as THREE from 'three';

export class PuzzleBoxMirrorHandler extends MouseDownHandler {
    constructor() {
        super();
        this.mirrorObj = null;
    }

    canHandle(ctx, raycastResults) {
        const { allHits } = raycastResults;
        if (!allHits) return false;

        for (const hit of allHits) {
            const mirrorObj = findAncestorWithFlag(hit.object, 'isMirror');
            if (mirrorObj) {
                this.mirrorObj = mirrorObj;
                return true;
            }
        }
        return false;
    }

    handle(ctx) {
        const mirror = this.mirrorObj;
        if (!mirror) return;
        
        // Start a drag operation to continuously rotate the mirror
        this.startDrag(ctx.interaction, ctx, 'MirrorRotating', {
            activeMirror: mirror,
            initialMouseX: ctx.event.clientX,
            initialMouseY: ctx.event.clientY,
            initialRotationX: mirror.rotation.x,
            initialRotationY: mirror.rotation.y
        });
        
        console.log(`Started dragging mirror: ${mirror.name}`);
    }
}
