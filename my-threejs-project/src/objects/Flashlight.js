import * as THREE from 'three';
import { Item } from './Item.js';

export class Flashlight extends Item {
    constructor() {
        super('Old Flashlight');
        this.group.userData.isSmallProp = true;
        this.init();
    }

    init() {
        // --- Materials ---
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a, 
            metalness: 0.9, 
            roughness: 0.1 
        });
        const lensMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
        const rimMat = new THREE.MeshStandardMaterial({ color: 0xaa8800, metalness: 0.8 });

        // --- Main Body Cylinder ---
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.045, 0.04, 0.35, 32),
            bodyMat
        );
        body.rotation.z = Math.PI / 2; // Lie flat
        this.group.add(body);

        // --- Head/Lens Area ---
        const head = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.045, 0.08, 32),
            bodyMat
        );
        head.rotation.z = Math.PI / 2;
        head.position.x = 0.2; // Move to the end
        this.group.add(head);

        // --- Lens (Glowing part) ---
        const lens = new THREE.Mesh(
            new THREE.CircleGeometry(0.07, 32),
            lensMat
        );
        lens.rotation.y = Math.PI / 2;
        lens.position.x = 0.241;
        this.group.add(lens);

        // --- Switch ---
        const sw = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.015, 0.02),
            rimMat
        );
        sw.position.y = 0.05;
        // Label for interaction
        sw.userData = { isFlashlightSwitch: true };
        this.group.add(sw);
        this.switchMesh = sw;

        // --- Switch HitBox (Invisible, larger for easy clicking) ---
        const swHitBox = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
        );
        swHitBox.position.y = 0.05;
        swHitBox.userData = { isFlashlightSwitch: true };
        this.group.add(swHitBox);

        // --- Spot Light Beam (initially off) ---
        this.beam = new THREE.SpotLight(0xffffee, 0, 5, Math.PI / 8, 0.3, 1);
        this.beam.castShadow = true; // Enable shadows for the beam
        this.beam.shadow.mapSize.width = 512; 
        this.beam.shadow.mapSize.height = 512;
        this.beam.shadow.bias = -0.0001; // Fix Shadow Acne
        this.beam.shadow.normalBias = 0.02; // Fix Shadow Acne
        this.beam.position.set(0.24, 0, 0); // At the lens
        const beamTarget = new THREE.Object3D();
        beamTarget.position.set(2, 0, 0); 
        this.group.add(beamTarget);
        this.beam.target = beamTarget;
        this.group.add(this.beam);
        
        this.isOn = false;
    }

    toggle() {
        this.isOn = !this.isOn;
        if (this.isOn) {
            this.switchMesh.position.y = 0.042; // Clicks in
            this.beam.intensity = 1000;
        } else {
            this.switchMesh.position.y = 0.05;
            this.beam.intensity = 0;
        }
    }
}
