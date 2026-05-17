import * as THREE from 'three';
import { ModelLoader } from '../utils/ModelLoader.js';
import { Item } from './Item.js';
import { GemItem } from './GemItem.js';

export class TreasureChestItem extends Item {
    constructor(loadingManager) {
        super('Treasure Chest');
        this.loadingManager = loadingManager;
        this.modelLoader = new ModelLoader(this.loadingManager);
        this.group.userData.isSmallProp = true;
        this.preserveRotationInThumbnail = true;
        this.init();
    }

    async init() {
        const path = new URL('../models/treasure_chest_wooden_jewelry_box/Chest.glb', import.meta.url).href;
        try {
            const gltf = await this.modelLoader.load(path);
            const model = gltf.scene;
            this.animations = gltf.animations;

            // Scale to a consistent size
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            const targetWidth = 0.8;
            const scale = targetWidth / Math.max(size.x, size.z);
            model.scale.setScalar(scale);

            // Ground the model so its base sits at y=0 of this group
            box.setFromObject(model);
            model.position.y -= box.min.y;

            model.traverse(n => {
                if (n.isMesh) {
                    console.log('Treasure Chest Part:', n.name);
                    n.castShadow = true;
                    n.receiveShadow = true;

                    // Identify parts based on findings
                    if (n.name === 'Object_3') {
                        n.userData.isTreasureLid = true;
                    }
                    if (n.name === 'Object_6') {
                        n.userData.isTreasureLock = true;
                        n.userData.restRotationX = n.rotation.x;
                        n.userData.openedRotationX = n.rotation.x - Math.PI / 2.5; // Rotate up
                        n.userData.isOpen = false;
                    }
                }
            });

            this.group.add(model);

            // Add blue gem inside the chest
            this.blueGem = new GemItem(this.loadingManager, 0x0000ff);
            this.blueGem.group.position.set(0, 0.05, 0); // Position inside the chest
            this.blueGem.group.scale.set(0.8, 0.8, 0.8); // Make it fit inside
            this.group.add(this.blueGem.group);
        } catch (error) {
            console.error('Error loading TreasureChestItem:', error);
        }
    }
}
