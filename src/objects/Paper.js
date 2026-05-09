import * as THREE from 'three';
import { createPaperTexture } from '../utils/Textures.js';

export class Paper {
    constructor(text = "Default text", name = "Paper Note") {
        this.group = new THREE.Group();
        this.text = text;
        this.group.userData = {
            isStaticPuzzlePart: true,
            isZoomable: true,
            isPaper: true,
            name: name
        };
        this.init();
    }

    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }

    setRotation(x, y, z) {
        this.group.rotation.set(x, y, z);
    }

    init() {
        const texture = createPaperTexture(this.text);
        
        // Create a plane with segments so we can curl it
        const geometry = new THREE.PlaneGeometry(0.2, 0.3, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.9,
            metalness: 0.0,
            side: THREE.DoubleSide,
            transparent: true
        });

        this.mesh = new THREE.Mesh(geometry, material);
        
        // Add a very slight curve to the paper to make it look less like a computer graphic
        const pos = geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            
            // Gentle curl and randomness
            const curl = (Math.sin(x * 4) * 0.01) + (Math.cos(y * 4) * 0.01) + (Math.random() * 0.002);
            pos.setZ(i, curl);
        }
        pos.needsUpdate = true;
        geometry.computeVertexNormals();

        this.group.add(this.mesh);
        
        // Add a shadow-only mesh slightly below to simulate contact shadow if on a surface
        const shadowGeom = new THREE.PlaneGeometry(0.4, 0.5);
        const shadowMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
        shadowMesh.position.z = -0.005;
        this.group.add(shadowMesh);
    }

    updateText(newText) {
        this.text = newText;
        if (this.mesh.material.map) {
            this.mesh.material.map.dispose();
        }
        this.mesh.material.map = createPaperTexture(newText);
    }
}
