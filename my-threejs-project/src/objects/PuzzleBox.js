import * as THREE from 'three';

export class PuzzleBox {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.init();
    }

    init() {
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x2b1d0e, // Very Dark Wood
            roughness: 0.9,
            metalness: 0.02
        });

        // --- Big Pentagonal Frustum ---
        // CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
        const frustumHeight = 0.6;
        const frustumGeom = new THREE.CylinderGeometry(0.3, 0.4, frustumHeight, 5);
        const frustum = new THREE.Mesh(frustumGeom, material);
        frustum.position.y = frustumHeight / 2;
        this.group.add(frustum);

        // --- Smaller Pyramid on Top ---
        const pyramidHeight = 0.3;
        const pyramidGeom = new THREE.CylinderGeometry(0, 0.3, pyramidHeight, 5);
        const pyramid = new THREE.Mesh(pyramidGeom, material);
        pyramid.position.y = frustumHeight + pyramidHeight / 2;
        this.group.add(pyramid);

        // Mark as puzzle part
        this.group.userData = { isPuzzleBox: true, isStaticPuzzlePart: true };

        // --- Darker Wood Stripes (Edges) ---
        const stripeMat = new THREE.MeshStandardMaterial({ 
            color: 0x120a05, 
            roughness: 1.0 
        });

        const createStripe = (p1, p2) => {
            const distance = p1.distanceTo(p2);
            const geom = new THREE.CylinderGeometry(0.015, 0.015, distance, 5);
            const mesh = new THREE.Mesh(geom, stripeMat);
            
            const center = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
            mesh.position.copy(center);
            
            const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
            mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            
            this.group.add(mesh);
        };

        const r0 = 0.402, r1 = 0.302, h1 = 0.6, h2 = 0.9;
        const p0 = [], p1 = [], p2 = new THREE.Vector3(0, h2, 0);

        for (let i = 0; i <= 5; i++) {
            const theta = (i / 5) * Math.PI * 2;
            // Three.js Cylinder uses (sin, cos) for vertices
            p0.push(new THREE.Vector3(Math.sin(theta) * r0, 0, Math.cos(theta) * r0));
            p1.push(new THREE.Vector3(Math.sin(theta) * r1, h1, Math.cos(theta) * r1));
        }

        for (let i = 0; i < 5; i++) {
            createStripe(p0[i], p0[i + 1]);       // Bottom
            createStripe(p1[i], p1[i + 1]);       // Middle
            createStripe(p0[i], p1[i]);           // Segments
            createStripe(p1[i], p2);              // Top
        }
    }

    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }
}
