import * as THREE from 'three';

export class Room {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.init();
    }

    init() {
        const size = 10;
        const height = 6;

        // Materials
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x221100, // Dark wood/carpet
            roughness: 0.8,
            metalness: 0.1
        });

        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x3d4d3d, // Dark study green
            roughness: 0.9
        });

        const ceilingMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            roughness: 1
        });

        // Floor
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(size, size), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1.7; // Match existing floor position
        this.group.add(floor);

        // Ceiling
        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(size, size), ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = height - 1.7;
        this.group.add(ceiling);

        // Walls
        const wallGeom = new THREE.PlaneGeometry(size, height);

        // Back wall
        const backWall = new THREE.Mesh(wallGeom, wallMat);
        backWall.position.set(0, height / 2 - 1.7, -size / 2);
        this.group.add(backWall);

        // Front wall (behind camera)
        const frontWall = new THREE.Mesh(wallGeom, wallMat);
        frontWall.position.set(0, height / 2 - 1.7, size / 2);
        frontWall.rotation.y = Math.PI;
        this.group.add(frontWall);

        // Left wall
        const leftWall = new THREE.Mesh(wallGeom, wallMat);
        leftWall.position.set(-size / 2, height / 2 - 1.7, 0);
        leftWall.rotation.y = Math.PI / 2;
        this.group.add(leftWall);

        // Right wall
        const rightWall = new THREE.Mesh(wallGeom, wallMat);
        rightWall.position.set(size / 2, height / 2 - 1.7, 0);
        rightWall.rotation.y = -Math.PI / 2;
        this.group.add(rightWall);

        // Decorative wood trim (Baseboards)
        const trimMat = new THREE.MeshStandardMaterial({ color: 0x1a0f05 });
        const trimGeom = new THREE.BoxGeometry(size, 0.4, 0.05);

        const trimBack = new THREE.Mesh(trimGeom, trimMat);
        trimBack.position.set(0, 0.2 - 1.7, -size / 2 + 0.03);
        this.group.add(trimBack);

        const trimLeft = new THREE.Mesh(trimGeom, trimMat);
        trimLeft.rotation.y = Math.PI / 2;
        trimLeft.position.set(-size / 2 + 0.03, 0.2 - 1.7, 0);
        this.group.add(trimLeft);

        const trimRight = new THREE.Mesh(trimGeom, trimMat);
        trimRight.rotation.y = -Math.PI / 2;
        trimRight.position.set(size / 2 - 0.03, 0.2 - 1.7, 0);
        this.group.add(trimRight);

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
        this.group.add(shelf);

        // A small desk glued to the right wall
        const desk = new THREE.Group();
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 2.5), woodMat);
        top.position.y = 0.8;
        desk.add(top);
        const legGeom = new THREE.BoxGeometry(0.1, 0.8, 0.1);
        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(legGeom, woodMat);
            leg.position.set((i < 2 ? 0.7 : -0.7), 0.4, (i % 2 === 0 ? 1.1 : -1.1));
            desk.add(leg);
        }

        // Desk accessories
        const paper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.2), new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
        paper.position.set(0.2, 0.86, 0.5);
        paper.rotation.y = 0.2;
        desk.add(paper);

        const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0xaa8800, metalness: 0.8, roughness: 0.2 }));
        lampBase.position.set(-0.3, 0.85, -0.6);
        desk.add(lampBase);

        desk.position.set(size / 2 - 0.78, -1.7, 1);
        desk.rotation.y = -Math.PI / 2;
        this.group.add(desk);

        // --- Decorations ---
        // Library Carpet
        const carpet = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 4),
            new THREE.MeshStandardMaterial({ color: 0x661111, roughness: 0.9 })
        );
        carpet.rotation.x = -Math.PI / 2;
        carpet.position.y = -1.69; // Just slightly above floor
        this.group.add(carpet);

        // Paintings
        const frameMat = new THREE.MeshStandardMaterial({ color: 0xaa8800, metalness: 0.8, roughness: 0.2 });
        const paintMat = new THREE.MeshStandardMaterial({ color: 0x111111 }); // Black "paint" or placeholder

        const createPainting = (w, h, x, y, z, rotY) => {
            const pGroup = new THREE.Group();
            const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.05), frameMat);
            const canvas = new THREE.Mesh(new THREE.PlaneGeometry(w, h), paintMat);
            canvas.position.z = 0.031;
            pGroup.add(frame, canvas);
            pGroup.position.set(x, y, z);
            pGroup.rotation.y = rotY;
            return pGroup;
        };

        // Painting on the left wall
        this.group.add(createPainting(2, 1.5, -size / 2 + 0.03, 1, 0, Math.PI / 2));

        // Painting on the back wall (above shelf height but to the right)
        this.group.add(createPainting(1.5, 2, 2, 1.2, -size / 2 + 0.03, 0));

        // --- Big Pedestal Table ---
        const tableGroup = new THREE.Group();
        const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x1a0f05, roughness: 0.6 });

        // Solid pedestal base
        const pedestalBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.2, 16), darkWoodMat);
        tableGroup.add(pedestalBase);
        const column = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2, 16), darkWoodMat);
        column.position.y = 0.70;
        tableGroup.add(column);

        // Large table top
        const tableTop = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 1.5), darkWoodMat);
        tableTop.position.y = 1.75;
        tableGroup.add(tableTop);

        tableGroup.position.set(0, -1.7, 0); // Moved to the center
        tableGroup.userData = { isStaticPuzzlePart: true };
        this.table = tableGroup; // Expose it
        this.group.add(tableGroup);

        this.scene.add(this.group);
    }
}
