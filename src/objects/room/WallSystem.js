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

        // Back wall (with secret hole behind angel statue)
        this.createBackWall(wallMat);

        // Front wall segments (with door hole)
        this.createFrontWall(wallMat);

        // Left wall
        const wallGeom = new THREE.PlaneGeometry(this.size, this.height);
        wallGeom.setAttribute('uv2', wallGeom.attributes.uv.clone());
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

    // The angel statue sits at world x=-4.2, z=-4.65 (against the back wall at z=-5).
    // We carve a rectangular hole in the back wall at that x position.
    createBackWall(wallMat) {
        const wallZ    = -this.size / 2;    // z = -5
        const wallW    = this.size;          // 10
        const wallH    = this.height;        // 6
        const wallLeft  = -this.size / 2;   // -5
        const wallRight =  this.size / 2;   // +5
        const floorY    = -1.7;

        // Hole parameters — centered on the angel (x=-4.2), starts at floor level
        const holeX  = -4.2;
        const holeW  =  1.4;
        const holeH  =  2.4;  // tall enough to walk through (conceptually)

        const holeLeft  = holeX - holeW / 2;
        const holeRight = holeX + holeW / 2;
        const holeBottom = floorY + 0.3; // Raised by 0.3 units
        const holeTop    = holeBottom + holeH;

        const wallTop    = floorY + wallH;
        const wallCenterY = floorY + wallH / 2;

        // Helper: add a rectangular wall segment defined by world-space x/y bounds
        const addSegment = (x0, x1, y0, y1) => {
            const w = x1 - x0;
            const h = y1 - y0;
            if (w <= 0.001 || h <= 0.001) return;

            const geom = new THREE.PlaneGeometry(w, h);
            const uvAttr = geom.attributes.uv;
            for (let i = 0; i < uvAttr.count; i++) {
                const u = ((x0 - wallLeft) + uvAttr.getX(i) * w) / wallW;
                const v = ((y0 - floorY)   + uvAttr.getY(i) * h) / wallH;
                uvAttr.setXY(i, u, v);
            }
            const mesh = new THREE.Mesh(geom, wallMat);
            mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, wallZ);
            mesh.userData.isRoomPart = true;
            this.wallsGroup.add(mesh);
        };

        // 1. Left slab  (full height, left of hole)
        addSegment(wallLeft,  holeLeft,  floorY, wallTop);

        // 2. Right slab (full height, right of hole)
        addSegment(holeRight, wallRight, floorY, wallTop);

        // 3. Top band above hole (between hole sides, above the opening)
        addSegment(holeLeft, holeRight, holeTop, wallTop);

        // 4. Bottom band below hole
        addSegment(holeLeft, holeRight, floorY, holeBottom);

        // Void recess — 5 planes (back + 4 sides), front face omitted so the hole is open
        const voidDepth = 1.2;
        const holeCenterY = (holeBottom + holeTop) / 2;
        const backZ = wallZ - voidDepth;

        const addVoidFace = (geom, rx, ry, x, y, z, isBack = false) => {
            const mesh = new THREE.Mesh(geom, wallMat);
            mesh.rotation.x = rx;
            mesh.rotation.y = ry;
            mesh.position.set(x, y, z);
            mesh.userData.isRoomPart = true;
            mesh.userData.isStaticPuzzlePart = true;
            if (isBack) {
                mesh.userData.isWallHole = true;
            } else {
                mesh.userData.isWallHoleInterior = true;
            }
            this.wallsGroup.add(mesh);
        };

        // Back face (faces +z towards room) — clickable zoom target
        addVoidFace(new THREE.PlaneGeometry(holeW, holeH), 0, 0, holeX, holeCenterY, backZ, true);


        // Floor (faces +y upward)
        addVoidFace(new THREE.PlaneGeometry(holeW, voidDepth), Math.PI / 2, 0, holeX, holeBottom, wallZ - voidDepth / 2);

        // Ceiling (faces -y downward)
        addVoidFace(new THREE.PlaneGeometry(holeW, voidDepth), -Math.PI / 2, 0, holeX, holeTop, wallZ - voidDepth / 2);

        // Left side (faces +x rightward, towards room interior)
        addVoidFace(new THREE.PlaneGeometry(voidDepth, holeH), 0, -Math.PI / 2, holeLeft, holeCenterY, wallZ - voidDepth / 2);

        // Right side (faces -x leftward, towards room interior)
        addVoidFace(new THREE.PlaneGeometry(voidDepth, holeH), 0, Math.PI / 2, holeRight, holeCenterY, wallZ - voidDepth / 2);
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
        const trimH   = 0.4;
        const trimD   = 0.05;
        const trimY   = 0.2 - 1.7;
        const backZ   = -this.size / 2 + 0.03;

        // Back wall trim — split around the hole opening (holeX=-4.2, holeW=1.4)
        // Hole spans x=-4.9 to x=-3.5 in world space
        const holeLeft  = -4.9;
        const holeRight = -3.5;
        const wallLeft  = -this.size / 2;  // -5
        const wallRight =  this.size / 2;  //  +5

        // Left piece: wallLeft to holeLeft
        const leftW = holeLeft - wallLeft;
        if (leftW > 0) {
            const trimBackLeft = new THREE.Mesh(new THREE.BoxGeometry(leftW, trimH, trimD), trimMat);
            trimBackLeft.position.set(wallLeft + leftW / 2, trimY, backZ);
            trimBackLeft.userData.isRoomPart = true;
            this.wallsGroup.add(trimBackLeft);
        }

        // Right piece: holeRight to wallRight
        const rightW = wallRight - holeRight;
        if (rightW > 0) {
            const trimBackRight = new THREE.Mesh(new THREE.BoxGeometry(rightW, trimH, trimD), trimMat);
            trimBackRight.position.set(holeRight + rightW / 2, trimY, backZ);
            trimBackRight.userData.isRoomPart = true;
            this.wallsGroup.add(trimBackRight);
        }

        const trimGeom = new THREE.BoxGeometry(this.size, trimH, trimD);

        const trimLeft = new THREE.Mesh(trimGeom, trimMat);
        trimLeft.rotation.y = Math.PI / 2;
        trimLeft.position.set(-this.size / 2 + 0.03, trimY, 0);
        trimLeft.userData.isRoomPart = true;
        this.wallsGroup.add(trimLeft);

        const trimRight = new THREE.Mesh(trimGeom, trimMat);
        trimRight.rotation.y = -Math.PI / 2;
        trimRight.position.set(this.size / 2 - 0.03, trimY, 0);
        trimRight.userData.isRoomPart = true;
        this.wallsGroup.add(trimRight);
    }
}

