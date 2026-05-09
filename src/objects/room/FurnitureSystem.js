import * as THREE from 'three';
import { BirdItem } from '../BirdItem.js';

export class FurnitureSystem {
    constructor(parent, size) {
        this.parent = parent;
        this.size = size;
        this.group = parent.group;
        this.loadingManager = parent.loadingManager;
        this.modelLoader = parent.modelLoader;

        this.furnitureGroup = new THREE.Group();
        this.furnitureGroup.name = "Furniture";
        this.group.add(this.furnitureGroup);
    }

    async init() {
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x2b1d0e });

        // Bookshelf -> Angel Statue
        this.createAngelStatue();

        // Models
        try {
            const tablePath = new URL('../../models/mahogany_table/scene.gltf', import.meta.url).href;
            const tableGltf = await this.modelLoader.load(tablePath);
            const tableModel = tableGltf.scene;
            tableModel.position.set(this.size / 2 - 0.78, -1.7, 1);
            tableModel.rotation.y = -Math.PI / 2;
            tableModel.scale.set(0.2, 0.2, 0.2); 
            tableModel.userData = {
                isFurniture: true,
                isStaticPuzzlePart: true,
                isSmallTable: true
            };
            this.furnitureGroup.add(tableModel);

            const carpetPath = new URL('../../models/fine_persian_heriz_carpet/scene.gltf', import.meta.url).href;
            const carpetGltf = await this.modelLoader.load(carpetPath);
            const carpetModel = carpetGltf.scene;
            carpetModel.position.set(0, -1.69, 0); 
            carpetModel.scale.set(1.4, 1.4, 1.4); 
            carpetModel.userData.isRoomPart = true; 
            this.furnitureGroup.add(carpetModel);

            // Posts
            await this.createPosts();

            // Stone Table & Pedestal
            const stoneTablePath = new URL('../../models/stone_table_-_classical_style/scene.gltf', import.meta.url).href;
            const stoneGltf = await this.modelLoader.load(stoneTablePath);
            
            const stoneTable = stoneGltf.scene;
            stoneTable.position.set(0, -1.7, 0); 
            stoneTable.scale.set(1, 1.3, 1); 
            stoneTable.rotation.y = Math.PI / 2;
            stoneTable.userData = { isStaticPuzzlePart: true };
            this.parent.table = stoneTable;
            this.furnitureGroup.add(stoneTable);

            const sidePedestal = stoneTable.clone();
            sidePedestal.userData = {}; 
            sidePedestal.position.set(-6.2, -1.8, 0); 
            sidePedestal.scale.set(0.9, 1.4, 0.9);
            sidePedestal.rotation.y = Math.PI / 2;
            this.furnitureGroup.add(sidePedestal);
            
        } catch (error) {
            console.error('Error loading furniture models:', error);
        }
    }

    async createAngelStatue() {
        const angelPath = new URL('../../models/angel_statue/scene.gltf', import.meta.url).href;
        try {
            const gltf = await this.modelLoader.load(angelPath);
            const angel = gltf.scene;
            
            // Positioning where the shelf used to be (more to the left)
            angel.position.set(-4.2, 1.25, -this.size / 2 + 0.35);
            angel.scale.set(3, 3, 3);
            
            angel.traverse(n => {
                if (n.isMesh) {
                    n.castShadow = true;
                    n.receiveShadow = true;
                }
            });

            angel.userData = {
                isFurniture: true,
                isStaticPuzzlePart: true,
                isAngelStatue: true
            };
            
            this.parent.angel = angel;
            this.furnitureGroup.add(angel);
        } catch (error) {
            console.error('Error loading angel statue:', error);
        }
    }

    async createPosts() {
        const postPath = new URL('../../models/low_poly_wood_post/scene.gltf', import.meta.url).href;
        const postGltf = await this.modelLoader.load(postPath, { 
            shadows: true, 
            color: 0x443322 
        });
        const corners = [
            { x: this.size / 2 - 0.15, z: this.size / 2 - 0.15 },
            { x: -this.size / 2 + 0.15, z: this.size / 2 - 0.15 },
            { x: this.size / 2 - 0.15, z: -this.size / 2 + 0.15 },
            { x: -this.size / 2 + 0.15, z: -this.size / 2 + 0.15 }
        ];
        corners.forEach(pos => {
            const post = postGltf.scene.clone();
            post.position.set(pos.x, -1.7, pos.z);
            post.scale.set(1.5, 5, 1.5); 
            post.userData.isFurniture = true; 
            this.parent.wallsGroup.add(post); // Note: Original added to wallsGroup
        });
    }
}
