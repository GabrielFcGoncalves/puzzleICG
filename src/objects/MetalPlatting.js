import * as THREE from 'three';
import { ModelLoader } from '../utils/ModelLoader.js';

export class MetalPlatting {
    constructor(scene, loadingManager) {
        this.scene = scene;
        this.loadingManager = loadingManager;
        this.modelLoader = new ModelLoader(this.loadingManager);
        this.group = new THREE.Group();
        this.init();
    }

    async init() {
        const textureLoader = new THREE.TextureLoader(this.loadingManager);
        
        // --- Load Lichen Rock Textures ---
        const rockDiff = textureLoader.load(new URL('../models/lichen_rock_1k.gltf/textures/lichen_rock_diff_1k.jpg', import.meta.url).href);
        const rockNor = textureLoader.load(new URL('../models/lichen_rock_1k.gltf/textures/lichen_rock_nor_gl_1k.jpg', import.meta.url).href);
        const rockARM = textureLoader.load(new URL('../models/lichen_rock_1k.gltf/textures/lichen_rock_arm_1k.jpg', import.meta.url).href);
        
        [rockDiff, rockNor, rockARM].forEach(tex => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(1, 0.5); // Adjust for the horizontal slab shape
        });

        // Heavy Ancient Stone material with Lichen - Darker
        const stoneMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a, // Darker charcoal stone
            map: rockDiff,
            normalMap: rockNor,
            aoMap: rockARM,
            roughnessMap: rockARM,
            metalnessMap: rockARM,
            roughness: 1,
            metalness: 0
        });

        const darkMetalMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 1,
            roughness: 0.2
        });

        // The back plate (interior of the holes)
        const backPlate = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 0.01), darkMetalMat);
        backPlate.position.z = -0.01;
        this.group.add(backPlate);

        // Bulky Stone Plate with real holes
        const shape = new THREE.Shape();
        const w = 1.3, h = 0.45; // Slightly larger for bulk
        shape.moveTo(-w/2, -h/2);
        shape.lineTo(w/2, -h/2);
        shape.lineTo(w/2, h/2);
        shape.lineTo(-w/2, h/2);
        shape.closePath();

        const spacing = 0.35;
        for (let i = 0; i < 3; i++) {
            const x = (i - 1) * spacing;
            const hole = new THREE.Path();
            hole.absarc(x, 0, 0.09, 0, Math.PI * 2, true);
            shape.holes.push(hole);
        }

        // Increased depth for "bulky" feel
        const extrudeSettings = { 
            depth: 0.15, 
            bevelEnabled: true, 
            bevelThickness: 0.02, 
            bevelSize: 0.02, 
            bevelSegments: 2 
        };
        const stonePlate = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, extrudeSettings), stoneMat);
        stonePlate.position.z = -0.05; // Recess it back slightly
        this.group.add(stonePlate);

        // Gemstone settings and gems

        // Load stylized gemstones
        const gemPath = new URL('../models/low_poly_stylized_gemstones/scene.gltf', import.meta.url).href;
        try {
            const gltf = await this.modelLoader.load(gemPath);
            const gemModels = gltf.scene;

            // Pick 3 different shapes
            const shapes = ['Gemstone_01_0', 'Gemstone_02_5', 'Gemstone_03_10'];
            const gemColors = [0xff0000, 0x0000ff, 0x00ff00]; // Red, Blue, Green
            const spacing = 0.35;

            gemColors.forEach((color, i) => {
                const x = (i - 1) * spacing;
                
                // Ornamental Slot - Color coordinated
                const ringMat = new THREE.MeshStandardMaterial({ 
                    color: color, 
                    emissive: color,
                    emissiveIntensity: 0.2,
                    metalness: 1, 
                    roughness: 0.1 
                });
                const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 12, 32), ringMat);
                ring.position.set(x, 0, 0.04);
                this.group.add(ring);

                // Gemstone from model
                const originalGem = gemModels.getObjectByName(shapes[i]);
                if (originalGem) {
                    const gem = originalGem.clone();
                    
                    // Individual scaling to fit the circular holes
                    let s = 0.2;
                    if (shapes[i] === 'Gemstone_02_5') s = 0.12; // Blue teardrop is long
                    if (shapes[i] === 'Gemstone_03_10') s = 0.15; // Green emerald is wide
                    
                    gem.scale.set(s, s, s);
                    gem.position.set(x, 0, 0.05);
                    
                    // Center adjustment for teardrop
                    if (shapes[i] === 'Gemstone_02_5') gem.position.y += 0.02;

                    gem.rotation.set(Math.PI / 2, 0, 0);

                    // Material override
                    gem.traverse(n => {
                        if (n.isMesh) {
                            n.material = new THREE.MeshStandardMaterial({
                                color: color,
                                emissive: color,
                                emissiveIntensity: 0.4,
                                transparent: true,
                                opacity: 0.9,
                                metalness: 0.8,
                                roughness: 0.1
                            });
                            n.userData = { isGemstone: true, gemColor: i };
                        }
                    });
                    
                    this.group.add(gem);
                }
            });
        } catch (error) {
            console.error('Error loading gemstones:', error);
        }

        this.group.userData = { isStaticPuzzlePart: true, isMetalPlatting: true };
        this.scene.add(this.group);
    }

    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }

    setRotation(x, y, z) {
        this.group.rotation.set(x, y, z);
    }
}
