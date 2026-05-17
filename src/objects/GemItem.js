import * as THREE from 'three';
import { ModelLoader } from '../utils/ModelLoader.js';
import { Item } from './Item.js';

export class GemItem extends Item {
    constructor(loadingManager, color = 0xff0000, shapeName = 'Gemstone_01_0') {
        super('Gemstone');
        this.loadingManager = loadingManager;
        this.modelLoader = new ModelLoader(this.loadingManager);
        this.color = color;
        this.shapeName = shapeName;
        this.group.userData.isSmallProp = true;
        this.group.userData.color = color;
        this.preserveRotationInThumbnail = true;
        this.init();
    }

    async init() {
        const gemPath = new URL('../models/low_poly_stylized_gemstones/scene.gltf', import.meta.url).href;

        try {
            const gltf = await this.modelLoader.load(gemPath);
            const originalGem = gltf.scene.getObjectByName(this.shapeName);
            
            if (originalGem) {
                const gem = originalGem.clone();
                
                let s = 0.2;
                if (this.shapeName === 'Gemstone_02_5') s = 0.12;
                if (this.shapeName === 'Gemstone_03_10') s = 0.15;
                
                gem.scale.set(s, s, s);
                
                gem.traverse(n => {
                    if (n.isMesh) {
                        n.material = new THREE.MeshStandardMaterial({
                            color: this.color,
                            emissive: this.color,
                            emissiveIntensity: 0.4,
                            transparent: true,
                            opacity: 0.9,
                            metalness: 0.8,
                            roughness: 0.1
                        });
                        // Mark as pickupable so it can be dragged to inventory
                        n.userData = { isItem: true, isPickupable: true, itemInstance: this, itemData: { name: 'Gemstone', type: 'gem' } };
                    }
                });
                
                // Grounding fix
                const box = new THREE.Box3().setFromObject(gem);
                const center = box.getCenter(new THREE.Vector3());
                gem.position.x -= center.x;
                gem.position.z -= center.z;
                gem.position.y -= box.min.y;
                
                this.group.add(gem);
                
                // Add a larger invisible hit box to make it easier to pick up
                const hitBoxGeom = new THREE.SphereGeometry(0.2, 16, 16);
                const hitBoxMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
                const hitBox = new THREE.Mesh(hitBoxGeom, hitBoxMat);
                hitBox.position.y = 0.05; // Center it slightly above bottom
                hitBox.userData = { isHitBox: true, isItem: true, isPickupable: true, itemInstance: this, itemData: { name: 'Gemstone', type: 'gem' } };
                this.group.add(hitBox);
                

            }
        } catch (error) {
            console.error('Error loading gem model:', error);
        }
    }
}
