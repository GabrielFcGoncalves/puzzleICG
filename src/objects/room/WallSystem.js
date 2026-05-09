import * as THREE from 'three';

export class WallSystem {
    constructor(parent, size, height) {
        this.parent = parent;
        this.size = size;
        this.height = height;
        this.group = parent.group;
        this.loadingManager = parent.loadingManager;
        
        this.floorGroup = new THREE.Group();
        this.floorGroup.name = "Floor";
        this.group.add(this.floorGroup);

        this.ceilingGroup = new THREE.Group();
        this.ceilingGroup.name = "Ceiling";
        this.group.add(this.ceilingGroup);

        this.wallsGroup = new THREE.Group();
        this.wallsGroup.name = "Walls";
        this.group.add(this.wallsGroup);
    }

    init() {
        const textureLoader = new THREE.TextureLoader(this.loadingManager);

        // --- Wall Textures ---
        const wallDiff = textureLoader.load(new URL('../../models/stone_brick_wall_001_2k.gltf/textures/stone_brick_wall_001_diff_2k.jpg', import.meta.url).href);
        const wallNormal = textureLoader.load(new URL('../../models/stone_brick_wall_001_2k.gltf/textures/stone_brick_wall_001_nor_gl_2k.jpg', import.meta.url).href);
        const wallRough = textureLoader.load(new URL('../../models/stone_brick_wall_001_2k.gltf/textures/stone_brick_wall_001_rough_2k.jpg', import.meta.url).href);

        [wallDiff, wallNormal, wallRough].forEach(tex => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(4, 2);
        });

        // --- Ceiling Textures ---
        const ceilDiff = textureLoader.load(new URL('../../models/plastered_wall_05_1k.gltf/textures/plastered_wall_05_diff_1k.jpg', import.meta.url).href);
        const ceilNormal = textureLoader.load(new URL('../../models/plastered_wall_05_1k.gltf/textures/plastered_wall_05_nor_gl_1k.jpg', import.meta.url).href);
        const ceilARM = textureLoader.load(new URL('../../models/plastered_wall_05_1k.gltf/textures/plastered_wall_05_arm_1k.jpg', import.meta.url).href);

        [ceilDiff, ceilNormal, ceilARM].forEach(tex => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(2, 2);
        });

        // --- Floor Textures ---
        const floorDiff = textureLoader.load(new URL('../../models/wood_cabinet_worn_long_1k.gltf/textures/wood_cabinet_worn_long_diff_1k.jpg', import.meta.url).href);
        const floorNormal = textureLoader.load(new URL('../../models/wood_cabinet_worn_long_1k.gltf/textures/wood_cabinet_worn_long_nor_gl_1k.jpg', import.meta.url).href);
        const floorRough = textureLoader.load(new URL('../../models/wood_cabinet_worn_long_1k.gltf/textures/wood_cabinet_worn_long_rough_1k.jpg', import.meta.url).href);

        [floorDiff, floorNormal, floorRough].forEach(tex => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(4, 4);
        });

        // --- Materials ---
        const floorMat = new THREE.MeshStandardMaterial({
            map: floorDiff,
            normalMap: floorNormal,
            roughnessMap: floorRough,
            roughness: 1,
            color: 0x332211
        });

        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            map: wallDiff,
            normalMap: wallNormal,
            roughnessMap: wallRough,
            roughness: 1,
            metalness: 0
        });
        this.wallMat = wallMat; // Expose for SecretSystem

        const ceilingMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            map: ceilDiff,
            normalMap: ceilNormal,
            aoMap: ceilARM,
            roughnessMap: ceilARM,
            metalnessMap: ceilARM,
            roughness: 1,
            metalness: 1
        });

        // Floor
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(this.size, this.size), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1.7;
        floor.userData.isRoomPart = true;
        this.floorGroup.add(floor);

        // Ceiling
        const ceilingGeom = new THREE.PlaneGeometry(this.size, this.size);
        ceilingGeom.setAttribute('uv2', ceilingGeom.attributes.uv.clone());
        const ceiling = new THREE.Mesh(ceilingGeom, ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = this.height - 1.7;
        ceiling.userData.isRoomPart = true;
        this.ceilingGroup.add(ceiling);

        // Walls
        const wallGeom = new THREE.PlaneGeometry(this.size, this.height);
        wallGeom.setAttribute('uv2', wallGeom.attributes.uv.clone());

        // Back wall
        const backWall = new THREE.Mesh(wallGeom, wallMat);
        backWall.position.set(0, this.height / 2 - 1.7, -this.size / 2);
        backWall.userData.isRoomPart = true;
        this.wallsGroup.add(backWall);

        // Front wall segments (with door hole)
        this.createFrontWall(wallMat);

        // Left wall
        const leftWall = new THREE.Mesh(wallGeom, wallMat);
        leftWall.position.set(-this.size / 2, this.height / 2 - 1.7, 0);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.userData.isRoomPart = true;
        this.wallsGroup.add(leftWall);

        // Right wall segments logic
        this.createRightWall(wallMat);

        // Trim
        this.createTrim();

        // Optimized: Disable auto-matrix updates for all static room parts
        this.group.traverse(node => {
            if (node.isMesh || node.isGroup) {
                node.updateMatrix();
                node.matrixAutoUpdate = false;
            }
        });
    }

    createFrontWall(wallMat) {
        const doorWidth = 1.6;
        const doorHeight = 3.5;
        const wallZ = this.size / 2;

        const createSegment = (w, h, px, py, hOffset, vOffset) => {
            const geom = new THREE.PlaneGeometry(w, h);
            const uvAttr = geom.attributes.uv;
            // UV correction for repeating texture across segments
            for (let i = 0; i < uvAttr.count; i++) {
                let u = uvAttr.getX(i);
                let v = uvAttr.getY(i);
                u = (hOffset + u * w) / this.size;
                v = (vOffset + v * h) / this.height;
                uvAttr.setXY(i, u, v);
            }
            const segment = new THREE.Mesh(geom, wallMat);
            segment.position.set(px, py, wallZ);
            segment.rotation.y = Math.PI;
            segment.userData.isRoomPart = true;
            this.wallsGroup.add(segment);
        };

        // Left of door
        const sideWidth = (this.size - doorWidth) / 2;
        createSegment(sideWidth, this.height, -this.size / 2 + sideWidth / 2, this.height / 2 - 1.7, 0, 0);
        
        // Right of door
        createSegment(sideWidth, this.height, this.size / 2 - sideWidth / 2, this.height / 2 - 1.7, sideWidth + doorWidth, 0);
        
        // Above door
        const topHeight = this.height - doorHeight;
        createSegment(doorWidth, topHeight, 0, (this.height - 1.7) - topHeight / 2, sideWidth, doorHeight);
    }

    createRightWall(wallMat) {
        const createWallSegment = (w, h, px, py, pz, hOffset = 0, vOffset = 0) => {
            const geom = new THREE.PlaneGeometry(w, h);
            const uvAttr = geom.attributes.uv;
            for (let i = 0; i < uvAttr.count; i++) {
                let u = uvAttr.getX(i);
                let v = uvAttr.getY(i);
                u = (hOffset + u * w) / this.size;
                v = (vOffset + v * h) / this.height;
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

        createWallSegment(this.size, this.height - (holeY + vSize / 2 + 1.7), this.size / 2, (this.height + holeY + vSize / 2 - 1.7) / 2, 0, 0, holeY + vSize / 2 + 1.7);
        createWallSegment(this.size, holeY - vSize / 2 + 1.7, this.size / 2, (holeY - vSize / 2 - 1.7) / 2, 0, 0, 0);
        createWallSegment(holeZ - hSize / 2 + this.size / 2, vSize, this.size / 2, holeY, (holeZ - hSize / 2 - this.size / 2) / 2, 0, holeY - vSize / 2 + 1.7);
        createWallSegment(this.size / 2 - (holeZ + hSize / 2), vSize, this.size / 2, holeY, (this.size / 2 + holeZ + hSize / 2) / 2, holeZ + hSize / 2 + this.size / 2, holeY - vSize / 2 + 1.7);
    }

    createTrim() {
        const trimMat = new THREE.MeshStandardMaterial({ color: 0x1a0f05 });
        const trimGeom = new THREE.BoxGeometry(this.size, 0.4, 0.05);

        const trimBack = new THREE.Mesh(trimGeom, trimMat);
        trimBack.position.set(0, 0.2 - 1.7, -this.size / 2 + 0.03);
        trimBack.userData.isRoomPart = true;
        this.wallsGroup.add(trimBack);

        const trimLeft = new THREE.Mesh(trimGeom, trimMat);
        trimLeft.rotation.y = Math.PI / 2;
        trimLeft.position.set(-this.size / 2 + 0.03, 0.2 - 1.7, 0);
        trimLeft.userData.isRoomPart = true;
        this.wallsGroup.add(trimLeft);

        const trimRight = new THREE.Mesh(trimGeom, trimMat);
        trimRight.rotation.y = -Math.PI / 2;
        trimRight.position.set(this.size / 2 - 0.03, 0.2 - 1.7, 0);
        trimRight.userData.isRoomPart = true;
        this.wallsGroup.add(trimRight);
    }
}
