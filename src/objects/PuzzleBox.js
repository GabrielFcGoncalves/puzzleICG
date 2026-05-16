import * as THREE from 'three';
import { ModelLoader } from '../utils/ModelLoader.js';
import { MetalWeight } from './MetalWeight.js';

export class PuzzleBox {
    constructor(scene, loadingManager) {
        this.scene = scene;
        this.loadingManager = loadingManager;
        this.modelLoader = new ModelLoader(this.loadingManager);
        this.group = new THREE.Group();
        this.mixer = null;
        this.actions = {};
        
        this.plates = { 1: null, 2: null };
        this.scalePart = null;
        this.plateWeights = { 1: 0, 2: 0 };
        this.plateVisuals = { 1: [], 2: [] };
        this.originalPlateY = { 1: 0, 2: 0 };
        this.targetPlateYOffset = 0;
        this.scaleAnimationsFinished = false;
        this.isSolved = false;

        // Mark as puzzle part immediately so interactions are ready
        this.group.userData = { isPuzzleBox: true, isStaticPuzzlePart: true, isSmallProp: true };

        this.init();
    }

    async init() {
        const path = new URL('../models/Object.glb', import.meta.url).href;
        try {
            const gltf = await this.modelLoader.load(path);
            const model = gltf.scene;

            // Setup animations
            // Mixer root MUST be gltf.scene (model), not a wrapper Group.
            // PropertyBinding resolves node names starting from this root.
            if (gltf.animations && gltf.animations.length > 0) {
                console.log('PuzzleBox animations:', gltf.animations.map(a => a.name));
                this.mixer = new THREE.AnimationMixer(model);
                gltf.animations.forEach(clip => {
                    // Pass model explicitly so bindings resolve inside the correct subtree
                    this.actions[clip.name] = this.mixer.clipAction(clip, model);
                });
            }

            // Compute bounding box to anchor the model at its base
            const box = new THREE.Box3().setFromObject(model);
            const center = new THREE.Vector3();
            const size = new THREE.Vector3();
            box.getCenter(center);
            box.getSize(size);

            // Place pivot at base: center X/Z, but set Y so bottom is at y=0
            model.position.x -= center.x;
            model.position.z -= center.z;
            model.position.y -= box.min.y; // Lift so bottom sits at y=0

            // Scale to fit roughly the same footprint as the old box (~0.8 units tall)
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 0.8;
            const scale = targetSize / maxDim;
            model.scale.setScalar(scale);

            model.traverse(n => {
                if (n.name === 'ScalePlate1') {
                    n.userData.isScalePlate = true;
                    n.userData.plateId = 1;
                    n.userData.puzzleBoxInstance = this;
                    this.plates[1] = n;
                    this.originalPlateY[1] = n.position.y + 0.5; // Raised by default
                    
                    // Tag all children meshes so raycasting hits them directly
                    n.traverse(child => {
                        if (child.isMesh) {
                            child.userData.isScalePlate = true;
                            child.userData.plateId = 1;
                            child.userData.puzzleBoxInstance = this;
                        }
                    });
                } else if (n.name === 'ScalePlate2') {
                    n.userData.isScalePlate = true;
                    n.userData.plateId = 2;
                    n.userData.puzzleBoxInstance = this;
                    this.plates[2] = n;
                    this.originalPlateY[2] = n.position.y + 0.5; // Raised by default
                    
                    // Tag all children meshes so raycasting hits them directly
                    n.traverse(child => {
                        if (child.isMesh) {
                            child.userData.isScalePlate = true;
                            child.userData.plateId = 2;
                            child.userData.puzzleBoxInstance = this;
                        }
                    });
                } else if (n.name === 'Scale part' || n.name === 'ScalePart') {
                    this.scalePart = n;
                }

                if (n.isMesh) {
                    console.log(`PuzzleBox Mesh: ${n.name}`);
                    n.castShadow = true;
                    n.receiveShadow = true;
                    n.userData.isPuzzleBox = true;
                    n.userData.isStaticPuzzlePart = true;
                    n.userData.puzzleBoxInstance = this;
                    
                    // Specific check for the cube to make it uniquely clickable if needed
                    if (n.name.toLowerCase().includes('cube') || n.name.toLowerCase().includes('button')) {
                        console.log(`MATCHED BUTTON: ${n.name}`);
                        n.userData.isPushButton = true;
                    }
                }
            });

            this.group.add(model);
            
            
        } catch (error) {
            console.error('Error loading PuzzleBox model:', error);
        }
    }

    playPressedButton() {
        if (this.buttonPressed) return;
        this.buttonPressed = true;

        const action = this.actions['PressButton'];
        if (action) {
            console.log('Playing PressButton animation...');
            action.reset();
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            action.play();

            // Sequence the next animation to start after the button press is over
            const onFinished = (e) => {
                if (e.action === action) {
                    this.mixer.removeEventListener('finished', onFinished);
                    
                    this.playAnimation('OpenSide1');
                    this.playAnimation('Scale appear');
                    this.playAnimation('ScalePlate1');
                    this.playAnimation('ScalePlate2');
                    this.playAnimation('ScalePart');

                    // Listen for the plates' appearance animation to finish
                    const onPlatesFinished = (e2) => {
                        if (e2.action === this.actions['ScalePlate1'] || e2.action === this.actions['ScalePlate2']) {
                            this.mixer.removeEventListener('finished', onPlatesFinished);
                            
                            // Capture the correct heights AFTER the animation has moved them!
                            setTimeout(() => {
                                if (this.plates[1]) this.originalPlateY[1] = this.plates[1].position.y;
                                if (this.plates[2]) this.originalPlateY[2] = this.plates[2].position.y;
                                this.scaleAnimationsFinished = true;
                                console.log("Scale animations finished. Captured plate heights:", this.originalPlateY);
                                
                                // Spawn the starting weight on the scale now!
                                const startWeight = new MetalWeight(130);
                                this.addWeightToPlate(1, startWeight);
                            }, 50); // Small timeout to ensure matrix updates are fully settled
                        }
                    };
                    this.mixer.addEventListener('finished', onPlatesFinished);
                }
            };

            this.mixer.addEventListener('finished', onFinished);
        } else {
            console.warn('No PressButton animation found. Available:', Object.keys(this.actions));
        }
    }

    playAnimation(name) {
        const action = this.actions[name];
        if (action) {
            console.log(`Playing animation: ${name}`);
            action.reset();
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            action.play();
        } else {
            console.warn(`Animation ${name} not found. Available:`, Object.keys(this.actions));
        }
    }



    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }

    addWeightToPlate(plateId, weightItem) {
        const weightValue = weightItem.weightType;
        this.plateWeights[plateId] += weightValue;
        this.updateScaleBalance();
        
        // Add the weight visually to the plate
        const numWeights = this.plateVisuals[plateId].length;
        
        if (weightItem.group.parent) {
            weightItem.group.parent.remove(weightItem.group);
        }
        
        // PuzzleBox group has a scale of 1.75 in MainScene.
        // To make the weight have a reasonable size, we set its local scale here.
        // This avoids inheriting the non-uniform scale of the glTF plates.
        weightItem.group.scale.setScalar(0.4 / 1.75); 
        
        this.group.add(weightItem.group); // Add to main group instead of plate
        this.plateVisuals[plateId].push(weightItem);
        
        // Tag the weight so we know it's on a plate
        weightItem.group.userData.onPlateId = plateId;
        weightItem.group.userData.puzzleBox = this;
        

    }

    removeWeightFromPlate(plateId, weightItem) {
        const index = this.plateVisuals[plateId].indexOf(weightItem);
        if (index !== -1) {
            this.plateVisuals[plateId].splice(index, 1);
            this.plateWeights[plateId] -= weightItem.weightType;
            this.updateScaleBalance();
            
            // Clear tags
            weightItem.group.userData.onPlateId = null;
            weightItem.group.userData.puzzleBox = null;
        }
    }

    updateScaleBalance() {
        const diff = this.plateWeights[2] - this.plateWeights[1]; // Plate 2 - Plate 1
        // Make it proportional to weight difference. Let's say 100g = 0.015 units of movement.
        const factor = 0.01; 
        this.targetPlateYOffset = diff * factor;

        if (!this.isSolved && this.plateWeights[1] > 0 && this.plateWeights[1] === this.plateWeights[2]) {
            console.log("SCALE BALANCED!");
            this.isSolved = true;
            this.playAnimation('OpenSide2');
            this.playAnimation('Board appear');
            
            if (globalThis.document) {
                const status = globalThis.document.getElementById('status-text');
                if (status) status.innerText = "STATUS: SCALE BALANCED! BOX OPENING!";
            }
        }
    }

    update(delta) {
        if (this.mixer) {
            this.mixer.update(delta);
        }
        if (this.plates[1] && this.plates[2]) {
            if (this.scaleAnimationsFinished) {
                // Smoothly move the plates vertically to simulate weight
                const targetY1 = this.originalPlateY[1] + this.targetPlateYOffset;
                const targetY2 = this.originalPlateY[2] - this.targetPlateYOffset;
                
                this.plates[1].position.y = THREE.MathUtils.lerp(this.plates[1].position.y, targetY1, 0.1);
                this.plates[2].position.y = THREE.MathUtils.lerp(this.plates[2].position.y, targetY2, 0.1);
            }
            
            // Manually update positions of attached weights to follow the plates
            const plate1WorldPos = new THREE.Vector3();
            const plate2WorldPos = new THREE.Vector3();
            
            // Use bounding box center to get the true visual center of the plates!
            // This handles cases where the pivot of the meshes is at the center of the scale.
            const box1 = new THREE.Box3().setFromObject(this.plates[1]);
            const box2 = new THREE.Box3().setFromObject(this.plates[2]);
            box1.getCenter(plate1WorldPos);
            box2.getCenter(plate2WorldPos);
            
            const fixedOffsets = [
                {x: 0, z: 0},
                {x: 0.05, z: 0.05},
                {x: -0.05, z: -0.05},
                {x: -0.05, z: 0.05},
                {x: 0.05, z: -0.05}
            ];

            this.plateVisuals[1].forEach((weight, index) => {
                const localPos = this.group.worldToLocal(plate1WorldPos.clone());
                const offset = fixedOffsets[index % fixedOffsets.length];
                weight.setPosition(localPos.x + offset.x, localPos.y + 0.005, localPos.z + offset.z);
            });
            
            this.plateVisuals[2].forEach((weight, index) => {
                const localPos = this.group.worldToLocal(plate2WorldPos.clone());
                const offset = fixedOffsets[index % fixedOffsets.length];
                weight.setPosition(localPos.x + offset.x, localPos.y + 0.005, localPos.z + offset.z);
            });
        }
    }
}

