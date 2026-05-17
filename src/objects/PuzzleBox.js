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

        // Simon Says Minigame State
        this.simonSequence = [];
        this.playerSequence = [];
        this.isSimonPlaying = false;
        this.simonLength = 5; // Start at 5
        this.simonLevel = 0;
        this.simonLevels = [5, 6, 7];
        this.colorMeshes = {};
        this.isSimonSolved = false; // Separate flag to prevent conflicts!

        // Mirror Puzzle State
        this.mirrorHeads = { 1: null, 2: null, 3: null };
        this.crystal = null;
        this.laserLine = null;
        this.isOpenSide3Finished = false; // Flag for laser activation
        this.isLaserPuzzleSolved = false; // Flag for laser puzzle completion
        this.leverPlayed = false; // Flag for lever animation

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
            // This prevents the model from being halfway buried and disappearing!
            model.position.x -= center.x;
            model.position.z -= center.z;
            model.position.y -= box.min.y;

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
                    
                    // Tag color parts for specific animations
                    const colors = ['Red', 'Blue', 'Green', 'Purple', 'Yellow', 'Start'];
                    colors.forEach(color => {
                        if (n.name.includes(color)) {
                            n.userData.isColorPart = true;
                            n.userData.animationToPlay = `${color}Action`;
                            n.userData.puzzleBoxInstance = this;
                            
                            // Store reference for glowing effect
                            this.colorMeshes[color] = n;
                            if (n.material) {
                                n.material = n.material.clone(); // Ensure unique material for glowing!
                            }
                        }
                    });

                    // Tag mirrors and gem
                    if (n.name === 'MirrorHead1') { this.mirrorHeads[1] = n; n.userData.isMirror = true; }
                    if (n.name === 'MirrorHead2') { this.mirrorHeads[2] = n; n.userData.isMirror = true; }
                    if (n.name === 'MirrorHead3') { this.mirrorHeads[3] = n; n.userData.isMirror = true; }
                    if (n.name.toLowerCase().includes('crystal')) {
                        console.log(`FOUND CRYSTAL: ${n.name}`);
                        this.crystal = n;
                    }

                    // Specific check for the cube to make it uniquely clickable if needed
                    if (n.name.toLowerCase().includes('cube') || n.name.toLowerCase().includes('button')) {
                        console.log(`MATCHED BUTTON: ${n.name}`);
                        n.userData.isPushButton = true;
                    }

                    // Specific check for the lever
                    if (n.name.toLowerCase().includes('lever')) {
                        console.log(`MATCHED LEVER: ${n.name}`);
                        n.userData.isLever = true;
                    }
                }
            });

            this.group.add(model);
            
            // Adjust pivots for mirror heads to rotate around their base
            for (let i = 1; i <= 3; i++) {
                const mirror = this.mirrorHeads[i];
                if (mirror && mirror.geometry) {
                    mirror.geometry.computeBoundingBox();
                    const box = mirror.geometry.boundingBox;
                    
                    // Find the bottom center of the geometry
                    const bottomCenter = new THREE.Vector3(
                        (box.min.x + box.max.x) / 2,
                        box.min.y, // This is the contact point with MirrorBody
                        (box.min.z + box.max.z) / 2
                    );
                    
                    // Shift geometry so the bottom center is at (0,0,0) local pivot
                    mirror.geometry.translate(-bottomCenter.x, -bottomCenter.y, -bottomCenter.z);
                    
                    // Compensate the mesh position so it stays in the same visual place
                    const offset = bottomCenter.clone().applyQuaternion(mirror.quaternion);
                    mirror.position.add(offset);
                    
                    console.log(`Adjusted pivot for ${mirror.name} to its base.`);
                }
            }

            // Create START text on the button
            this.createStartText();            
            
            // Create procedural crystal if not found in model
            if (!this.crystal) {
                this.createProceduralCrystal();
                const mirror1 = this.mirrorHeads[1];
                if (mirror1) {
                    const pos = new THREE.Vector3();
                    // Ensure world matrix is updated to get correct position!
                    model.updateMatrixWorld(true);
                    mirror1.getWorldPosition(pos);
                    const localPos = this.group.worldToLocal(pos.clone());
                    this.crystalAssembly.position.set(-0.80, localPos.y + 0.1, 0.84);
                    console.log(`Positioned crystal at local Y: ${localPos.y}`);
                }
            }
            
            // Paper note removed in favor of texture in cabinet
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
            
            // Listen for OpenSide3 completion to trigger laser
            if (name === 'OpenSide3') {
                const onFinished = (e) => {
                    if (e.action === action) {
                        console.log("OpenSide3 finished! Laser activated.");
                        this.isOpenSide3Finished = true;
                        this.mixer.removeEventListener('finished', onFinished);
                    }
                };
                this.mixer.addEventListener('finished', onFinished);
            }
        } else {
            console.warn(`Animation ${name} not found. Available:`, Object.keys(this.actions));
        }
    }

    playLever() {
        if (this.leverPlayed) return;
        this.leverPlayed = true;

        const moveAction = this.actions['Lever move'];
        const topUpAction = this.actions['TopUp'];
        
        if (moveAction) {
            console.log('Playing Lever move animation...');
            moveAction.reset();
            moveAction.setLoop(THREE.LoopOnce);
            moveAction.clampWhenFinished = true;
            moveAction.play();
            
            const onFinished = (e) => {
                if (e.action === moveAction) {
                    this.mixer.removeEventListener('finished', onFinished);
                    
                    if (topUpAction) {
                        console.log('Playing TopUp animation...');
                        topUpAction.reset();
                        topUpAction.setLoop(THREE.LoopOnce);
                        topUpAction.clampWhenFinished = true;
                        topUpAction.play();
                    } else {
                        console.warn('No TopUp animation found.');
                    }
                }
            };
            this.mixer.addEventListener('finished', onFinished);
        } else {
            console.warn('No Lever move animation found. Available:', Object.keys(this.actions));
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

    startSimonGame() {
        if (this.isSimonPlaying) return;
        
        console.log("Starting Simon game...");
        this.simonLevel = 0;
        this.simonLength = this.simonLevels[this.simonLevel];
        
        this.generateAndPlaySequence();
    }

    generateAndPlaySequence() {
        this.simonSequence = [];
        const colors = ['Red', 'Blue', 'Green', 'Purple', 'Yellow'];
        for (let i = 0; i < this.simonLength; i++) {
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            this.simonSequence.push(randomColor);
        }
        
        console.log(`Level ${this.simonLevel} Sequence generated:`, this.simonSequence);
        if (globalThis.document) {
            const status = globalThis.document.getElementById('status-text');
            if (status) status.innerText = `STATUS: WATCH SEQUENCE (LEVEL ${this.simonLevel + 1}/3)`;
        }
        this.playSimonSequence();
    }

    async playSimonSequence() {
        this.isSimonPlaying = true;
        this.playerSequence = []; // Reset player input
        
        // Wait a bit before starting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        for (const color of this.simonSequence) {
            const actionName = `${color}Action`;
            console.log(`Playing sequence step: ${actionName}`);
            this.playAnimation(actionName);
            
            // Make the active button glow with its specific color!
            const mesh = this.colorMeshes[color];
            let originalEmissive;
            if (mesh && mesh.material) {
                originalEmissive = mesh.material.emissive.clone();
                
                const colorMap = {
                    'Red': 0xff3333,
                    'Blue': 0x3333ff,
                    'Green': 0x33ff33,
                    'Purple': 0xcc33cc,
                    'Yellow': 0xffff33,
                    'Start': 0xffffff
                };
                
                mesh.material.emissive.setHex(colorMap[color] || 0x555555);
            }
            
            // Wait for 800ms while shining
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Restore original emissive
            if (mesh && mesh.material && originalEmissive) {
                mesh.material.emissive.copy(originalEmissive);
            }
            
            // Wait another 400ms before the next button
            await new Promise(resolve => setTimeout(resolve, 400));
        }
        
        this.isSimonPlaying = false;
        console.log("Simon sequence finished playing. Player turn!");
        if (globalThis.document) {
            const status = globalThis.document.getElementById('status-text');
            if (status) status.innerText = "STATUS: REPEAT THE SEQUENCE!";
        }
    }

    handleColorInput(color) {
        if (this.isSimonPlaying) return;
        if (this.simonSequence.length === 0) return; // Game not started!
        
        console.log(`Player pressed: ${color}`);
        this.playerSequence.push(color);
        
        // Play the animation for the pressed color!
        this.playAnimation(`${color}Action`);
        
        // Check if the input matches
        const currentIndex = this.playerSequence.length - 1;
        if (this.playerSequence[currentIndex] !== this.simonSequence[currentIndex]) {
            console.log("WRONG SEQUENCE! Resetting...");
            this.playerSequence = [];
            if (globalThis.document) {
                const status = globalThis.document.getElementById('status-text');
                if (status) status.innerText = "STATUS: WRONG SEQUENCE! TRY AGAIN!";
            }
            return;
        }
        
        // Check if completed
        if (this.playerSequence.length === this.simonSequence.length) {
            console.log("SEQUENCE COMPLETED!");
            
            this.simonLevel++;
            if (this.simonLevel < this.simonLevels.length) {
                this.simonLength = this.simonLevels[this.simonLevel];
                if (globalThis.document) {
                    const status = globalThis.document.getElementById('status-text');
                    if (status) status.innerText = `STATUS: LEVEL ${this.simonLevel} COMPLETE! WATCH NEXT!`;
                }
                
                // Start next level immediately with a small delay
                setTimeout(() => {
                    this.generateAndPlaySequence();
                }, 1500);
            } else {
                console.log("ALL LEVELS COMPLETED!");
                if (globalThis.document) {
                    const status = globalThis.document.getElementById('status-text');
                    if (status) status.innerText = "STATUS: PUZZLE SOLVED!";
                }
                
                // Trigger success!
                if (!this.isSimonSolved) {
                    this.isSimonSolved = true;
                    this.playAnimation('OpenSide3'); // Play OpenSide3 as requested!
                }
            }
        }
    }

    createStartText() {
        const startMesh = this.colorMeshes ? this.colorMeshes['Start'] : null;
        if (!startMesh) {
            console.warn("Start mesh not found for text label!");
            return;
        }
        
        const canvas = globalThis.document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, 256, 128);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('START', 128, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ 
            map: texture, 
            transparent: true,
            side: THREE.DoubleSide
        });
        
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.075), material);
        
        startMesh.add(plane);
        plane.position.set(0, 0, 0.02); // Slightly offset in local Z
        console.log("Created START text on button");
    }

    createProceduralCrystal() {
        this.crystalAssembly = new THREE.Group();
        
        const crystalGeom = new THREE.OctahedronGeometry(0.04, 0);
        const crystalMat = new THREE.MeshStandardMaterial({
            color: 0xaa00ff,
            emissive: 0x330066,
            roughness: 0.1,
            transparent: true,
            opacity: 0.9
        });
        this.crystal = new THREE.Mesh(crystalGeom, crystalMat);
        this.crystalAssembly.add(this.crystal);
        
        const frameGeom = new THREE.BoxGeometry(0.08, 0.15, 0.08);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 }); // Brown
        const frameMesh = new THREE.Mesh(frameGeom, frameMat);
        frameMesh.position.y = -0.10; // Lowered slightly to account for thickness
        this.crystalAssembly.add(frameMesh);
        
        this.group.add(this.crystalAssembly);
        console.log("Procedural crystal created and added to box.");
    }

    createPaperNote() {
        // Create canvas for drawing
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Background: Paper color
        ctx.fillStyle = '#fdfbf0'; // Cream/Paper color
        ctx.fillRect(0, 0, 256, 256);
        
        // Draw border
        ctx.strokeStyle = '#c2b280';
        ctx.lineWidth = 4;
        ctx.strokeRect(5, 5, 246, 246);
        
        // Draw the infinity/8 diagram
        ctx.strokeStyle = '#3a2e1d'; // Sepia ink
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        // Points mapped in 2D space on paper
        const pCrystal = { x: 50, y: 50 };
        const pM1 = { x: 200, y: 50 };
        const pM2 = { x: 50, y: 200 };
        const pM3 = { x: 200, y: 200 };
        
        // Crystal -> M1 -> M2 -> M3 -> Crystal
        ctx.moveTo(pCrystal.x, pCrystal.y);
        ctx.lineTo(pM1.x, pM1.y);
        ctx.lineTo(pM2.x, pM2.y);
        ctx.lineTo(pM3.x, pM3.y);
        ctx.lineTo(pCrystal.x, pCrystal.y);
        ctx.stroke();
        
        // Draw nodes
        ctx.fillStyle = '#ff00aa'; // Pink laser indicator on drawing
        const drawNode = (p, label) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px Courier';
            ctx.fillText(label, p.x - 15, p.y - 12);
            ctx.fillStyle = '#ff00aa'; // Reset for next node
        };
        
        drawNode(pCrystal, 'C');
        drawNode(pM1, 'M1');
        drawNode(pM2, 'M2');
        drawNode(pM3, 'M3');
        
        // Title
        ctx.fillStyle = '#000';
        ctx.font = '16px Courier';
        ctx.fillText('Sequence', 80, 135);
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshStandardMaterial({ 
            map: texture,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const geometry = new THREE.PlaneGeometry(0.25, 0.25);
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position on the box or nearby!
        mesh.position.set(-0.85, 0.1, 0.6); 
        mesh.rotation.y = -Math.PI / 2; // Face left
        
        this.group.add(mesh);
        console.log("Paper note added to box.");
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

    updateLaser() {
        if (!this.mirrorHeads) return;
        
        const mirror1 = this.mirrorHeads[1];
        if (!mirror1) return; // Need at least the first mirror!
        
        // Only appear once OpenSide3 is finished!
        if (!this.isOpenSide3Finished) {
            if (this.laserLine) this.laserLine.visible = false;
            return;
        }
        if (this.laserLine) this.laserLine.visible = true;
        
        const startPos = new THREE.Vector3();
        const targetPos = new THREE.Vector3();
        mirror1.getWorldPosition(targetPos);

        if (this.crystal) {
            this.crystal.getWorldPosition(startPos);
        } else {
            // Fallback: Come from the interior of the box (center X, Z) at the mirrorhead Y level!
            this.group.getWorldPosition(startPos); // Get box center in world space!
            startPos.y = targetPos.y; // Set Y level to match mirror!
        }
        
        const direction = new THREE.Vector3().subVectors(targetPos, startPos).normalize();
        
        const points = [startPos.clone()];
        
        // Raycast to find the exact hit on Mirror1 and get the normal!
        const raycaster = new THREE.Raycaster();
        
        const mirrorsArray = [];
        if (this.mirrorHeads[1]) mirrorsArray.push(this.mirrorHeads[1]);
        if (this.mirrorHeads[2]) mirrorsArray.push(this.mirrorHeads[2]);
        if (this.mirrorHeads[3]) mirrorsArray.push(this.mirrorHeads[3]);
        if (this.crystal) mirrorsArray.push(this.crystal); // Add crystal to interact with laser!
        
        let currentOrigin = startPos.clone();
        let currentDir = direction.clone();
        let reflections = 0;
        const maxReflections = 5;
        
        const hitOrder = [];
        
        while (reflections < maxReflections) {
            // Offset the origin slightly in the direction of the ray to prevent self-intersection!
            const rayOrigin = currentOrigin.clone().add(currentDir.clone().multiplyScalar(0.01));
            raycaster.set(rayOrigin, currentDir);
            
            const intersects = raycaster.intersectObjects(mirrorsArray, true);
            
            if (intersects.length > 0) {
                const hit = intersects[0];
                points.push(hit.point.clone());
                
                // Track hit object
                let current = hit.object;
                let mirrorId = -1;
                while (current) {
                    if (current === this.mirrorHeads[1]) { mirrorId = 1; break; }
                    if (current === this.mirrorHeads[2]) { mirrorId = 2; break; }
                    if (current === this.mirrorHeads[3]) { mirrorId = 3; break; }
                    if (current === this.crystal) { mirrorId = 0; break; }
                    current = current.parent;
                }
                
                if (mirrorId !== -1) {
                    hitOrder.push(mirrorId);
                }
                
                // Calculate reflected direction!
                const normal = hit.face.normal.clone();
                // Transform local normal to world space!
                normal.transformDirection(hit.object.matrixWorld);
                
                currentDir.reflect(normal).normalize();
                currentOrigin.copy(hit.point);
                reflections++;
                
                // If we hit the crystal again, stop tracing to avoid infinite loops or weird patterns
                if (mirrorId === 0 && reflections > 1) {
                    break;
                }
            } else {
                // If it doesn't hit any mirror, draw it to the edge of the scene or a fixed distance!
                const endPoint = currentOrigin.clone().add(currentDir.clone().multiplyScalar(5));
                points.push(endPoint);
                break;
            }
        }
        
        // Check win condition: Crystal (0) -> M1 (1) -> M2 (2) -> M3 (3) -> Crystal (0)
        // Since the first ray always points to M1, the first hit should be 1.
        const isWin = hitOrder.length >= 4 && 
                      hitOrder[0] === 1 && 
                      hitOrder[1] === 2 && 
                      hitOrder[2] === 3 && 
                      hitOrder[3] === 0;
                      
        if (isWin && !this.isLaserPuzzleSolved) {
            this.isLaserPuzzleSolved = true;
            console.log("Laser puzzle solved! Playing OpenSide4.");
            this.playAnimation('OpenSide4');
        }
        
        // Update the line geometry!
        if (!this.laserLine) {
            const material = new THREE.LineBasicMaterial({ color: 0xff66cc }); // Pink!
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            this.laserLine = new THREE.Line(geometry, material);
            this.scene.add(this.laserLine);
        } else {
            this.laserLine.geometry.setFromPoints(points);
            this.laserLine.geometry.attributes.position.needsUpdate = true;
        }
    }

    update(delta) {
        if (this.mixer) {
            this.mixer.update(delta);
        }
        
        // Update the laser reflection puzzle
        this.updateLaser();

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

