import * as THREE from 'three';
import { ModelLoader } from '../utils/ModelLoader.js';

export class PuzzleBox {
    constructor(scene, loadingManager) {
        this.scene = scene;
        this.loadingManager = loadingManager;
        this.modelLoader = new ModelLoader(this.loadingManager);
        this.group = new THREE.Group();
        this.mixer = null;
        this.actions = {};

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
                if (n.isMesh) {
                    console.log(`PuzzleBox Mesh: ${n.name}`);
                    n.castShadow = true;
                    n.receiveShadow = true;
                    n.userData.isPuzzleBox = true;
                    n.userData.isStaticPuzzlePart = true;
                    
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
                    
                    const openside = this.actions['OpenSide5'];
                    if (openside) {
                        console.log('Button press finished, playing OpenSide5');
                        openside.reset();
                        openside.setLoop(THREE.LoopOnce);
                        openside.clampWhenFinished = true;
                        openside.play();
                    }
                }
            };

            this.mixer.addEventListener('finished', onFinished);
        } else {
            console.warn('No PressButton animation found. Available:', Object.keys(this.actions));
        }
    }



    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }

    update(delta) {
        if (this.mixer) {
            this.mixer.update(delta);
        }
    }
}

