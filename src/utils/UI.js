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

                // Move mouse down handler here?
                this.slots[index].onmousedown = (e) => {
                    e.preventDefault();
                    this.ctx.startDraggingInventory(index, imgHTML, e.clientX, e.clientY);
                };

                this.slots[index].onclick = (e) => {
                    // Logic handled by startDraggingInventory for short clicks
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
