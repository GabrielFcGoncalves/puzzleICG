import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BirdItem } from './BirdItem.js';

export class Room {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.birdCanvas = null;
        this.init();
    }

    init() {
        const size = 10;
        const height = 6;

        // Materials
        const textureLoader = new THREE.TextureLoader();

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

        // Right wall
        const rightWall = new THREE.Mesh(wallGeom, wallMat);
        rightWall.position.set(size / 2, height / 2 - 1.7, 0);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.userData.isRoomPart = true;
        this.wallsGroup.add(rightWall);

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
        this.furnitureGroup.add(shelf);

        // --- Mahogany Table moved to desk's old position ---
        const loader = new GLTFLoader();
        const tablePath = new URL('../models/mahogany_table/scene.gltf', import.meta.url).href;
        
        loader.load(tablePath, (gltf) => {
            const tableModel = gltf.scene;
            tableModel.position.set(size / 2 - 0.78, -1.7, 1);
            tableModel.rotation.y = -Math.PI / 2;
            tableModel.scale.set(0.2, 0.2, 0.2); // Balanced scale
            tableModel.userData.isFurniture = true;
            
            tableModel.traverse(node => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            
            this.furnitureGroup.add(tableModel);
        }, undefined, (error) => {
            console.error('Error loading table model:', error);
        });

        // --- Decorations ---
        // Path relative to Room.js since we use import.meta.url
        const carpetPath = new URL('../models/fine_persian_heriz_carpet/scene.gltf', import.meta.url).href;
        
        loader.load(carpetPath, (gltf) => {
            const carpetModel = gltf.scene;
            carpetModel.position.set(0, -1.69, 0); // Raised slightly to avoid teary Z-fighting
            carpetModel.scale.set(1.4, 1.4, 1.4); // Balanced scale
            carpetModel.userData.isRoomPart = true; // Use rug logic (receive only)
            
            carpetModel.traverse(node => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            
            this.furnitureGroup.add(carpetModel);
        }, undefined, (error) => {
            console.error('Error loading carpet model:', error);
        });

        // --- Structural Wood Posts ---
        const postPath = new URL('../models/low_poly_wood_post/scene.gltf', import.meta.url).href;
        
        loader.load(postPath, (gltf) => {
            const corners = [
                { x: size / 2 - 0.15, z: size / 2 - 0.15 },
                { x: -size / 2 + 0.15, z: size / 2 - 0.15 },
                { x: size / 2 - 0.15, z: -size / 2 + 0.15 },
                { x: -size / 2 + 0.15, z: -size / 2 + 0.15 }
            ];
            
            corners.forEach(pos => {
                const post = gltf.scene.clone();
                post.position.set(pos.x, -1.7, pos.z);
                post.scale.set(1.5, 5, 1.5); // Scaled to reach the ceiling
                post.userData.isFurniture = true; // Use furniture logic (cast and receive)
                
                post.traverse(node => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                        if (node.material) {
                            node.material.color.set(0x443322); // Darken the wood posts
                        }
                    }
                });
                
                this.wallsGroup.add(post);
            });
        }, undefined, (error) => {
            console.error('Error loading post model:', error);
        });

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
            
            if (isBird) {
                this.birdCanvas = canvas;
                this.birdCanvas.visible = false; // Initially hidden
            }

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

        // --- Classical Stone Tables/Pedestals ---
        const stoneTablePath = new URL('../models/stone_table_-_classical_style/scene.gltf', import.meta.url).href;
        
        loader.load(stoneTablePath, (gltf) => {
            // 1. Central Table
            const stoneTable = gltf.scene;
            stoneTable.position.set(0, -1.7, 0); // On the rugs
            stoneTable.scale.set(1, 1.3, 1); // Balanced scale
            stoneTable.rotation.y = Math.PI / 2;

            stoneTable.traverse(node => {
                if (node.isMesh) {
                    node.userData.isFurniture = true;
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            
            stoneTable.userData = { isStaticPuzzlePart: true };
            this.table = stoneTable;
            this.furnitureGroup.add(stoneTable);

            // 2. Side Pedestal (Non-interactive architectural support)
            const sidePedestal = gltf.scene.clone();
            sidePedestal.userData = {}; // Disable zooming/interaction inheritance
            sidePedestal.position.set(-6.2, -1.8, 0); // Positioned under left painting
            sidePedestal.scale.set(0.9, 1.4, 0.9);
            sidePedestal.rotation.y = Math.PI / 2;
            
            sidePedestal.traverse(node => {
                if (node.isMesh) {
                    node.userData.isFurniture = true;
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            this.furnitureGroup.add(sidePedestal);
            
            // --- IRON BIRD ITEM ---
            const ironBird = new BirdItem();
            ironBird.setPosition(-3, -1.6, 0.8); // Positioned atop side pedestal
            ironBird.group.rotation.y = Math.PI / 2; // Facing into the room
            this.furnitureGroup.add(ironBird.group);
            
        }, undefined, (error) => {
            console.error('Error loading stone table:', error);
        });

        this.scene.add(this.group);
    }

    update(isEthereal) {
        if (this.birdCanvas) {
            this.birdCanvas.visible = isEthereal;
        }
    }
}
