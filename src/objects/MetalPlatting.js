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

        // Create canvas for subtle indicators
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 4;
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const offset = (0.35 / 1.3) * canvas.width; // Map 0.35 spacing to canvas
        
        // Helper function to draw a diamond
        const drawDiamond = (x, y, size) => {
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.lineTo(x + size, y);
            ctx.lineTo(x, y + size);
            ctx.lineTo(x - size, y);
            ctx.closePath();
            ctx.stroke();
        };
        
        // Helper function to draw a teardrop
        const drawTeardrop = (x, y, size) => {
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.quadraticCurveTo(x + size, y, x, y + size);
            ctx.quadraticCurveTo(x - size, y, x, y + size);
            ctx.closePath();
            ctx.stroke();
        };
        
        // Helper function to draw an emerald cut (octagon)
        const drawEmerald = (x, y, size) => {
            const inset = size * 0.4;
            ctx.beginPath();
            ctx.moveTo(x - size + inset, y - size);
            ctx.lineTo(x + size - inset, y - size);
            ctx.lineTo(x + size, y - size + inset);
            ctx.lineTo(x + size, y + size - inset);
            ctx.lineTo(x + size - inset, y + size);
            ctx.lineTo(x - size + inset, y + size);
            ctx.lineTo(x - size, y + size - inset);
            ctx.lineTo(x - size, y - size + inset);
            ctx.closePath();
            ctx.stroke();
        };
        
        // Draw symbols at mapped positions with corresponding colors
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)'; // Red
        drawDiamond(centerX - offset, centerY, 40);
        
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.4)'; // Blue
        drawTeardrop(centerX, centerY, 40);
        
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)'; // Green
        drawEmerald(centerX + offset, centerY, 40);
        
        const symbolTexture = new THREE.CanvasTexture(canvas);

        const darkMetalMat = new THREE.MeshStandardMaterial({
            color: 0x555555, // Brighter base to see texture better
            map: symbolTexture,
            metalness: 0.5,
            roughness: 0.5
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

        // Ornamental Slots
        const gemColors = [0xff0000, 0x0000ff, 0x00ff00]; // Red, Blue, Green

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
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 12, 32), ringMat);
            ring.position.set(x, 0, 0.04);
            ring.userData = { isGemSlot: true, colorIndex: i, color: color };
            this.group.add(ring);
        });

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
