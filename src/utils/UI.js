/**
 * UI Utilities for managing the game's HUD, inventory, and overlays.
 */

export class UIManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.statusElement = document.getElementById('status');
        this.inspectionOverlay = document.getElementById('inspection-overlay');
        this.closeInspectionBtn = document.getElementById('close-inspection');
        this.dragOverlay = document.getElementById('drag-overlay');
        this.overlayElement = document.getElementById('ethereal-overlay');
        this.slots = document.querySelectorAll('.slot');

        this.init();
    }

    init() {
        if (this.closeInspectionBtn) {
            this.closeInspectionBtn.onclick = () => {
                this.ctx.closeInspection();
            };
        }
    }

    setStatus(text) {
        if (this.statusElement) {
            this.statusElement.innerText = text;
        }
    }

    updateInventory(inventory) {
        this.slots.forEach(s => (s.innerHTML = '', s.title = ''));
        inventory.forEach((itemData, index) => {
            if (this.slots[index]) {
                const imgHTML = `<img src="${itemData.thumbnail}" style="width: 100%; height: 100%; pointer-events: none; object-fit: contain;">`;
                this.slots[index].innerHTML = imgHTML;
                this.slots[index].title = itemData.name;

                this.slots[index].onmousedown = (e) => {
                    e.preventDefault();
                    const startX = e.clientX;
                    const startY = e.clientY;
                    let moved = false;

                    const onMouseMove = (moveEvent) => {
                        if (Math.abs(moveEvent.clientX - startX) > 5 || Math.abs(moveEvent.clientY - startY) > 5) {
                            moved = true;
                            this.ctx.startDraggingInventory(index, imgHTML, moveEvent.clientX, moveEvent.clientY);
                            window.removeEventListener('mousemove', onMouseMove);
                        }
                    };

                    const onMouseUp = () => {
                        window.removeEventListener('mousemove', onMouseMove);
                        window.removeEventListener('mouseup', onMouseUp);
                        if (!moved) {
                            this.ctx.openInspection(itemData);
                        }
                    };

                    window.addEventListener('mousemove', onMouseMove);
                    window.addEventListener('mouseup', onMouseUp);
                };
            }
        });
    }

    showDragOverlay(imgHTML, x, y) {
        if (this.dragOverlay) {
            this.dragOverlay.innerHTML = imgHTML;
            this.dragOverlay.style.display = 'block';
            this.updateDragOverlay(x, y);
        }
    }

    updateDragOverlay(x, y) {
        if (this.dragOverlay) {
            this.dragOverlay.style.left = `${x - 180}px`;
            this.dragOverlay.style.top = `${y - 100}px`;
        }
    }

    hideDragOverlay() {
        if (this.dragOverlay) {
            this.dragOverlay.style.display = 'none';
            this.dragOverlay.innerHTML = '';
        }
    }

    showInspection() {
        if (this.inspectionOverlay) {
            this.inspectionOverlay.style.display = 'block';
        }
    }

    hideInspection() {
        if (this.inspectionOverlay) {
            this.inspectionOverlay.style.display = 'none';
        }
    }
}
