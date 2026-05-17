import { MouseMoveHandler } from "./MouseMoveHandler.js";
import * as THREE from 'three';

export class MirrorRotationMoveHandler extends MouseMoveHandler {
    canHandle(ctx) {
        return ctx.interaction.isMirrorRotating && ctx.interaction.activeMirror;
    }

    handle(ctx) {
        const { interaction, event } = ctx;
        
        // Calculate delta from initial mouse position
        const deltaX = event.clientX - interaction.initialMouseX;
        const deltaY = event.clientY - interaction.initialMouseY;
        
        const mirror = interaction.activeMirror;
        
        // Sensitivity
        const sensitivity = 0.005;
        
        // Free rotation in any direction (no shift required, no clamps!)
        mirror.rotation.y = interaction.initialRotationY + deltaX * sensitivity;
        mirror.rotation.x = interaction.initialRotationX + deltaY * sensitivity;
    }
}
