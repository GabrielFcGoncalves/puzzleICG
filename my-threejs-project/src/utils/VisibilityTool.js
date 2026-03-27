import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

export class VisibilityTool {
    constructor(scene) {
        this.scene = scene;
        this.gui = new GUI({ title: 'Scene Visibility Control' });
        this.init();
    }

    init() {
        const visibilityFolder = this.gui.addFolder('Objects');
        
        // Map to keep track of added objects and avoid duplicates
        const processedNames = new Set();

        this.scene.children.forEach(child => {
            // Identify meaningful objects for the UI
            let name = child.name || child.constructor.name || 'Unnamed Object';
            
            // If it's a "Group" without a name, try to find a descriptive label in its children or userData
            if (name === 'Group' || name === 'Unnamed Object') {
                if (child.userData && child.userData.isCabinetBody) name = 'Cabinet';
                else if (child.userData && child.userData.isPuzzleBox) name = 'Puzzle Box';
                else if (child.userData && child.userData.isStand) name = 'Flashlight Stand';
                else if (child.userData && child.userData.itemName) name = child.userData.itemName;
            }

            // Fallback to type if still generic
            if (name === 'Group' || name === 'Object3D') {
                name = `${child.type} (${child.id})`;
            }

            // Avoid adding internal helpers or duplicate entries
            if (processedNames.has(name) || name.includes('Helper')) return;
            processedNames.add(name);

            // Special handling for Room to allow toggling its parts
            if (child.userData && child.userData.isRoom) {
                const roomFolder = visibilityFolder.addFolder('Room');
                child.children.forEach(part => {
                    if (part.name) {
                        roomFolder.add(part, 'visible').name(part.name);
                    }
                });
                return;
            }

            visibilityFolder.add(child, 'visible').name(name);
        });

        visibilityFolder.open();
    }

    destroy() {
        this.gui.destroy();
    }
}
