import * as THREE from 'three';
import { ModelLoader } from '../utils/ModelLoader.js';
import { BirdItem } from './BirdItem.js';

export class Room {
    constructor(scene, loadingManager) {
        this.scene = scene;
        this.loadingManager = loadingManager;
        this.modelLoader = new ModelLoader(this.loadingManager);
        this.group = new THREE.Group();
        this.birdCanvas = null;
        this.init();
    }

    async init() {
        const size = 10;
        const height = 6;

        // Materials
        const textureLoader = new THREE.TextureLoader(this.loadingManager);

        // --- Wall Textures (Stone Bricks) ---
        const wallDiff = textureLoader.load(new URL('../models/stone_brick_wall_001_2k.gltf/textures/stone_brick_wall_001_diff_2k.jpg', import.meta.url).href);
        const wallNormal = textureLoader.load(new URL('../models/stone_brick_wall_001_2k.gltf/textures/stone_brick_wall_001_nor_gl_2k.jpg', import.meta.url).href);
        const wallRough = textureLoader.load(new URL('../models/stone_brick_wall_001_2k.gltf/textures/stone_brick_wall_001_rough_2k.jpg', import.meta.url).href);

        [wallDiff, wallNormal, wallRough].forEach(tex => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(4, 2);
        });

        // --- Ceiling Textures (Plaster) ---
        const ceilDiff = textureLoader.load(new URL('../models/plastered_wall_05_1k.gltf/textures/plastered_wall_05_diff_1k.jpg', import.meta.url).href);
        const ceilNormal = textureLoader.load(new URL('../models/plastered_wall_05_1k.gltf/textures/plastered_wall_05_nor_gl_1k.jpg', import.meta.url).href);
        const ceilARM = textureLoader.load(new URL('../models/plastered_wall_05_1k.gltf/textures/plastered_wall_05_arm_1k.jpg', import.meta.url).href);

        [ceilDiff, ceilNormal, ceilARM].forEach(tex => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(2, 2);
        });

        const floorDiff = textureLoader.load(new URL('../models/wood_cabinet_worn_long_1k.gltf/textures/wood_cabinet_worn_long_diff_1k.jpg', import.meta.url).href);
        const floorNormal = textureLoader.load(new URL('../models/wood_cabinet_worn_long_1k.gltf/textures/wood_cabinet_worn_long_nor_gl_1k.jpg', import.meta.url).href);
        const floorRough = textureLoader.load(new URL('../models/wood_cabinet_worn_long_1k.gltf/textures/wood_cabinet_worn_long_rough_1k.jpg', import.meta.url).href);

        [floorDiff, floorNormal, floorRough].forEach(tex => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(4, 4);
        });

        const floorMat = new THREE.MeshStandardMaterial({
            map: floorDiff,
            normalMap: floorNormal,
            roughnessMap: floorRough,
            roughness: 1,
            color: 0x332211
        });

        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x888888, // Subtle dark tint for stone
            map: wallDiff,
            normalMap: wallNormal,
            roughnessMap: wallRough,
            roughness: 1,
            metalness: 0
        });

        const ceilingMat = new THREE.MeshStandardMaterial({
            color: 0x333333, // Matching the darker study theme
            map: ceilDiff,
            normalMap: ceilNormal,
            aoMap: ceilARM,
            roughnessMap: ceilARM,
            metalnessMap: ceilARM,
            roughness: 1,
            metalness: 1
        });

        // --- Groups for Visibility Toggling ---
        this.floorGroup = new THREE.Group();
        this.floorGroup.name = "Floor";
        this.group.add(this.floorGroup);

        this.ceilingGroup = new THREE.Group();
        this.ceilingGroup.name = "Ceiling";
        this.group.add(this.ceilingGroup);

        this.wallsGroup = new THREE.Group();
        this.wallsGroup.name = "Walls";
        this.group.add(this.wallsGroup);

        this.furnitureGroup = new THREE.Group();
        this.furnitureGroup.name = "Furniture";
        this.group.add(this.furnitureGroup);

        this.group.name = "Room";
        this.group.userData.isRoom = true;

        // Floor
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(size, size), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1.7; // Match existing floor position
        floor.userData.isRoomPart = true;
        this.floorGroup.add(floor);

        // Ceiling
        const ceilingGeom = new THREE.PlaneGeometry(size, size);
        ceilingGeom.setAttribute('uv2', ceilingGeom.attributes.uv.clone());
        const ceiling = new THREE.Mesh(ceilingGeom, ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = height - 1.7;
        ceiling.userData.isRoomPart = true;
        this.ceilingGroup.add(ceiling);

        // Walls
        const wallGeom = new THREE.PlaneGeometry(size, height);
        wallGeom.setAttribute('uv2', wallGeom.attributes.uv.clone());

        // Back wall
        const backWall = new THREE.Mesh(wallGeom, wallMat);
        backWall.position.set(0, height / 2 - 1.7, -size / 2);
        backWall.userData.isRoomPart = true;
        this.wallsGroup.add(backWall);

        // Front wall (behind camera)
        const frontWall = new THREE.Mesh(wallGeom, wallMat);
        frontWall.position.set(0, height / 2 - 1.7, size / 2);
        frontWall.rotation.y = Math.PI;
        frontWall.userData.isRoomPart = true;
        this.wallsGroup.add(frontWall);

        // Left wall
        const leftWall = new THREE.Mesh(wallGeom, wallMat);
        leftWall.position.set(-size / 2, height / 2 - 1.7, 0);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.userData.isRoomPart = true;
        this.wallsGroup.add(leftWall);

        // Right wall - Replaced with 4 planes to create a hole at y=1.5, z=2
        const createWallSegment = (w, h, px, py, pz, hOffset = 0, vOffset = 0) => {
            const geom = new THREE.PlaneGeometry(w, h);
            // Match UVs to overall 10x6 layout with 4x2 tiling
            const uvAttr = geom.attributes.uv;
            for (let i = 0; i < uvAttr.count; i++) {
                let u = uvAttr.getX(i);
                let v = uvAttr.getY(i);
                // Map local (0..1) to global wall position (0..1)
                u = (hOffset + u * w) / size;
                v = (vOffset + v * h) / height;
                uvAttr.setXY(i, u, v);
            }
            const segment = new THREE.Mesh(geom, wallMat);
            segment.position.set(px, py, pz);
            segment.rotation.y = -Math.PI / 2;
            segment.userData.isRoomPart = true;
            this.wallsGroup.add(segment);
            return segment;
        };

        const holeZ = 2;
        const holeY = 1.5;
        const hSize = 1;
        const vSize = 1;

        // Top segment (Above hole)
        createWallSegment(size, height - (holeY + vSize / 2 + 1.7), size / 2, (height + holeY + vSize / 2 - 1.7) / 2, 0, 0, holeY + vSize / 2 + 1.7);
        // Bottom segment (Below hole)
        createWallSegment(size, holeY - vSize / 2 + 1.7, size / 2, (holeY - vSize / 2 - 1.7) / 2, 0, 0, 0);
        // Left segment (Z from -5 to holeZ - 0.5)
        createWallSegment(holeZ - hSize / 2 + size / 2, vSize, size / 2, holeY, (holeZ - hSize / 2 - size / 2) / 2, 0, holeY - vSize / 2 + 1.7);
        // Right segment (Z from holeZ + 0.5 to 5)
        createWallSegment(size / 2 - (holeZ + hSize / 2), vSize, size / 2, holeY, (size / 2 + holeZ + hSize / 2) / 2, holeZ + hSize / 2 + size / 2, holeY - vSize / 2 + 1.7);

        // Decorative wood trim (Baseboards)
        const trimMat = new THREE.MeshStandardMaterial({ color: 0x1a0f05 });
        const trimGeom = new THREE.BoxGeometry(size, 0.4, 0.05);

        const trimBack = new THREE.Mesh(trimGeom, trimMat);
        trimBack.position.set(0, 0.2 - 1.7, -size / 2 + 0.03);
        trimBack.userData.isRoomPart = true;
        this.wallsGroup.add(trimBack);

        const trimLeft = new THREE.Mesh(trimGeom, trimMat);
        trimLeft.rotation.y = Math.PI / 2;
        trimLeft.position.set(-size / 2 + 0.03, 0.2 - 1.7, 0);
        trimLeft.userData.isRoomPart = true;
        this.wallsGroup.add(trimLeft);

        const trimRight = new THREE.Mesh(trimGeom, trimMat);
        trimRight.rotation.y = -Math.PI / 2;
        trimRight.position.set(size / 2 - 0.03, 0.2 - 1.7, 0);
        trimRight.userData.isRoomPart = true;
        this.wallsGroup.add(trimRight);

        // --- Furniture ---
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x2b1d0e });

        // Bookshelf glued to the back-left wall
        const shelf = new THREE.Group();
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4.5, 0.5), woodMat);
        shelf.add(frame);
        // "Books" (simple boxes)
        for (let i = 0; i < 6; i++) {
            const shelf_row = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.45), woodMat);
            shelf_row.position.y = -2 + i * 0.7;
            shelf_row.position.z = 0.02;
            shelf.add(shelf_row);
        }
        shelf.position.set(-3.5, 4.5 / 2 - 1.7, -size / 2 + 0.28);
        shelf.userData.isFurniture = true;
        this.shelf = shelf; // Expose for animations
        this.furnitureGroup.add(shelf);

        // --- Model Loading ---
        try {
            const tablePath = new URL('../models/mahogany_table/scene.gltf', import.meta.url).href;
            const tableGltf = await this.modelLoader.load(tablePath);
            const tableModel = tableGltf.scene;
            tableModel.position.set(size / 2 - 0.78, -1.7, 1);
            tableModel.rotation.y = -Math.PI / 2;
            tableModel.scale.set(0.2, 0.2, 0.2); 
            tableModel.userData.isFurniture = true;
            this.furnitureGroup.add(tableModel);

            const carpetPath = new URL('../models/fine_persian_heriz_carpet/scene.gltf', import.meta.url).href;
            const carpetGltf = await this.modelLoader.load(carpetPath);
            const carpetModel = carpetGltf.scene;
            carpetModel.position.set(0, -1.69, 0); 
            carpetModel.scale.set(1.4, 1.4, 1.4); 
            carpetModel.userData.isRoomPart = true; 
            this.furnitureGroup.add(carpetModel);

            const postPath = new URL('../models/low_poly_wood_post/scene.gltf', import.meta.url).href;
            const postGltf = await this.modelLoader.load(postPath, { 
                shadows: true, 
                color: 0x443322 
            });
            const corners = [
                { x: size / 2 - 0.15, z: size / 2 - 0.15 },
                { x: -size / 2 + 0.15, z: size / 2 - 0.15 },
                { x: size / 2 - 0.15, z: -size / 2 + 0.15 },
                { x: -size / 2 + 0.15, z: -size / 2 + 0.15 }
            ];
            corners.forEach(pos => {
                const post = postGltf.scene.clone();
                post.position.set(pos.x, -1.7, pos.z);
                post.scale.set(1.5, 5, 1.5); 
                post.userData.isFurniture = true; 
                this.wallsGroup.add(post);
            });
        } catch (error) {
            console.error('Error loading room models:', error);
        }

        // Paintings
        const frameMat = new THREE.MeshStandardMaterial({ color: 0xaa8800, metalness: 0.8, roughness: 0.2 });
        const paintMat = new THREE.MeshStandardMaterial({ color: 0x111111 }); // Black "paint" or placeholder

        const createPainting = (w, h, x, y, z, rotY, texturePath, isBird) => {
            const pGroup = new THREE.Group();
            const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.05), frameMat);
            
            let currentMat = paintMat;
            if (texturePath) {
                const tex = textureLoader.load(new URL(texturePath, import.meta.url).href);
                // Zoom in and wide-scale horizontally
                tex.repeat.set(0.5, 0.6); 
                tex.offset.set(0.25, 0.2); 
                currentMat = new THREE.MeshStandardMaterial({ map: tex, transparent: true });
            }
            
            const canvas = new THREE.Mesh(new THREE.PlaneGeometry(w, h), currentMat);
            canvas.position.z = 0.031;
            
            const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
            this.whiteMaterial = whiteMaterial;
            
            if (isBird) {
                this.birdCanvas = canvas;
                this.birdPaintingMaterial = currentMat;
                this.birdCanvas.material = whiteMaterial; // Start white
                this.birdCanvas.visible = true; // Always visible as per new dynamcis
            }

            frame.receiveShadow = true;
            canvas.receiveShadow = true;

            pGroup.add(frame, canvas);
            pGroup.position.set(x, y, z);
            pGroup.rotation.y = rotY;
            pGroup.userData = { isStaticPuzzlePart: true, isPainting: true, isFurniture: true };
            return pGroup;
        };

        // Painting on the left wall: Bird Silhouette (Toggled by Space)
        this.wallsGroup.add(createPainting(1.5, 2, -size / 2 + 0.03, 1.2, 0, Math.PI / 2, '../models/paintings/bird_silhouette.png', true));

        // Painting on the back wall (above shelf height but to the right)
        this.wallsGroup.add(createPainting(1.5, 2, 2, 1.2, -size / 2 + 0.03, 0));

        try {
            const stoneTablePath = new URL('../models/stone_table_-_classical_style/scene.gltf', import.meta.url).href;
            const stoneGltf = await this.modelLoader.load(stoneTablePath);
            
            // 1. Central Table
            const stoneTable = stoneGltf.scene;
            stoneTable.position.set(0, -1.7, 0); 
            stoneTable.scale.set(1, 1.3, 1); 
            stoneTable.rotation.y = Math.PI / 2;
            stoneTable.userData = { isStaticPuzzlePart: true };
            this.table = stoneTable;
            this.furnitureGroup.add(stoneTable);

            // 2. Side Pedestal
            const sidePedestal = stoneTable.clone();
            sidePedestal.userData = {}; 
            sidePedestal.position.set(-6.2, -1.8, 0); 
            sidePedestal.scale.set(0.9, 1.4, 0.9);
            sidePedestal.rotation.y = Math.PI / 2;
            this.furnitureGroup.add(sidePedestal);
            
            // --- IRON BIRD ITEM ---
            const ironBird = new BirdItem(this.loadingManager);
            ironBird.setPosition(5.8, 1.1, 1.9); 
            ironBird.group.rotation.y = Math.PI / 2; 
            this.furnitureGroup.add(ironBird.group);

        } catch (error) {
            console.error('Error loading room models:', error);
        }

        // --- Secret Square on Right Wall (with perfect UV matching) ---
        const secretSquareGroup = new THREE.Group();
        const sqGeom = new THREE.PlaneGeometry(1, 1);
        
        // Calculate UVs to match the wall's tiled texture at position (y: 1.5, z: 2)
        // Wall spans z: [-5, 5] (10 units) and y: [-1.7, 4.3] (6 units)
        // Wall tiling: repeat(4, 2)
        const wallWidth = size;
        const wallHeight = height;
        const posZ = 2; 
        const posY = 1.5;
        
        // Horizontal UV (across Z axis for right wall): 0 is at z=-5, 1 is at z=5
        const normZ = (posZ + wallWidth / 2) / wallWidth;
        // Vertical UV: 0 is at y=-1.7, 1 is at y=4.3
        const normY = (posY + 1.7) / wallHeight;
        
        const uvAttr = sqGeom.attributes.uv;
        for (let i = 0; i < uvAttr.count; i++) {
            let u = uvAttr.getX(i); // 0..1 in plane
            let v = uvAttr.getY(i); // 0..1 in plane
            
            // Re-map 0..1 plane UVs into the specific sub-region of the 4x2 wall texture
            // Offset by the normalized wall position and scale by the "window" size (1/10 and 1/6)
            // Then multiply by tiling factor (4, 2)
            u = (normZ + (u - 0.5) * (1 / wallWidth)) * 1;
            v = (normY + (v - 0.5) * (1 / wallHeight)) * 1;
            
            uvAttr.setXY(i, u, v);
        }
        uvAttr.needsUpdate = true;
        
        const sqMesh = new THREE.Mesh(sqGeom, wallMat);
        
        // The Mark (now a Hand Palm shape)
        const handTex = textureLoader.load(new URL('../models/handprint.png', import.meta.url).href);
        const markMat = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff, 
            map: handTex,
            transparent: true, 
            opacity: 0.8,
            blending: THREE.AdditiveBlending 
        });
        
        const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.5 , 0.5), markMat);
        mark.position.z = 0.005; // Slightly in front of square
        this.secretMark = mark;
        this.secretMark.visible = false;

        secretSquareGroup.add(sqMesh, mark);
        secretSquareGroup.userData = { isStaticPuzzlePart: true, isSecretSquare: true };
        secretSquareGroup.position.set(size / 2 - 0.002, 1.5, 2); // Extremely subtle offset
        secretSquareGroup.rotation.y = -Math.PI / 2;
        this.secretSquare = secretSquareGroup; // Expose for animation
        this.wallsGroup.add(secretSquareGroup);

        // --- Hidden Compartment (The "Hole") - 5 planes to leave front open ---
        const hGroup = new THREE.Group();
        const hMat = new THREE.MeshStandardMaterial({ color: 0x010101, roughness: 0.5 });
        const depth = 1.5; // Increased depth
        
        // Back
        const back = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), hMat);
        back.position.set(depth / 2, 0, 0); 
        back.rotation.y = -Math.PI / 2;
        
        // Top
        const top = new THREE.Mesh(new THREE.PlaneGeometry(1, depth), hMat);
        top.position.set(0, 0.5, 0);
        top.rotation.x = Math.PI / 2;
        top.rotation.z = Math.PI / 2;
        
        // Bottom
        const bottom = new THREE.Mesh(new THREE.PlaneGeometry(1, depth), hMat);
        bottom.position.set(0, -0.5, 0);
        bottom.rotation.x = -Math.PI / 2;
        bottom.rotation.z = Math.PI / 2;
        
        // Left (closer to back wall, z=-5)
        const left = new THREE.Mesh(new THREE.PlaneGeometry(depth, 1), hMat);
        left.position.set(0, 0, -0.5);
        left.rotation.y = 0; // Face inwards (+Z)
        
        // Right (closer to front wall, z=5)
        const right = new THREE.Mesh(new THREE.PlaneGeometry(depth, 1), hMat);
        right.position.set(0, 0, 0.5);
        right.rotation.y = Math.PI; // Face inwards (-Z)

        hGroup.add(back, top, bottom, left, right);
        hGroup.traverse(n => { if (n.isMesh) n.receiveShadow = true; });
        hGroup.userData = { isStaticPuzzlePart: true, isSecretSquare: true };
        hGroup.position.set(size / 2 + depth / 2, 1.5, 2); 
        this.wallsGroup.add(hGroup);

        this.scene.add(this.group);
    }

    update(isEthereal, isBirdPuzzleSolved, ctx) {
        if (this.secretMark) {
            this.secretMark.visible = isEthereal;
        }

        const isHovered = ctx?.interaction?.hoveredSlot?.userData?.isPainting;
        const isDraggingBird = ctx?.uiState?.draggedInventoryIndex !== -1 && 
                             ctx?.uiState?.inventory[ctx?.uiState?.draggedInventoryIndex]?.name.toLowerCase().includes('bird');
        
        const showPreview = isHovered && isDraggingBird && !isBirdPuzzleSolved;

        if (this.birdCanvas) {
            // Before alignment: White background. 
            // After alignment: Bird image revealed, regardless of Space/Ethereal mode.
            if (isBirdPuzzleSolved) {
                this.birdCanvas.material = this.birdPaintingMaterial;
                this.birdCanvas.visible = true; 
            } else if (showPreview) {
                this.birdCanvas.material = this.birdPaintingMaterial;
                this.birdCanvas.material.transparent = true;
                this.birdCanvas.material.opacity = 0.4;
                this.birdCanvas.visible = true;
            } else {
                this.birdCanvas.material = this.whiteMaterial;
                this.birdCanvas.visible = true; // Always visible now as requested
            }
        }
    }
}
