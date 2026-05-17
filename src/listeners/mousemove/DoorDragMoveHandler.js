import { MouseMoveHandler } from './MouseMoveHandler.js';

/**
 * Handles the actual rotation of the door while dragging the handle.
 */
export class DoorDragMoveHandler extends MouseMoveHandler {
    canHandle(ctx) {
        return ctx.interaction.isDraggingDoor;
    }

    handle(ctx) {
        const { interaction, mouse, puzzle } = ctx;
        
        // Use horizontal mouse movement to rotate the door
        const deltaX = mouse.x - interaction.initialMouseX;
        
        // Invert direction: dragging right opens the door (0 -> 1.5)
        const rotationSpeed = 2.5;
        let targetRotation = interaction.initialRotationY + (deltaX * rotationSpeed);
        
        // Clamp rotation (0 = closed, 1.5 = open)
        puzzle.doorRotation = Math.max(0, Math.min(1.5, targetRotation));

        // Check for win condition (door is mostly open)
        if (puzzle.doorRotation >= 1.45 && !puzzle.isWinScreenShown) {
            puzzle.isWinScreenShown = true;
            
            const loaderScreen = document.getElementById('loading-screen');
            if (loaderScreen) {
                loaderScreen.innerHTML = `
                    <div class="presentation-container">
                        <div class="story-text visible" style="font-size: 3.5rem; text-shadow: 0 0 20px rgba(0, 255, 255, 0.8);">Congratulations</div>
                    </div>
                `;
                loaderScreen.classList.remove('loading-finished');
            }
        }
    }
}
